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
export const RECENT_LOGIN_MESSAGE =
  'Por segurança, confirme sua senha (ou sua conta Google) novamente e tente excluir a conta logo em seguida.';
export const PROFESSIONAL_UNLINK_REASON = 'Conta de usuário excluída pelo próprio titular';
/** The ID token's auth_time must be at most this old (seconds). */
export const REAUTH_MAX_AGE_SECONDS = 5 * 60;
/** Tombstone collection: blocks self-recreation of users/{uid} by stale sessions (see firestore.rules). */
export const TOMBSTONE_COLLECTION = 'deletedAccounts';

export type AccountDeletionReason = 'last-admin' | 'recent-login-required' | 'unauthenticated';

export class AccountDeletionError extends Error {
  constructor(
    public readonly code: 'failed-precondition' | 'unauthenticated',
    message: string,
    public readonly reason: AccountDeletionReason
  ) {
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

/**
 * Last-admin guard: an APPROVED admin can only leave if another approved admin remains.
 * `approvedAdminCount` counts users with role=='admin' && status=='approved' (caller included).
 */
export function isLastAdmin(role: unknown, status: unknown, approvedAdminCount: number): boolean {
  return role === 'admin' && status === 'approved' && approvedAdminCount <= 1;
}

export function assertNotLastAdmin(role: unknown, status: unknown, approvedAdminCount: number): void {
  if (isLastAdmin(role, status, approvedAdminCount)) {
    throw new AccountDeletionError('failed-precondition', LAST_ADMIN_MESSAGE, 'last-admin');
  }
}

/** Server-side re-authentication: the token's auth_time (seconds) must be recent. */
export function isRecentLogin(authTimeSeconds: unknown, nowSeconds: number, maxAgeSeconds = REAUTH_MAX_AGE_SECONDS): boolean {
  if (typeof authTimeSeconds !== 'number' || !Number.isFinite(authTimeSeconds)) return false;
  const age = nowSeconds - authTimeSeconds;
  return age <= maxAgeSeconds && age >= -60; // small tolerance for clock skew
}

export function assertRecentLogin(authTimeSeconds: unknown, nowSeconds: number): void {
  if (!isRecentLogin(authTimeSeconds, nowSeconds)) {
    throw new AccountDeletionError('unauthenticated', RECENT_LOGIN_MESSAGE, 'recent-login-required');
  }
}

/**
 * forumTopics.lastReplyBy stores only the replier's NAME (no id). A topic is anonymized when the
 * user replied to it and its lastReplyBy equals one of the user's names. Another person with the
 * exact same name being the last replier would also be anonymized: a privacy-safe false positive.
 */
export function findTopicsWithUserAsLastReplier(
  userReplies: Array<{ topicId?: unknown; authorName?: unknown }>,
  topics: Array<{ id: string; lastReplyBy?: unknown }>,
  extraNames: Array<string | null | undefined> = []
): string[] {
  const names = new Set<string>();
  for (const name of [...userReplies.map(reply => reply.authorName), ...extraNames]) {
    if (typeof name === 'string' && name.trim() && name !== REMOVED_USER_NAME) names.add(name);
  }
  const repliedTopics = new Set(
    userReplies.map(reply => reply.topicId).filter((id): id is string => typeof id === 'string')
  );
  return topics
    .filter(topic => repliedTopics.has(topic.id) && typeof topic.lastReplyBy === 'string' && names.has(topic.lastReplyBy))
    .map(topic => topic.id);
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
 *   forumTopics.lastReplyBy where the user was the last replier (done by the flow via
 *   findTopicsWithUserAsLastReplier, before replies are anonymized),
 *   comments (author.name -> "Usuário removido", author.photoURL removed),
 *   devotionalComments (userName -> "Usuário removido", userEmail -> null),
 *   prayerRequests sent with the user's email (name -> "Usuário removido", email/phone -> null),
 *   forumNotifications sent to others (triggeredByName -> "Usuário removido").
 *   The uid/email is also removed from like/bookmark/subscriber/prayedBy arrays.
 * UNLINKED: profissionaisAssistencia with userId == uid lose the link and are marked inactive;
 *   the professional record and its clinical history (fichas, sessões) are kept.
 * KEPT untouched: members, voluntarios, leaders (staff-managed roster records with no auth link,
 *   matched only by an email typed by staff), blogPosts/devotionals authored by staff (the byline
 *   stays until the administration edits it), assistance/clinical, financial, attendance,
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

export interface UserProfileSnapshot {
  role?: unknown;
  status?: unknown;
  email?: string | null;
  displayName?: string | null;
}

export interface DeleteOwnAccountDeps<Ref> extends CleanupDeps<Ref> {
  getUserProfile(uid: string): Promise<UserProfileSnapshot | null>;
  /** Number of users with role=='admin' && status=='approved'. */
  countApprovedAdmins(): Promise<number>;
  /** Auth email, or null when the auth user no longer exists. */
  getAuthEmail(uid: string): Promise<string | null>;
  /** Anonymizes forumTopics.lastReplyBy where the user was the last replier (runs before replies are anonymized). */
  anonymizeLastReplies?(uid: string, knownNames: string[]): Promise<void>;
  /** Extra cleanup that cannot be expressed as a simple query (e.g. stream viewers). */
  extraCleanup?(uid: string): Promise<void>;
  deleteStorageFolder(prefix: string): Promise<void>;
  /** Writes deletedAccounts/{uid} (server timestamp only, no PII). */
  writeTombstone(uid: string): Promise<void>;
  deleteTombstone(uid: string): Promise<void>;
  deleteUserDoc(uid: string): Promise<void>;
  /** Must tolerate "user not found". */
  deleteAuthUser(uid: string): Promise<void>;
}

export interface CallerContext {
  uid?: string;
  /** auth_time claim of the caller's ID token (seconds since epoch). */
  authTime?: unknown;
  nowSeconds: number;
}

/**
 * Orchestration, in an order that keeps a mid-failure recoverable:
 * recent-login check -> last-admin guard -> Firestore cleanup -> Storage -> tombstone ->
 * users/{uid} -> Auth user (LAST, so the user can still log in and retry if anything before
 * it fails). If deleting the Auth user fails, the tombstone is removed (best effort) so the
 * profile can be recreated on the next login and the deletion retried.
 */
export async function deleteOwnAccountFlow<Ref>(caller: CallerContext, deps: DeleteOwnAccountDeps<Ref>) {
  const uid = caller.uid;
  if (!uid) throw new AccountDeletionError('unauthenticated', 'Usuário deve estar autenticado', 'unauthenticated');
  assertRecentLogin(caller.authTime, caller.nowSeconds);

  const profile = await deps.getUserProfile(uid);
  if (profile?.role === 'admin' && profile?.status === 'approved') {
    assertNotLastAdmin(profile.role, profile.status, await deps.countApprovedAdmins());
  }

  const authEmail = await deps.getAuthEmail(uid);
  const emails = normalizeEmails([profile?.email, authEmail]);

  if (deps.anonymizeLastReplies) {
    await deps.anonymizeLastReplies(uid, profile?.displayName ? [profile.displayName] : []);
  }
  const summary = await runCleanupPlan(buildCleanupPlan(uid, emails), deps);
  if (deps.extraCleanup) await deps.extraCleanup(uid);
  await deps.deleteStorageFolder(`profile-photos/${uid}/`);
  await deps.writeTombstone(uid);
  await deps.deleteUserDoc(uid);
  try {
    await deps.deleteAuthUser(uid);
  } catch (error) {
    try {
      await deps.deleteTombstone(uid);
    } catch {
      // best effort: the original error is the one reported
    }
    throw error;
  }
  return summary;
}
