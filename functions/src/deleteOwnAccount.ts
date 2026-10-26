/**
 * deleteOwnAccount — lets an authenticated user permanently delete THEIR OWN account.
 *
 * Security: the target is always `context.auth.uid`; no uid is accepted from the client.
 * The admin-only `deleteUserAccount` (index.ts) is a different flow and is unchanged.
 *
 * Order (each step idempotent, so re-running after a partial failure completes the job):
 *   1. Recent login: the ID token's auth_time must be <= 5 minutes old, otherwise
 *      HttpsError unauthenticated (details.reason = 'recent-login-required').
 *   2. Last-admin guard: an approved admin cannot leave if no other approved admin exists
 *      (HttpsError failed-precondition, details.reason = 'last-admin').
 *   3. Firestore cleanup (see buildCleanupPlan in accountDeletion.ts):
 *      - DELETED: notifications, forumNotifications (received), eventConfirmations (by uid and
 *        by the user's email), projectRegistrations, userDevotionalProgress, userPlanProgress,
 *        likes, forumActivities, userForumProfiles, notificationPreferences/{uid},
 *        streamViewers/{stream}/viewers/{uid}.
 *      - ANONYMIZED ("Usuário removido", email/phone -> null, photo removed): forumTopics,
 *        forumReplies, forumTopics.lastReplyBy where the user replied last, comments,
 *        devotionalComments, prayerRequests sent with the user's email, forumNotifications
 *        triggered by the user, streamViewers/{stream}/totalViewers/{uid}.
 *        The uid/email is removed from likes/bookmarks/subscribers/prayedBy arrays.
 *      - UNLINKED: profissionaisAssistencia.userId removed and the record set to "inativo"
 *        (clinical history — fichas, sessões, atendimentos — is kept).
 *      - KEPT: members, voluntarios, leaders (staff-managed records with no auth link),
 *        blogPosts/devotionals bylines, assistance/clinical, financial, attendance, pedagogy,
 *        audit and system logs.
 *   4. Storage: profile-photos/{uid}/.
 *   5. Tombstone deletedAccounts/{uid} ({deletedAt} only). firestore.rules refuses the
 *      self-registration create of users/{uid} while it exists, so stale sessions (other tabs,
 *      mobile, lost responses — ID tokens stay valid ~1h) cannot recreate the profile.
 *   6. users/{uid}.
 *   7. Firebase Auth user — LAST, so a failure earlier leaves the user able to log in and retry.
 *      If this step fails, the tombstone is removed (best effort) so a retry is possible.
 *
 * Audit: functions.logger records only the uid and a timestamp.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
// Modular import: `admin.firestore.FieldValue` was undefined at runtime in the emulator run
// (firebase-admin v13 + namespace import) — caught by test/accountDeletion.emulator.cjs.
import { FieldValue } from 'firebase-admin/firestore';
import {
  AccountDeletionError,
  MAX_BATCH_OPS,
  Patch,
  REMOVED_USER_NAME,
  TOMBSTONE_COLLECTION,
  UserProfileSnapshot,
  WriteOp,
  chunk,
  deleteOwnAccountFlow,
  findTopicsWithUserAsLastReplier
} from './accountDeletion';

type Ref = admin.firestore.DocumentReference;

function toFirestorePatch(patch: Patch): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(patch)) {
    switch (value.kind) {
      case 'set': result[field] = value.value; break;
      case 'deleteField': result[field] = FieldValue.delete(); break;
      case 'arrayRemove': result[field] = FieldValue.arrayRemove(value.value); break;
      case 'now': result[field] = FieldValue.serverTimestamp(); break;
    }
  }
  return result;
}

async function cleanupStreamViewers(db: admin.firestore.Firestore, uid: string): Promise<void> {
  // streamViewers/{streamId} parents may not exist as documents; listDocuments() still returns them.
  const streams = await db.collection('streamViewers').listDocuments();
  for (const streams450 of chunk(streams, MAX_BATCH_OPS)) {
    const deleteBatch = db.batch();
    streams450.forEach(stream => deleteBatch.delete(stream.collection('viewers').doc(uid)));
    await deleteBatch.commit();

    const totalRefs = streams450.map(stream => stream.collection('totalViewers').doc(uid));
    const snapshots = totalRefs.length ? await db.getAll(...totalRefs) : [];
    const existing = snapshots.filter(snapshot => snapshot.exists);
    if (existing.length) {
      const updateBatch = db.batch();
      existing.forEach(snapshot => updateBatch.update(snapshot.ref, { displayName: REMOVED_USER_NAME }));
      await updateBatch.commit();
    }
  }
}

async function anonymizeForumLastReplies(db: admin.firestore.Firestore, uid: string, knownNames: string[]): Promise<void> {
  const replies: Array<{ topicId?: unknown; authorName?: unknown }> = [];
  let cursor: admin.firestore.QueryDocumentSnapshot | null = null;
  for (;;) {
    let q = db.collection('forumReplies').where('authorId', '==', uid).select('topicId', 'authorName').limit(MAX_BATCH_OPS);
    if (cursor) q = q.startAfter(cursor);
    const page = await q.get();
    page.docs.forEach(doc => replies.push(doc.data()));
    if (page.docs.length < MAX_BATCH_OPS) break;
    cursor = page.docs[page.docs.length - 1];
  }
  const topicIds = Array.from(new Set(replies.map(reply => reply.topicId).filter((id): id is string => typeof id === 'string' && !!id)));
  for (const ids of chunk(topicIds, MAX_BATCH_OPS)) {
    const snapshots = await db.getAll(...ids.map(id => db.collection('forumTopics').doc(id)));
    const topics = snapshots.filter(s => s.exists).map(s => ({ id: s.id, lastReplyBy: s.get('lastReplyBy') }));
    const toUpdate = findTopicsWithUserAsLastReplier(replies, topics, knownNames);
    if (!toUpdate.length) continue;
    const batch = db.batch();
    toUpdate.forEach(id => batch.update(db.collection('forumTopics').doc(id), { lastReplyBy: REMOVED_USER_NAME }));
    await batch.commit();
  }
}

function isAuthUserNotFound(error: unknown): boolean {
  return (error as { code?: string })?.code === 'auth/user-not-found';
}

export const deleteOwnAccount = functions
  .region('southamerica-east1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado', { reason: 'unauthenticated' });
    }
    const uid = context.auth.uid;
    const db = admin.firestore();

    try {
      await deleteOwnAccountFlow<Ref>({
        uid,
        authTime: context.auth.token.auth_time,
        nowSeconds: Math.floor(Date.now() / 1000)
      }, {
        async fetchPage(query, cursor, limit) {
          let q = db.collection(query.collection).where(query.field, query.op, query.value).limit(limit);
          if (cursor) q = q.startAfter(cursor as admin.firestore.DocumentSnapshot);
          const snapshot = await q.get();
          return { refs: snapshot.docs.map(doc => doc.ref), cursor: snapshot.docs[snapshot.docs.length - 1] ?? null };
        },
        docRef: (collection, id) => db.collection(collection).doc(id),
        async commit(ops: WriteOp<Ref>[]) {
          const batch = db.batch();
          for (const op of ops) {
            if (op.type === 'delete') batch.delete(op.ref);
            else batch.update(op.ref, toFirestorePatch(op.patch));
          }
          await batch.commit();
        },
        async getUserProfile(id) {
          const snapshot = await db.collection('users').doc(id).get();
          return snapshot.exists ? (snapshot.data() as UserProfileSnapshot) : null;
        },
        async countApprovedAdmins() {
          const aggregate = await db.collection('users')
            .where('role', '==', 'admin')
            .where('status', '==', 'approved')
            .count()
            .get();
          return aggregate.data().count;
        },
        async getAuthEmail(id) {
          try {
            return (await admin.auth().getUser(id)).email ?? null;
          } catch (error) {
            if (isAuthUserNotFound(error)) return null;
            throw error;
          }
        },
        anonymizeLastReplies: (id, names) => anonymizeForumLastReplies(db, id, names),
        extraCleanup: id => cleanupStreamViewers(db, id),
        async deleteStorageFolder(prefix) {
          await admin.storage().bucket().deleteFiles({ prefix });
        },
        async writeTombstone(id) {
          await db.collection(TOMBSTONE_COLLECTION).doc(id).set({ deletedAt: FieldValue.serverTimestamp() });
        },
        async deleteTombstone(id) {
          await db.collection(TOMBSTONE_COLLECTION).doc(id).delete();
        },
        async deleteUserDoc(id) {
          await db.collection('users').doc(id).delete();
        },
        async deleteAuthUser(id) {
          try {
            await admin.auth().deleteUser(id);
          } catch (error) {
            if (!isAuthUserNotFound(error)) throw error;
          }
        }
      });

      functions.logger.info('Own account deleted', { uid, deletedAt: new Date().toISOString() });
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof AccountDeletionError) {
        throw new functions.https.HttpsError(error.code, error.message, { reason: error.reason });
      }
      functions.logger.error('Own account deletion failed', {
        uid,
        at: new Date().toISOString(),
        error: (error as Error)?.message
      });
      throw new functions.https.HttpsError(
        'internal',
        'Não foi possível concluir a exclusão da sua conta. Tente novamente em alguns minutos.'
      );
    }
  });
