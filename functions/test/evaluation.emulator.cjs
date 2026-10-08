const assert = require('node:assert/strict');
const admin = require('../node_modules/firebase-admin');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Este teste exige emuladores locais');
admin.initializeApp({ projectId: 'demo-pedagogy' });
const db = admin.firestore();
const instrument = require('../lib/pedagogy/instrument').evaluationInstrument;
const base = 'http://127.0.0.1:5001/demo-pedagogy/southamerica-east1/';
async function user(role, customPermissions) {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${role}-${Date.now()}@example.test`, password: 'Local-test-123!', returnSecureToken: true })
  });
  const account = await response.json();
  assert.ok(account.localId, JSON.stringify(account));
  await db.collection('users').doc(account.localId).set({ role, status: 'approved', displayName: `Teste ${role}`, ...(customPermissions ? { customPermissions } : {}) });
  return account;
}
async function call(name, data, account) {
  const response = await fetch(base + name, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(account ? { Authorization: `Bearer ${account.idToken}` } : {}) },
    body: JSON.stringify({ data })
  });
  return { status: response.status, body: await response.json() };
}
async function directWrite(collection, id, fields, account) {
  const encode = value => typeof value === 'string' ? { stringValue: value } : Array.isArray(value)
    ? { arrayValue: { values: value.map(encode) } } : { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)])) } };
  const url = `http://127.0.0.1:8080/v1/projects/demo-pedagogy/databases/(default)/documents/${collection}/${id}`;
  return fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.idToken}` }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encode(value)])) }) });
}
async function main() {
  const educator = await user('educator');
  const other = await user('educator');
  const coordinator = await user('pedagogical_coordinator');
  const professional = await user('professional', { granted: [{ module: 'pedagogy', actions: ['view'] }] });
  const blocked = await user('professional');
  for (const account of [educator, other]) await db.collection('classAttendanceRolls').doc(`roll-${account.localId}`).set({ organization: 'ong', educatorId: account.localId, classGroup: 'Artes', students: [{ name: 'Maria' }, { name: 'João' }] });
  assert.equal((await call('getDevelopmentEvaluationInstrument', {}, undefined)).status, 401);
  assert.equal((await call('getDevelopmentEvaluationInstrument', {}, blocked)).status, 403);
  assert.equal((await call('getDevelopmentEvaluationInstrument', {}, educator)).body.result.cycles.length, 5);
  const data = { requestId: 'local-test-000000001', organization: 'ong', attendanceRollId: `roll-${educator.localId}`, studentName: 'Maria', age: 7, cycle: 2, period: '2026-2', moment: 'initial', evaluationDate: '2026-10-07', answers: Object.fromEntries(instrument.dimensions.map(item => [item.id, 'A'])), observations: { attention: '', potential: 'Criatividade', additional: '' }, referrals: ['psychology'], otherReferral: '', educatorId: 'spoof', educatorName: 'spoof', indices: { idg: 0 } };
  const first = await call('createDevelopmentEvaluation', data, educator);
  assert.equal(first.status, 200, JSON.stringify(first));
  assert.equal(first.body.result.indices.idg, 100);
  assert.equal(first.body.result.educatorId, educator.localId);
  const repeated = await call('createDevelopmentEvaluation', data, educator);
  assert.equal(repeated.body.result.id, first.body.result.id);
  assert.equal((await call('createDevelopmentEvaluation', data, professional)).status, 403);
  assert.equal((await call('createDevelopmentEvaluation', { ...data, requestId: 'local-test-000000002' }, other)).status, 400);
  assert.equal((await call('createDevelopmentEvaluation', { ...data, requestId: 'local-test-000000003', studentName: 'Não existe' }, educator)).status, 400);
  const filter = { organization: 'ong', period: '2026-2', cycle: 2 };
  assert.equal((await call('getDevelopmentEvaluationReport', filter, other)).body.result.records.length, 0);
  const report = (await call('getDevelopmentEvaluationReport', filter, coordinator)).body.result;
  assert.equal(report.records.length, 1);
  assert.equal(report.detailsLoaded, false);
  assert.equal(report.records[0].observations, undefined);
  assert.equal(report.evolution[0].indices.idg, 100);
  assert.equal(report.evolution[1].indices.idg, null);
  const detailed = (await call('getDevelopmentEvaluationReport', { ...filter, includeDetails: true }, professional)).body.result;
  assert.equal(detailed.detailsLoaded, true);
  assert.equal(detailed.records[0].observations.potential, 'Criatividade');
  assert.equal((await directWrite('developmentEvaluations', 'spoof', { educatorId: educator.localId }, educator)).status, 403);
  assert.equal((await directWrite('users', educator.localId, { role: 'educator', status: 'approved', displayName: 'Teste', customPermissions: { granted: [{ module: 'pedagogy', actions: ['manage'] }] } }, educator)).status, 403);
  assert.equal((await directWrite('classAttendanceRolls', `roll-${educator.localId}`, { educatorId: other.localId }, other)).status, 403);
  console.log('Emuladores: auth, gravação, idempotência, cálculos, relatórios, isolamento de educadores, acesso profissional e regras validados.');

}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });

