import { evaluationReportContent, formatDevelopmentIndex } from '../evaluationReportContent';
import { evaluationChartSeries } from '../evaluationChart';
import { buildEvaluationReport } from '../../../../functions/src/pedagogy/evaluationReport';
import { calculateIndices } from '../../../../functions/src/pedagogy/evaluationDomain';
import { evaluationInstrument } from '../../../../functions/src/pedagogy/instrument';
import type { DevelopmentEvaluation } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';

const answers = Object.fromEntries(evaluationInstrument.dimensions.map(item => [item.id, 'NO' as const]));
const record: DevelopmentEvaluation = {
  id: 'eval', requestId: 'req1234567890123456', organization: 'ong', attendanceRollId: 'roll', studentName: 'Maria', studentId: 'maria',
  classGroup: 'Artes', educatorId: 'ana', educatorName: 'Ana', age: 7, cycle: 2, moment: 'initial', period: '2026-2', evaluationDate: '2026-10-07',
  answers, observations: { attention: 'Mudança observada', potential: 'Criatividade', additional: 'Texto\nmultilinha' },
  referrals: ['psychology', 'family'], otherReferral: '', indices: calculateIndices([answers]), instrumentVersion: 1, createdAt: '2026-10-07T12:00:00Z'
};
const report = buildEvaluationReport([record], { organization: 'ong', cycle: 2, period: '2026-2' });

test('PDF e Word compartilham respostas, indicadores, narrativas e encaminhamentos', () => {
  const content = evaluationReportContent(report, evaluationInstrument).map(item => item.text).join('\n');
  expect(content).toContain('Não calculado');
  expect(content).toContain('IDE EU:');
  expect(content).toContain('IDD Autopercepção e desenvolvimento pessoal');
  expect(content).toContain('Mudança observada');
  expect(content).toContain('Criatividade');
  expect(content).toContain('Texto\nmultilinha');
  expect(content).toContain('Avaliação pela Psicologia');
  expect(content).toContain('Contato ou diálogo com a família/responsável');
  expect(content).toContain('Maria');
  expect(content).toContain('Ana');
});

test('gráfico só utiliza IDG e IDE, mantém ausência de observação como lacuna', () => {
  const series = evaluationChartSeries(report, evaluationInstrument);
  expect(series).toHaveLength(4);
  expect(series.every(item => item.values.every(value => value === null))).toBe(true);
  expect(formatDevelopmentIndex(null)).toBe('Não calculado');
  expect(formatDevelopmentIndex(0)).toBe('0%');
});
