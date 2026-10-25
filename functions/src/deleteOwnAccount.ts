/**
 * deleteOwnAccount — lets an authenticated user permanently delete THEIR OWN account.
 *
 * Security: the target is always `context.auth.uid`; no uid is accepted from the client.
 * The admin-only `deleteUserAccount` (index.ts) is a different flow and is unchanged.
 *
 * Order (each step idempotent, so re-running after a partial failure completes the job):
 *   1. Last-admin guard: an admin cannot delete the account if no other admin exists
 *      (HttpsError failed-precondition).
 *   2. Firestore cleanup (see buildCleanupPlan in accountDeletion.ts):
 *      - DELETED: notifications, forumNotifications (received), eventConfirmations (by uid and
 *        by the user's email), projectRegistrations, userDevotionalProgress, userPlanProgress,
 *        likes, forumActivities, userForumProfiles, notificationPreferences/{uid},
 *        streamViewers/{stream}/viewers/{uid}.
 *      - ANONYMIZED ("Usuário removido", email/phone -> null, photo removed): forumTopics,
 *        forumReplies, comments, devotionalComments, prayerRequests sent with the user's email,
 *        forumNotifications triggered by the user, streamViewers/{stream}/totalViewers/{uid}.
 *        The uid/email is removed from likes/bookmarks/subscribers/prayedBy arrays.
 *      - UNLINKED: profissionaisAssistencia.userId removed and the record set to "inativo"
 *        (clinical history — fichas, sessões, atendimentos — is kept).
 *      - KEPT: members, voluntarios, leaders (staff-managed records with no auth link),
 *        assistance/clinical, financial, attendance, pedagogy, audit and system logs.
 *   3. Storage: profile-photos/{uid}/.
 *   4. users/{uid}.
 *   5. Firebase Auth user — LAST, so a failure earlier leaves the user able to log in and retry.
 *
 * Audit: functions.logger records only the uid and a timestamp.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
  AccountDeletionError,
  MAX_BATCH_OPS,
  Patch,
  REMOVED_USER_NAME,
  WriteOp,
  chunk,
  deleteOwnAccountFlow
} from './accountDeletion';

type Ref = admin.firestore.DocumentReference;

function toFirestorePatch(patch: Patch): Record<string, unknown> {
  const FieldValue = admin.firestore.FieldValue;
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

function isAuthUserNotFound(error: unknown): boolean {
  return (error as { code?: string })?.code === 'auth/user-not-found';
}

export const deleteOwnAccount = functions
  .region('southamerica-east1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();

    try {
      await deleteOwnAccountFlow<Ref>(uid, {
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
          return snapshot.exists ? (snapshot.data() as { role?: unknown; email?: string }) : null;
        },
        async countAdmins() {
          const aggregate = await db.collection('users').where('role', '==', 'admin').count().get();
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
        extraCleanup: id => cleanupStreamViewers(db, id),
        async deleteStorageFolder(prefix) {
          await admin.storage().bucket().deleteFiles({ prefix });
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
        throw new functions.https.HttpsError(error.code, error.message);
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
