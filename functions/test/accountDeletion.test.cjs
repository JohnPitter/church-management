const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  AccountDeletionError, LAST_ADMIN_MESSAGE, RECENT_LOGIN_MESSAGE, MAX_BATCH_OPS, REMOVED_USER_NAME, REAUTH_MAX_AGE_SECONDS,
  assertNotLastAdmin, isLastAdmin, isRecentLogin, assertRecentLogin, findTopicsWithUserAsLastReplier,
  normalizeEmails, chunk, buildCleanupPlan, runCleanupPlan, deleteOwnAccountFlow
} = require('../lib/accountDeletion');

// In-memory Firestore fake: refs are "collection/id" strings, docs are plain objects.
function createFakeDb(seed = {}) {
  const store = new Map();
  for (const [collection, docs] of Object.entries(seed)) {
    for (const [id, data] of Object.entries(docs)) store.set(`${collection}/${id}`, structuredClone(data));
  }
  const getPath = (data, path) => path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), data);
  const setPath = (data, path, value) => {
    const keys = path.split('.');
    let target = data;
    for (const key of keys.slice(0, -1)) target = target[key] ??= {};
    if (value === undefined) delete target[keys[keys.length - 1]];
    else target[keys[keys.length - 1]] = value;
  };
  const commits = [];
  const deps = {
    async fetchPage(query, cursor, limit) {
      const refs = [...store.keys()]
        .filter(ref => ref.startsWith(`${query.collection}/`))
        .sort()
        .filter(ref => cursor == null || ref > cursor)
        .filter(ref => {
          const value = getPath(store.get(ref), query.field);
          return query.op === '==' ? value === query.value : Array.isArray(value) && value.includes(query.value);
        })
        .slice(0, limit);
      return { refs, cursor: refs[refs.length - 1] ?? null };
    },
    docRef: (collection, id) => `${collection}/${id}`,
    async commit(ops) {
      assert.ok(ops.length <= MAX_BATCH_OPS, `batch too large: ${ops.length}`);
      commits.push(ops.length);
      for (const op of ops) {
        if (op.type === 'delete') { store.delete(op.ref); continue; }
        if (!store.has(op.ref)) throw new Error(`NOT_FOUND ${op.ref}`);
        const data = store.get(op.ref);
        for (const [field, value] of Object.entries(op.patch)) {
          if (value.kind === 'set') setPath(data, field, value.value);
          else if (value.kind === 'deleteField') setPath(data, field, undefined);
          else if (value.kind === 'now') setPath(data, field, 'NOW');
          else if (value.kind === 'arrayRemove') setPath(data, field, (getPath(data, field) || []).filter(v => v !== value.value));
        }
      }
    }
  };
  return { store, deps, commits };
}

test('guarda do último admin: bloqueia somente admin aprovado sem outro admin aprovado', () => {
  assert.equal(isLastAdmin('admin', 'approved', 1), true);
  assert.equal(isLastAdmin('admin', 'approved', 0), true);
  assert.equal(isLastAdmin('admin', 'approved', 2), false);
  assert.equal(isLastAdmin('admin', 'pending', 1), false);
  assert.equal(isLastAdmin('member', 'approved', 1), false);
  assert.equal(isLastAdmin(undefined, undefined, 0), false);
  assert.throws(() => assertNotLastAdmin('admin', 'approved', 1), err => err instanceof AccountDeletionError && err.code === 'failed-precondition' && err.reason === 'last-admin' && err.message === LAST_ADMIN_MESSAGE);
  assert.doesNotThrow(() => assertNotLastAdmin('admin', 'approved', 2));
});

test('reautenticação recente: auth_time de no máximo 5 minutos', () => {
  const now = 1_800_000_000;
  assert.equal(isRecentLogin(now - 10, now), true);
  assert.equal(isRecentLogin(now - REAUTH_MAX_AGE_SECONDS, now), true);
  assert.equal(isRecentLogin(now - REAUTH_MAX_AGE_SECONDS - 1, now), false);
  assert.equal(isRecentLogin(undefined, now), false);
  assert.equal(isRecentLogin('123', now), false);
  assert.equal(isRecentLogin(now + 3600, now), false);
  assert.throws(() => assertRecentLogin(now - 3600, now), err => err.code === 'unauthenticated' && err.reason === 'recent-login-required' && err.message === RECENT_LOGIN_MESSAGE);
});

test('lastReplyBy: só tópicos em que o usuário respondeu e é o último a responder', () => {
  const replies = [{ topicId: 't1', authorName: 'Ana' }, { topicId: 't2', authorName: 'Ana' }, { topicId: 't4', authorName: 'Ana Souza' }];
  const topics = [
    { id: 't1', lastReplyBy: 'Ana' },
    { id: 't2', lastReplyBy: 'Bia' },
    { id: 't3', lastReplyBy: 'Ana' },
    { id: 't4', lastReplyBy: 'Ana Souza' },
    { id: 't5' }
  ];
  assert.deepEqual(findTopicsWithUserAsLastReplier(replies, topics), ['t1', 't4']);
  assert.deepEqual(findTopicsWithUserAsLastReplier([{ topicId: 't2', authorName: REMOVED_USER_NAME }], [{ id: 't2', lastReplyBy: 'Bia' }], ['Bia']), ['t2']);
  assert.deepEqual(findTopicsWithUserAsLastReplier([{ topicId: 't1', authorName: REMOVED_USER_NAME }], [{ id: 't1', lastReplyBy: REMOVED_USER_NAME }]), []);
});

test('normalizeEmails mantém forma digitada e minúscula, sem vazios/duplicados', () => {
  assert.deepEqual(normalizeEmails([' Ana@X.com ', 'ana@x.com', null, '', undefined]), ['Ana@X.com', 'ana@x.com']);
});

test('chunk respeita o limite de 450 operações', () => {
  const sizes = chunk(Array.from({ length: 1000 }, (_, i) => i)).map(c => c.length);
  assert.deepEqual(sizes, [450, 450, 100]);
  assert.throws(() => chunk([1], 0));
});

test('plano cobre exclusões, anonimizações, desvinculação e nunca toca registros institucionais', () => {
  const plan = buildCleanupPlan('u1', ['a@x.com']);
  const deletes = plan.steps.filter(s => s.action === 'delete').map(s => s.query.collection);
  for (const c of ['notifications', 'forumNotifications', 'eventConfirmations', 'projectRegistrations', 'userDevotionalProgress', 'userPlanProgress', 'likes']) {
    assert.ok(deletes.includes(c), `delete ${c}`);
  }
  const updated = plan.steps.filter(s => s.action === 'update').map(s => s.query.collection);
  for (const c of ['forumTopics', 'forumReplies', 'comments', 'devotionalComments', 'prayerRequests', 'profissionaisAssistencia']) {
    assert.ok(updated.includes(c), `update ${c}`);
  }
  assert.deepEqual(plan.docDeletes, [{ collection: 'notificationPreferences', id: 'u1' }, { collection: 'userForumProfiles', id: 'u1' }]);
  const touched = new Set(plan.steps.map(s => s.query.collection));
  for (const kept of ['members', 'voluntarios', 'leaders', 'users', 'transactions', 'assistidos', 'fichasAcompanhamento', 'auditLogs']) {
    assert.ok(!touched.has(kept), `must keep ${kept}`);
  }
  // Every update step only targets the caller (uid or the caller's email).
  for (const step of plan.steps) assert.ok(['u1', 'a@x.com'].includes(step.query.value));
});

const seed = () => ({
  notifications: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`n${String(i).padStart(4, '0')}`, { userId: i % 2 ? 'u1' : 'u2' }])),
  likes: { l1: { userId: 'u1' }, l2: { userId: 'u2' } },
  notificationPreferences: { u1: { push: true }, u2: { push: true } },
  forumTopics: Object.fromEntries(Array.from({ length: 460 }, (_, i) => [`t${String(i).padStart(4, '0')}`, { authorId: 'u1', authorName: 'Ana', authorEmail: 'a@x.com', authorAvatar: 'http://p', likes: ['u1', 'u2'] }])),
  comments: { c1: { author: { id: 'u1', name: 'Ana', photoURL: 'http://p' } }, c2: { author: { id: 'u2', name: 'Bia' } } },
  prayerRequests: { p1: { name: 'Ana', email: 'a@x.com', phone: '11', prayedBy: [] }, p2: { name: 'Bia', email: 'b@x.com', prayedBy: ['a@x.com', 'c@x.com'] } },
  profissionaisAssistencia: { pr1: { userId: 'u1', status: 'ativo', nome: 'Ana' } },
  members: { m1: { email: 'a@x.com', nome: 'Ana' } }
});

test('runCleanupPlan apaga/anonimiza com paginação por cursor e lotes <= 450, sem afetar outros usuários', async () => {
  const { store, deps, commits } = createFakeDb(seed());
  const summary = await runCleanupPlan(buildCleanupPlan('u1', ['a@x.com']), deps);

  assert.equal(summary.notifications, 500);
  assert.equal([...store.keys()].filter(k => k.startsWith('notifications/')).length, 500);
  assert.ok([...store.keys()].filter(k => k.startsWith('notifications/')).every(k => store.get(k).userId === 'u2'));
  assert.ok(!store.has('likes/l1') && store.has('likes/l2'));
  assert.ok(!store.has('notificationPreferences/u1') && store.has('notificationPreferences/u2'));

  // 460 matching topics still match authorId after the update: cursor must stop the loop.
  assert.equal(summary.forumTopics, 460);
  const topic = store.get('forumTopics/t0000');
  assert.equal(topic.authorName, REMOVED_USER_NAME);
  assert.equal(topic.authorEmail, null);
  assert.ok(!('authorAvatar' in topic));
  assert.equal(topic.authorId, 'u1');
  assert.deepEqual(topic.likes, ['u2']);

  assert.deepEqual(store.get('comments/c1').author, { id: 'u1', name: REMOVED_USER_NAME });
  assert.equal(store.get('comments/c2').author.name, 'Bia');
  assert.deepEqual(store.get('prayerRequests/p1'), { name: REMOVED_USER_NAME, email: null, phone: null, prayedBy: [] });
  assert.deepEqual(store.get('prayerRequests/p2').prayedBy, ['c@x.com']);
  assert.equal(store.get('prayerRequests/p2').name, 'Bia');

  const pro = store.get('profissionaisAssistencia/pr1');
  assert.ok(!('userId' in pro));
  assert.equal(pro.status, 'inativo');
  assert.equal(pro.nome, 'Ana');
  assert.deepEqual(store.get('members/m1'), { email: 'a@x.com', nome: 'Ana' });
  assert.ok(commits.every(size => size <= MAX_BATCH_OPS));
});

test('runCleanupPlan é idempotente: segunda execução não apaga nada e não falha', async () => {
  const { deps } = createFakeDb(seed());
  const plan = buildCleanupPlan('u1', ['a@x.com']);
  await runCleanupPlan(plan, deps);
  const second = await runCleanupPlan(plan, deps);
  assert.equal(second.notifications, 0);
  assert.equal(second.likes, 0);
  assert.equal(second['prayerRequests:email:a@x.com'], 0);
});

const NOW = 1_800_000_000;
const fresh = uid => ({ uid, authTime: NOW - 30, nowSeconds: NOW });

function flowDeps(fake, { role = 'member', status = 'approved', admins = 1, authEmail = 'a@x.com', failAt } = {}) {
  const calls = [];
  const step = name => async () => { calls.push(name); if (failAt === name) throw new Error(`boom ${name}`); };
  return {
    calls,
    deps: {
      ...fake.deps,
      async commit(ops) { calls.push('firestore'); return fake.deps.commit(ops); },
      async getUserProfile() { calls.push('profile'); return { role, status, email: 'a@x.com', displayName: 'Ana' }; },
      async countApprovedAdmins() { calls.push('countApprovedAdmins'); return admins; },
      async getAuthEmail() { calls.push('authEmail'); return authEmail; },
      anonymizeLastReplies: async (uid, names) => { calls.push(`lastReplies:${names.join(',')}`); },
      deleteStorageFolder: async prefix => { calls.push(`storage:${prefix}`); if (failAt === 'storage') throw new Error('boom storage'); },
      writeTombstone: step('tombstone'),
      deleteTombstone: step('deleteTombstone'),
      deleteUserDoc: step('userDoc'),
      deleteAuthUser: step('auth')
    }
  };
}

test('fluxo: login antigo (auth_time > 5 min) é recusado antes de qualquer leitura/escrita', async () => {
  const fake = createFakeDb(seed());
  const { deps, calls } = flowDeps(fake);
  await assert.rejects(deleteOwnAccountFlow({ uid: 'u1', authTime: NOW - 600, nowSeconds: NOW }, deps), err => err.reason === 'recent-login-required');
  await assert.rejects(deleteOwnAccountFlow({ uid: 'u1', nowSeconds: NOW }, deps), err => err.code === 'unauthenticated');
  assert.deepEqual(calls, []);
});

test('fluxo: último admin aprovado é barrado antes de qualquer escrita', async () => {
  const fake = createFakeDb(seed());
  const { deps, calls } = flowDeps(fake, { role: 'admin', admins: 1 });
  await assert.rejects(deleteOwnAccountFlow(fresh('u1'), deps), err => err.code === 'failed-precondition' && err.reason === 'last-admin');
  assert.deepEqual(calls, ['profile', 'countApprovedAdmins']);
  assert.ok(fake.store.has('likes/l1'));
});

test('fluxo: admin não aprovado não consulta a contagem e pode excluir', async () => {
  const fake = createFakeDb(seed());
  const { deps, calls } = flowDeps(fake, { role: 'admin', status: 'pending', admins: 0 });
  await deleteOwnAccountFlow(fresh('u1'), deps);
  assert.ok(!calls.includes('countApprovedAdmins'));
});

test('fluxo: ordem completa — tombstone antes de users/{uid}, Auth por último', async () => {
  const fake = createFakeDb(seed());
  const { deps, calls } = flowDeps(fake, { role: 'admin', admins: 2 });
  await deleteOwnAccountFlow(fresh('u1'), deps);
  const tail = calls.filter(c => c !== 'firestore');
  assert.deepEqual(tail, ['profile', 'countApprovedAdmins', 'authEmail', 'lastReplies:Ana', 'storage:profile-photos/u1/', 'tombstone', 'userDoc', 'auth']);
  assert.ok(calls.indexOf('lastReplies:Ana') < calls.indexOf('firestore'), 'lastReplyBy runs before replies are anonymized');
});

test('fluxo: falha no Storage não remove o usuário do Auth e a nova tentativa conclui', async () => {
  const fake = createFakeDb(seed());
  const first = flowDeps(fake, { failAt: 'storage' });
  await assert.rejects(deleteOwnAccountFlow(fresh('u1'), first.deps), /boom storage/);
  assert.ok(!first.calls.includes('auth') && !first.calls.includes('userDoc') && !first.calls.includes('tombstone'));
  const retry = flowDeps(fake);
  await deleteOwnAccountFlow(fresh('u1'), retry.deps);
  assert.equal(retry.calls[retry.calls.length - 1], 'auth');
});

test('fluxo: falha ao apagar do Auth remove o tombstone (best effort) e propaga o erro', async () => {
  const fake = createFakeDb(seed());
  const { deps, calls } = flowDeps(fake, { failAt: 'auth' });
  await assert.rejects(deleteOwnAccountFlow(fresh('u1'), deps), /boom auth/);
  assert.deepEqual(calls.slice(-3), ['userDoc', 'auth', 'deleteTombstone']);

  const failingCleanup = flowDeps(fake, { failAt: 'auth' });
  failingCleanup.deps.deleteTombstone = async () => { throw new Error('tombstone cleanup failed'); };
  await assert.rejects(deleteOwnAccountFlow(fresh('u1'), failingCleanup.deps), /boom auth/);
});

test('fluxo: sem uid é rejeitado como não autenticado', async () => {
  const fake = createFakeDb(seed());
  await assert.rejects(deleteOwnAccountFlow({ nowSeconds: NOW }, flowDeps(fake).deps), err => err.code === 'unauthenticated');
});

