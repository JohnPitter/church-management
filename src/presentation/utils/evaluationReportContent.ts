import type { EvaluationInstrument, EvaluationReport } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';

export type ReportContent = { kind: 'title' | 'heading' | 'body'; text: string };
export const formatDevelopmentIndex = (value: number | null): string => value === null ? 'Não calculado' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

export function evaluationReportContent(report: EvaluationReport, instrument: EvaluationInstrument): ReportContent[] {
  const content: ReportContent[] = [];
  const add = (kind: ReportContent['kind'], text: string) => content.push({ kind, text });
  add('title', 'Relatório de Avaliação do Desenvolvimento');
  add('body', `${report.filter.organization === 'ong' ? 'ONG' : 'Igreja'} · ${report.filter.period} · ${instrument.cycles.find(item => item.id === report.filter.cycle)?.label}`);
  add('body', `Escopo: ${report.filter.studentId ? 'Individual' : 'Coletivo'} · Turma: ${report.filter.classGroup || 'Todas'} · ${report.studentCount} assistido(s) · ${report.records.length} avaliação(ões)`);
  add('body', `Gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  add('heading', 'Evolução e indicadores');
  for (const item of report.evolution) {
    add('heading', `${instrument.moments.find(moment => moment.id === item.moment)?.label} · ${item.students} assistido(s)`);
    add('body', `IDG: ${formatDevelopmentIndex(item.indices.idg)} · Questões observadas: ${item.indices.observedQuestions} · Pontos: ${item.indices.obtainedPoints}/${item.indices.maximumPoints}`);
    for (const axis of instrument.axes) add('body', `IDE ${axis.label}: ${formatDevelopmentIndex(item.indices.ide[axis.id])}`);
    for (const dimension of instrument.dimensions) add('body', `IDD ${dimension.label}: ${formatDevelopmentIndex(item.indices.idd[dimension.id])}`);
  }
  add('heading', 'Critérios de análise');
  add('body', report.methodology);
  add('heading', 'Registros qualitativos e acompanhamento');
  for (const record of report.records) {
    add('heading', `${record.studentName} · ${record.classGroup}`);
    add('body', `${record.age} anos · ${record.educatorName} · ${record.evaluationDate.split('-').reverse().join('/')} · ${instrument.moments.find(item => item.id === record.moment)?.label} · Instrumento v${record.instrumentVersion}`);
    add('body', `IDG individual: ${formatDevelopmentIndex(record.indices.idg)}`);
    for (const question of instrument.cycles.find(item => item.id === record.cycle)?.questions || []) {
      const answer = instrument.answers.find(item => item.id === record.answers[question.dimensionId]);
      add('body', `${question.text}\n${answer?.id === 'NO' ? 'N/O' : answer?.id}) ${answer?.label} · IDD ${formatDevelopmentIndex(record.indices.idd[question.dimensionId])}`);
    }
    for (const observation of instrument.observations) add('body', `${observation.label}\n${record.observations[observation.id] || 'Sem observação registrada'}`);
    add('body', `Necessidade de encaminhamento: ${record.referrals.map(id => instrument.referrals.find(item => item.id === id)?.label).join('; ')}`);
    if (record.otherReferral) add('body', `Outro encaminhamento: ${record.otherReferral}`);
  }
  return content;
}

export function reportFilename(report: EvaluationReport): string {
  return `avaliacao_${report.filter.studentId ? 'individual' : 'coletiva'}_${report.filter.period}_ciclo${report.filter.cycle}`;
}
