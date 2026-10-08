const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateIndices, validateEvaluation, validateReportFilter } = require('../lib/pedagogy/evaluationDomain');
const { buildEvaluationReport } = require('../lib/pedagogy/evaluationReport');
const { evaluationAccess } = require('../lib/pedagogy/evaluationAccess');
const { evaluationInstrument } = require('../lib/pedagogy/instrument');
const answers = value => Object.fromEntries(evaluationInstrument.dimensions.map(item => [item.id, value]));
const request = () => ({
  requestId: 'test-request-00001', organization: 'ong', attendanceRollId: 'roll-1', studentName: 'Maria',
  age: 7, cycle: 2, moment: 'initial', period: '2026-2', evaluationDate: '2026-10-07', answers: answers('A'),
  observations: { attention: '', potential: '', additional: '' }, referrals: ['none'], otherReferral: ''
});
const record = updates => ({ ...request(), id: 'eval-1', studentId: 'student-1', classGroup: 'Artes', educatorId: 'educator-1', educatorName: 'Educadora', instrumentVersion: 1, createdAt: '2026-10-07T12:00:00Z', indices: calculateIndices([answers('A')]), ...updates });
const filter = { organization: 'ong', cycle: 2, period: '2026-2' };

test('instrumento contém 45 perguntas e uma pergunta por dimensão em cada ciclo', () => {
  assert.equal(evaluationInstrument.cycles.length, 5);
  for (const cycle of evaluationInstrument.cycles) {
    assert.equal(cycle.questions.length, 9);
    assert.deepEqual(cycle.questions.map(item => item.dimensionId), evaluationInstrument.dimensions.map(item => item.id));
    assert.ok(cycle.questions.every(item => item.text.endsWith('?') && item.example.length > 10));
  }
});
for (const [answer, percentage] of [['A', 100], ['B', 50], ['C', 0], ['NO', null]]) {
  test(`escala ${answer} produz índices ${percentage}`, () => {
    const result = calculateIndices([answers(answer)]);
    assert.equal(result.idg, percentage);
    assert.ok(Object.values(result.ide).every(value => value === percentage));
    assert.ok(Object.values(result.idd).every(value => value === percentage));
    assert.equal(result.maximumPoints, answer === 'NO' ? 0 : 18);
  });
}
test('N/O fica fora dos pontos e do denominador em todos os índices', () => {
  const result = calculateIndices([{ ...answers('NO'), self_perception: 'A', emotions: 'B', communication: 'C' }]);
  assert.equal(result.idg, 50);
  assert.equal(result.ide.eu, 75);
  assert.equal(result.ide.outro, 0);
  assert.equal(result.ide.mundo, null);
  assert.equal(result.maximumPoints, 6);
  assert.equal(result.observedQuestions, 3);
});
test('coletivo usa pontos observados, evitando média de percentuais com denominadores diferentes', () => {
  const result = calculateIndices([answers('A'), { ...answers('NO'), self_perception: 'C' }]);
  assert.equal(result.idg, 90);
});
test('validação permite ciclo manual e campos descritivos vazios', () => {
  assert.equal(validateEvaluation({ ...request(), age: 20, cycle: 1 }).cycle, 1);
});
for (const invalid of [
  { answers: {} }, { answers: { ...answers('A'), self_perception: 'D' } }, { answers: { ...answers('A'), unknown: 'A' } },
  { age: -1 }, { age: 3 }, { age: 4.5 }, { age: '7' }, { cycle: 6 }, { cycle: '2' }, { moment: 'unknown' },
  { referrals: [] }, { referrals: ['none', 'psychology'] }, { referrals: ['unknown'] }, { referrals: ['family', 'family'] },
  { period: '2026' }, { evaluationDate: '2026-02-30' }, { observations: { attention: 'x'.repeat(5001) } }, { requestId: '../x' }
]) test(`validação rejeita ${JSON.stringify(invalid).slice(0, 65)}`, () => assert.throws(() => validateEvaluation({ ...request(), ...invalid })));
test('encaminhamentos múltiplos sem opção none e texto de outro opcional', () => {
  assert.deepEqual(validateEvaluation({ ...request(), referrals: ['psychology', 'family', 'other'] }).referrals, ['psychology', 'family', 'other']);
});
test('observações não alteram índices', () => {
  const report = buildEvaluationReport([record({ observations: { attention: 'Mudança', potential: 'Liderança', additional: '' }, referrals: ['psychology'] })], filter);
  assert.equal(report.evolution[0].indices.idg, 100);
  assert.equal(report.records[0].observations.potential, 'Liderança');
});
test('relatório preserva histórico e utiliza apenas a avaliação mais recente por assistido e momento', () => {
  const report = buildEvaluationReport([
    record({ id: 'old', answers: answers('C'), evaluationDate: '2026-08-01' }),
    record({ id: 'new', answers: answers('A'), evaluationDate: '2026-09-01' }),
    record({ id: 'middle', moment: 'intermediate', answers: answers('B') })
  ], filter);
  assert.equal(report.records.length, 3);
  assert.equal(report.evolution[0].indices.idg, 100);
  assert.equal(report.evolution[0].evaluations, 1);
  assert.equal(report.evolution[1].indices.idg, 50);
  assert.equal(report.evolution[2].indices.idg, null);
});
test('organizações, ciclos e semestres não se misturam', () => {
  const report = buildEvaluationReport([record({}), record({ organization: 'church' }), record({ cycle: 1 }), record({ period: '2026-1' })], filter);
  assert.equal(report.records.length, 1);
});
test('relatório individual filtra identidade e turma', () => {
  const report = buildEvaluationReport([record({}), record({ studentId: 'student-2', classGroup: 'Esporte' })], { ...filter, studentId: 'student-1', classGroup: 'Artes' });
  assert.equal(report.studentCount, 1);
  assert.equal(report.records[0].studentId, 'student-1');
});
test('papel de educador não permite leitura coletiva', () => {
  assert.deepEqual(evaluationAccess({ role: 'educator', status: 'approved' }), { view: true, create: true, collective: false });
});
test('psicologia precisa de concessão explícita de visualização, sem escrita', () => {
  assert.equal(evaluationAccess({ role: 'professional', status: 'approved' }).view, false);
  assert.deepEqual(evaluationAccess({ role: 'professional', status: 'approved', customPermissions: { granted: [{ module: 'pedagogy', actions: ['view'] }] } }), { view: true, create: false, collective: true });
});
test('revogação e estado de aprovação prevalecem sobre concessões', () => {
  assert.equal(evaluationAccess({ role: 'pedagogical_coordinator', status: 'pending' }).view, false);
  assert.equal(evaluationAccess({ role: 'professional', status: 'approved', customPermissions: { granted: [{ module: 'pedagogy', actions: ['view'] }], revoked: [{ module: 'pedagogy', actions: ['view'] }] } }).view, false);
});
test('cópia antiga de permissões no usuário não eleva papel embutido', () => {
  assert.equal(evaluationAccess({ role: 'professional', status: 'approved', rolePermissions: [{ module: 'pedagogy', actions: ['view'] }] }).view, false);
});
test('filtro rejeita organização e período inválidos', () => {
  assert.throws(() => validateReportFilter({ ...filter, organization: 'unknown' }));
  assert.throws(() => validateReportFilter({ ...filter, period: '2026-3' }));
  assert.throws(() => validateReportFilter({ ...filter, includeDetails: 'yes' }));
});
test('relatório resumido sinaliza que o histórico completo não foi solicitado', () => {
  const summary = buildEvaluationReport([record({})], filter);
  const detailed = buildEvaluationReport([record({})], { ...filter, includeDetails: true });
  assert.equal(summary.detailsLoaded, false);
  assert.equal(detailed.detailsLoaded, true);
  assert.equal(summary.totalRecords, 1);
});
