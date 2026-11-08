// End-to-end check of deleteOwnAccount against the local emulators (auth, firestore, functions, storage):
//   npm run test:emulator:account-deletion
// Exercises the real Admin SDK adapter (queries, cursors, batches, count(), Storage, Auth) and firestore.rules
// (tombstone blocks recreating users/{uid}; new uids can still self-register).
const assert = require('node:assert/strict');
const admin = require('../node_modules/firebase-admin');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Este teste exige emuladores locais');

const PROJECT = 'demo-account-deletion';
const BUCKET = `${PROJECT}.appspot.com`;
admin.initializeApp({ projectId: PROJECT, storageBucket: BUCKET });
const db = admin.firestore();
const base = `http://127.0.0.1:5001/${PROJECT}/southamerica-east1/`;
const firestoreRest = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const REMOVED = 'Usuário removido';

async function signUp(label) {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${label}-${Date.now()}@example.test`, password: 'Local-test-123!', returnSecureToken: true })
  });
  const account = await response.json();
  assert.ok(account.localId, JSON.stringify(account));
  return account;
}

// Auth-emulator tokens are unsigned (alg "none"); rewrite auth_time to simulate an old login.
function withAuthTime(idToken, authTime) {
  const [header, payload] = idToken.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  claims.auth_time = authTime;
  return `${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.`;
}

async function callDelete(idToken) {
  const response = await fetch(base + 'deleteOwnAccount', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data: {} })
  });
  return { status: response.status, body: await response.json() };
}

async function restCreateUser(uid, idToken) {
  const fields = {
    email: { stringValue: `${uid}@example.test` }, displayName: { stringValue: 'Recriado' },
    role: { stringValue: 'member' }, status: { stringValue: 'pending' }
  };
  const response = await fetch(`${firestoreRest}/users?documentId=${uid}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields })
  });
  return response.status;
}

async function restGet(path, idToken) {
  return (await fetch(`${firestoreRest}/${path}`, { headers: { Authorization: `Bearer ${idToken}` } })).status;
}

const exists = async path => (await db.doc(path).get()).exists;

async function main() {
  // ---------------------------------------------------------------- member deletion
  const ana = await signUp('ana');
  const uid = ana.localId;
  const email = (await admin.auth().getUser(uid)).email;
  const other = await signUp('bia');
  await db.doc(`users/${uid}`).set({ role: 'member', status: 'approved', email, displayName: 'Ana' });
  await db.doc(`users/${other.localId}`).set({ role: 'member', status: 'approved', email: 'bia@example.test', displayName: 'Bia' });
  const batch = db.batch();
  // 460 likes (230 from the user) exercise cursor pagination + batches <= 450 on the real SDK.
  for (let i = 0; i < 460; i += 1) batch.set(db.doc(`likes/l${i}`), { userId: i % 2 ? uid : other.localId, postId: 'p' });
  await batch.commit();
  await db.doc('notifications/n1').set({ userId: uid, title: 'x' });
  await db.doc('notifications/n2').set({ userId: other.localId, title: 'y' });
  await db.doc(`notificationPreferences/${uid}`).set({ push: true });
  await db.doc('forumTopics/t-other').set({ authorId: other.localId, authorName: 'Bia', lastReplyBy: 'Ana', likes: [uid, other.localId] });
  await db.doc('forumTopics/t-ana').set({ authorId: uid, authorName: 'Ana', authorEmail: email, authorAvatar: 'http://x/a.png', likes: [] });
  await db.doc('forumReplies/r1').set({ authorId: uid, authorName: 'Ana', authorEmail: email, topicId: 't-other' });
  await db.doc('comments/c1').set({ postId: 'p', author: { id: uid, name: 'Ana', photoURL: 'http://x/a.png' } });
  await db.doc('prayerRequests/pr1').set({ name: 'Ana', email, phone: '11999999999', request: 'Oração', prayedBy: [] });
  await db.doc('prayerRequests/pr2').set({ name: 'Bia', email: 'bia@example.test', request: 'Oração', prayedBy: [email] });
  await db.doc('profissionaisAssistencia/pa1').set({ userId: uid, status: 'ativo', nome: 'Ana' });
  await db.doc('members/m1').set({ email, nome: 'Ana' });
  await db.doc(`streamViewers/s1/totalViewers/${uid}`).set({ userId: uid, displayName: 'Ana' });
  await db.doc(`streamViewers/s1/viewers/${uid}`).set({ userId: uid, displayName: 'Ana' });
  const photo = admin.storage().bucket(BUCKET).file(`profile-photos/${uid}/profile-1.jpg`);
  await photo.save(Buffer.from('fake-image'), { contentType: 'image/jpeg' });

  // Old login (auth_time 10 min ago) is refused before touching anything.
  const stale = await callDelete(withAuthTime(ana.idToken, Math.floor(Date.now() / 1000) - 600));
  assert.equal(stale.status, 401, JSON.stringify(stale.body));
  assert.equal(stale.body.error.details.reason, 'recent-login-required');
  assert.ok(await exists(`users/${uid}`));

  // Fresh login succeeds.
  const ok = await callDelete(ana.idToken);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  await assert.rejects(admin.auth().getUser(uid), err => err.code === 'auth/user-not-found');
  assert.equal(await exists(`users/${uid}`), false);
  const tombstone = await db.doc(`deletedAccounts/${uid}`).get();
  assert.ok(tombstone.exists);
  assert.deepEqual(Object.keys(tombstone.data()), ['deletedAt']);
  const remaining = await db.collection('likes').get();
  assert.equal(remaining.size, 230);
  assert.ok(remaining.docs.every(doc => doc.get('userId') === other.localId));
  assert.equal(await exists('notifications/n1'), false);
  assert.ok(await exists('notifications/n2'));
  assert.equal(await exists(`notificationPreferences/${uid}`), false);
  const topicOther = (await db.doc('forumTopics/t-other').get()).data();
  assert.equal(topicOther.lastReplyBy, REMOVED);
  assert.deepEqual(topicOther.likes, [other.localId]);
  const topicAna = (await db.doc('forumTopics/t-ana').get()).data();
  assert.equal(topicAna.authorName, REMOVED);
  assert.equal(topicAna.authorEmail, null);
  assert.equal(topicAna.authorAvatar, undefined);
  assert.equal((await db.doc('forumReplies/r1').get()).get('authorName'), REMOVED);
  assert.deepEqual((await db.doc('comments/c1').get()).get('author'), { id: uid, name: REMOVED });
  const pr1 = (await db.doc('prayerRequests/pr1').get()).data();
  assert.deepEqual([pr1.name, pr1.email, pr1.phone, pr1.request], [REMOVED, null, null, 'Oração']);
  assert.deepEqual((await db.doc('prayerRequests/pr2').get()).get('prayedBy'), []);
  const pa1 = (await db.doc('profissionaisAssistencia/pa1').get()).data();
  assert.equal(pa1.userId, undefined);
  assert.equal(pa1.status, 'inativo');
  assert.deepEqual((await db.doc('members/m1').get()).data(), { email, nome: 'Ana' });
  assert.equal((await db.doc(`streamViewers/s1/totalViewers/${uid}`).get()).get('displayName'), REMOVED);
  assert.equal(await exists(`streamViewers/s1/viewers/${uid}`), false);
  assert.equal((await photo.exists())[0], false);

  // Rules: the deleted user's still-valid token cannot recreate the profile nor read the tombstone.
  assert.equal(await restCreateUser(uid, ana.idToken), 403);
  assert.equal(await restGet(`deletedAccounts/${uid}`, ana.idToken), 403);
  assert.equal(await exists(`users/${uid}`), false);
  // A brand-new uid can still self-register.
  const fresh = await signUp('nova');
  assert.equal(await restCreateUser(fresh.localId, fresh.idToken), 200);

  // ---------------------------------------------------------------- last-admin guard
  const admin1 = await signUp('admin1');
  const pendingAdmin = await signUp('admin-pendente');
  await db.doc(`users/${admin1.localId}`).set({ role: 'admin', status: 'approved', email: 'a1@example.test', displayName: 'Admin 1' });
  await db.doc(`users/${pendingAdmin.localId}`).set({ role: 'admin', status: 'pending', email: 'ap@example.test', displayName: 'Admin pendente' });
  const blocked = await callDelete(admin1.idToken);
  assert.equal(blocked.status, 400, JSON.stringify(blocked.body));
  assert.equal(blocked.body.error.status, 'FAILED_PRECONDITION');
  assert.equal(blocked.body.error.details.reason, 'last-admin');
  assert.ok(await exists(`users/${admin1.localId}`));
  assert.ok(await admin.auth().getUser(admin1.localId));

  const admin2 = await signUp('admin2');
  await db.doc(`users/${admin2.localId}`).set({ role: 'admin', status: 'approved', email: 'a2@example.test', displayName: 'Admin 2' });
  const allowed = await callDelete(admin1.idToken);
  assert.equal(allowed.status, 200, JSON.stringify(allowed.body));
  assert.equal(await exists(`users/${admin1.localId}`), false);

  console.log('Emuladores: exclusão completa (Firestore/Storage/Auth), auth_time, último admin aprovado, tombstone e regras validados.');
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
