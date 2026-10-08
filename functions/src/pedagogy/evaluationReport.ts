import { DevelopmentEvaluation, EvaluationReport, EvaluationReportFilter } from './contracts';
import { calculateIndices } from './evaluationDomain';
import { evaluationInstrument } from './instrument';

export function buildEvaluationReport(records: DevelopmentEvaluation[], filter: EvaluationReportFilter): EvaluationReport {
  const selected = records.filter(item => item.organization === filter.organization
    && item.period === filter.period && item.cycle === filter.cycle
    && (!filter.classGroup || item.classGroup === filter.classGroup)
    && (!filter.studentId || item.studentId === filter.studentId))
    .sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate) || b.createdAt.localeCompare(a.createdAt));
  const evolution = evaluationInstrument.moments.map(({ id: moment }) => {
    const latest = new Map<string, DevelopmentEvaluation>();
    selected.filter(item => item.moment === moment).forEach(item => {
      if (!latest.has(item.studentId)) latest.set(item.studentId, item);
    });
    const evaluations = Array.from(latest.values());
    return {
      moment, indices: calculateIndices(evaluations.map(item => item.answers)),
      students: latest.size, evaluations: evaluations.length
    };
  });
  return {
    filter, generatedAt: new Date().toISOString(), records: selected, totalRecords: selected.length,
    detailsLoaded: Boolean(filter.includeDetails), evolution,
    studentCount: new Set(selected.map(item => item.studentId)).size,
    methodology: 'A = 2 pontos; B = 1; C = 0. N/O é excluído da pontuação e do máximo. '
      + 'Sem questões observadas: Não calculado. Para cada assistido e momento, utiliza-se a avaliação mais recente '
      + 'do ciclo e semestre selecionados. O coletivo divide a soma dos pontos pela soma dos máximos observados. '
      + 'A identificação utiliza organização, turma e nome da chamada; a mesma pessoa em turmas diferentes é analisada em cada turma. '
      + 'A composição do grupo pode variar entre momentos; os resultados orientam o acompanhamento, sem classificação entre pessoas.'
  };
}
