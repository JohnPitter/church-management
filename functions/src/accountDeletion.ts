/**
 * Account self-deletion — pure domain logic.
 *
 * This module has NO firebase imports so it can be unit tested with plain
 * `node --test` (see functions/test/accountDeletion.test.cjs). The callable in
 * `deleteOwnAccount.ts` injects the Firestore/Storage/Auth adapters.
 *
 * The data policy implemented here is mirrored in docs/exclusao-de-conta.md
 * (and in the public /privacidade page). Keep the three in sync.
 */

export const REMOVED_USER_NAME = 'Usuário removido';
export const MAX_BATCH_OPS = 450;
export const LAST_ADMIN_MESSAGE =
  'Você é o último administrador do sistema. Promova outro usuário a administrador antes de excluir sua conta.';
export const PROFESSIONAL_UNLINK_REASON = 'Conta de usuário excluída pelo próprio titular';

export class AccountDeletionError extends Error {
  constructor(public readonly code: 'failed-precondition' | 'unauthenticated', message: string) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

export type PatchValue =
  | { kind: 'set'; value: unknown }
  | { kind: 'deleteField' }
  | { kind: 'arrayRemove'; value: string }
  | { kind: 'now' };

export type Patch = Record<string, PatchValue>;

export interface QuerySpec {
  collection: string;
  field: string;
  op: '==' | 'array-contains';
  value: string;
}

export type CleanupStep =
  | { id: string; query: QuerySpec; action: 'delete' }
  | { id: string; query: QuerySpec; action: 'update'; patch: Patch };

export interface CleanupPlan {
  /** Query-driven deletes / anonymizations / unlinks, executed in order. */
  steps: CleanupStep[];
  /** Documents keyed directly by the uid. */
  docDeletes: Array<{ collection: string; id: string }>;
}

export type WriteOp<Ref> = { type: 'delete'; ref: Ref } | { type: 'update'; ref: Ref; patch: Patch };

export interface CleanupDeps<Ref> {
  /** Returns up to `limit` matching refs after `cursor` (null = first page) and the cursor of the last one. */
  fetchPage(query: QuerySpec, cursor: unknown, limit: number): Promise<{ refs: Ref[]; cursor: unknown }>;
  docRef(collection: string, id: string): Ref;
  /** Commits at most MAX_BATCH_OPS operations atomically. */
  commit(ops: WriteOp<Ref>[]): Promise<void>;
}

const set = (value: unknown): PatchValue => ({ kind: 'set', value });
const deleteField = (): PatchValue => ({ kind: 'deleteField' });
const arrayRemove = (value: string): PatchValue => ({ kind: 'arrayRemove', value });

/** Last-admin guard: an admin can only leave if another admin remains. */
export function isLastAdmin(role: unknown, adminCount: number): boolean {
  return role === 'admin' && adminCount <= 1;
}

export function assertNotLastAdmin(role: unknown, adminCount: number): void {
  if (isLastAdmin(role, adminCount)) {
    throw new AccountDeletionError('failed-precondition', LAST_ADMIN_MESSAGE);
  }
}

/** Emails are stored as typed (prayer requests) or lowercased (users/events): match both forms. */
export function normalizeEmails(emails: Array<string | null | undefined>): string[] {
  const result = new Set<string>();
  for (const email of emails) {
    const trimmed = (email || '').trim();
    if (!trimmed) continue;
    result.add(trimmed);
    result.add(trimmed.toLowerCase());
  }
  return Array.from(result);
}

export function chunk<T>(items: T[], size: number = MAX_BATCH_OPS): T[][] {
  if (size <= 0) throw new Error('chunk size must be positive');
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Builds the cleanup plan for `uid`.
 *
 * DELETED (personal data with no value to anyone else):
 *   notifications, forumNotifications (received), eventConfirmations (by userId and by the
 *   user's email), projectRegistrations, userDevotionalProgress, userPlanProgress, likes (blog),
 *   forumActivities, userForumProfiles, notificationPreferences/{uid}.
 * ANONYMIZED (community content kept so threads stay coherent; ids kept because other
 *   features key off them, e.g. forum like notifications):
 *   forumTopics/forumReplies (authorName -> "Usuário removido", authorEmail -> null, authorAvatar removed),
 *   comments (author.name -> "Usuário removido", author.photoURL removed),
 *   devotionalComments (userName -> "Usuário removido", userEmail -> null),
 *   prayerRequests sent with the user's email (name -> "Usuário removido", email/phone -> null),
 *   forumNotifications sent to others (triggeredByName -> "Usuário removido").
 *   The uid/email is also removed from like/bookmark/subscriber/prayedBy arrays.
 * UNLINKED: profissionaisAssistencia with userId == uid lose the link and are marked inactive;
 *   the professional record and its clinical history (fichas, sessões) are kept.
 * KEPT untouched: members, voluntarios, leaders (staff-managed roster records with no auth link,
 *   matched only by an email typed by staff), assistance/clinical, financial, attendance,
 *   pedagogy, audit/system logs and other institutional records.
 */
export function buildCleanupPlan(uid: string, emails: string[]): CleanupPlan {
  if (!uid) throw new Error('uid is required');
  const byUser = (collection: string, field = 'userId'): QuerySpec => ({ collection, field, op: '==', value: uid });
  const del = (id: string, query: QuerySpec): CleanupStep => ({ id, query, action: 'delete' });
  const upd = (id: string, query: QuerySpec, patch: Patch): CleanupStep => ({ id, query, action: 'update', patch });

  const steps: CleanupStep[] = [
    // --- Deletes -----------------------------------------------------------
    del('notifications', byUser('notifications')),
    del('forumNotifications', byUser('forumNotifications')),
    del('eventConfirmations', byUser('eventConfirmations')),
    ...emails.map(email =>
      del(`eventConfirmations:email:${email}`, { collection: 'eventConfirmations', field: 'userEmail', op: '==', value: email })
    ),
    del('projectRegistrations', byUser('projectRegistrations')),
    del('userDevotionalProgress', byUser('userDevotionalProgress')),
    del('userPlanProgress', byUser('userPlanProgress')),
    del('likes', byUser('likes')),
    del('forumActivities', byUser('forumActivities')),
    del('userForumProfiles', byUser('userForumProfiles')),

    // --- Anonymizations ----------------------------------------------------
    upd('forumTopics', byUser('forumTopics', 'authorId'), {
      authorName: set(REMOVED_USER_NAME), authorEmail: set(null), authorAvatar: deleteField()
    }),
    upd('forumReplies', byUser('forumReplies', 'authorId'), {
      authorName: set(REMOVED_USER_NAME), authorEmail: set(null), authorAvatar: deleteField()
    }),
    upd('comments', byUser('comments', 'author.id'), {
      'author.name': set(REMOVED_USER_NAME), 'author.photoURL': deleteField()
    }),
    upd('devotionalComments', byUser('devotionalComments'), {
      userName: set(REMOVED_USER_NAME), userEmail: set(null)
    }),
    upd('forumNotifications:triggeredBy', byUser('forumNotifications', 'triggeredBy'), {
      triggeredByName: set(REMOVED_USER_NAME)
    }),
    ...emails.map(email =>
      upd(`prayerRequests:email:${email}`, { collection: 'prayerRequests', field: 'email', op: '==', value: email }, {
        name: set(REMOVED_USER_NAME), email: set(null), phone: set(null)
      })
    ),

    // --- Remove identifiers from arrays -----------------------------------
    upd('forumTopics:likes', { collection: 'forumTopics', field: 'likes', op: 'array-contains', value: uid }, { likes: arrayRemove(uid) }),
    upd('forumReplies:likes', { collection: 'forumReplies', field: 'likes', op: 'array-contains', value: uid }, { likes: arrayRemove(uid) }),
    upd('devotionals:likes', { collection: 'devotionals', field: 'likes', op: 'array-contains', value: uid }, { likes: arrayRemove(uid) }),
    upd('devotionals:bookmarks', { collection: 'devotionals', field: 'bookmarks', op: 'array-contains', value: uid }, { bookmarks: arrayRemove(uid) }),
    upd('devotionalPlans:subscribers', { collection: 'devotionalPlans', field: 'subscribers', op: 'array-contains', value: uid }, { subscribers: arrayRemove(uid) }),
    ...emails.map(email =>
      upd(`prayerRequests:prayedBy:${email}`, { collection: 'prayerRequests', field: 'prayedBy', op: 'array-contains', value: email }, {
        prayedBy: arrayRemove(email)
      })
    ),

    // --- Unlink (keep clinical history) -----------------------------------
    upd('profissionaisAssistencia:unlink', byUser('profissionaisAssistencia'), {
      userId: deleteField(),
      status: set('inativo'),
      dataInativacao: { kind: 'now' },
      motivoInativacao: set(PROFESSIONAL_UNLINK_REASON),
      updatedAt: { kind: 'now' }
    })
  ];

  return {
    steps,
    docDeletes: [
      { collection: 'notificationPreferences', id: uid },
      { collection: 'userForumProfiles', id: uid }
    ]
  };
}

/**
 * Executes the plan with cursor pagination (so anonymized docs that still match the
 * query are not revisited) and batches of at most MAX_BATCH_OPS writes.
 * Idempotent: a re-run finds nothing left to delete and re-applies the same patches.
 */
export async function runCleanupPlan<Ref>(
  plan: CleanupPlan,
  deps: CleanupDeps<Ref>,
  pageSize: number = MAX_BATCH_OPS
): Promise<Record<string, number>> {
  const limit = Math.min(Math.max(1, pageSize), MAX_BATCH_OPS);
  const summary: Record<string, number> = {};

  for (const step of plan.steps) {
    let cursor: unknown = null;
    let total = 0;
    for (;;) {
      const page = await deps.fetchPage(step.query, cursor, limit);
      if (page.refs.length === 0) break;
      const ops: WriteOp<Ref>[] = page.refs.map(ref =>
        step.action === 'delete' ? { type: 'delete', ref } : { type: 'update', ref, patch: step.patch }
      );
      for (const batch of chunk(ops, MAX_BATCH_OPS)) await deps.commit(batch);
      total += page.refs.length;
      if (page.refs.length < limit) break;
      cursor = page.cursor;
    }
    summary[step.id] = total;
  }

  const docOps: WriteOp<Ref>[] = plan.docDeletes.map(d => ({ type: 'delete', ref: deps.docRef(d.collection, d.id) }));
  for (const batch of chunk(docOps, MAX_BATCH_OPS)) await deps.commit(batch);
  summary.docDeletes = docOps.length;

  return summary;
}

export interface DeleteOwnAccountDeps<Ref> extends CleanupDeps<Ref> {
  getUserProfile(uid: string): Promise<{ role?: unknown; email?: string | null } | null>;
  countAdmins(): Promise<number>;
  /** Auth email, or null when the auth user no longer exists. */
  getAuthEmail(uid: string): Promise<string | null>;
  /** Extra cleanup that cannot be expressed as a simple query (e.g. stream viewers). */
  extraCleanup?(uid: string): Promise<void>;
  deleteStorageFolder(prefix: string): Promise<void>;
  deleteUserDoc(uid: string): Promise<void>;
  /** Must tolerate "user not found". */
  deleteAuthUser(uid: string): Promise<void>;
}

/**
 * Orchestration, in an order that keeps a mid-failure recoverable:
 * guard -> Firestore cleanup -> Storage -> users/{uid} -> Auth user (LAST, so the user
 * can still log in and retry if anything before it fails).
 */
export async function deleteOwnAccountFlow<Ref>(uid: string | undefined, deps: DeleteOwnAccountDeps<Ref>) {
  if (!uid) throw new AccountDeletionError('unauthenticated', 'Usuário deve estar autenticado');

  const profile = await deps.getUserProfile(uid);
  if (profile?.role === 'admin') {
    assertNotLastAdmin(profile.role, await deps.countAdmins());
  }

  const authEmail = await deps.getAuthEmail(uid);
  const emails = normalizeEmails([profile?.email, authEmail]);

  const summary = await runCleanupPlan(buildCleanupPlan(uid, emails), deps);
  if (deps.extraCleanup) await deps.extraCleanup(uid);
  await deps.deleteStorageFolder(`profile-photos/${uid}/`);
  await deps.deleteUserDoc(uid);
  await deps.deleteAuthUser(uid);
  return summary;
}
