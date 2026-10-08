import { CreateEvaluationRequest, DevelopmentIndices, EvaluationAnswer, EvaluationReportFilter } from './contracts';
import { evaluationInstrument } from './instrument';

export class EvaluationValidationError extends Error {}

export function requiredText(value: unknown, label: string, maximum = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new EvaluationValidationError(`${label} é obrigatório e deve ter até ${maximum} caracteres`);
  }
  return value.trim();
}

function optionalText(value: unknown): string {
  if (value === undefined || value === '') return '';
  return requiredText(value, 'Observação', 5000);
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new EvaluationValidationError('Dados inválidos');
  }
  return value as Record<string, unknown>;
}

export function validateReportFilter(input: unknown): EvaluationReportFilter {
  const data = object(input);
  if (data.organization !== 'church' && data.organization !== 'ong') {
    throw new EvaluationValidationError('Organização inválida');
  }
  if (!evaluationInstrument.cycles.some(cycle => cycle.id === data.cycle)) {
    throw new EvaluationValidationError('Escolha um ciclo válido');
  }
  if (typeof data.period !== 'string' || !/^20\d{2}-[12]$/.test(data.period)) {
    throw new EvaluationValidationError('Informe o período no formato ano-semestre');
  }
  if (data.includeDetails !== undefined && typeof data.includeDetails !== 'boolean') {
    throw new EvaluationValidationError('Formato de relatório inválido');
  }
  return {
    organization: data.organization,
    cycle: data.cycle as EvaluationReportFilter['cycle'],
    period: data.period,
    ...(data.classGroup ? { classGroup: requiredText(data.classGroup, 'Turma') } : {}),
    ...(data.studentId ? { studentId: requiredText(data.studentId, 'Assistido') } : {}),
    ...(data.includeDetails ? { includeDetails: true } : {})
  };
}

function validateAnswers(input: unknown): Record<string, EvaluationAnswer> {
  const data = object(input);
  const dimensions = evaluationInstrument.dimensions;
  if (Object.keys(data).length !== dimensions.length) {
    throw new EvaluationValidationError('Responda às nove perguntas do ciclo');
  }
  const answers: Record<string, EvaluationAnswer> = {};
  for (const dimension of dimensions) {
    const answer = data[dimension.id];
    if (!evaluationInstrument.answers.some(option => option.id === answer)) {
      throw new EvaluationValidationError(`Responda à dimensão ${dimension.label}`);
    }
    answers[dimension.id] = answer as EvaluationAnswer;
  }
  return answers;
}

function validateReferrals(input: unknown): CreateEvaluationRequest['referrals'] {
  if (!Array.isArray(input) || !input.length || new Set(input).size !== input.length
    || input.some(value => !evaluationInstrument.referrals.some(item => item.id === value))) {
    throw new EvaluationValidationError('Informe a necessidade de encaminhamento');
  }
  if (input.includes('none') && input.length > 1) {
    throw new EvaluationValidationError('Sem necessidade não pode ser combinado com encaminhamentos');
  }
  return input as CreateEvaluationRequest['referrals'];
}

export function validateEvaluation(input: unknown): CreateEvaluationRequest {
  const data = object(input);
  const filter = validateReportFilter(data);
  if (!Number.isInteger(data.age) || Number(data.age) < 4 || Number(data.age) > 130) {
    throw new EvaluationValidationError('Informe uma idade válida a partir de 4 anos');
  }
  if (!evaluationInstrument.moments.some(item => item.id === data.moment)) {
    throw new EvaluationValidationError('Escolha o momento da avaliação');
  }
  const date = requiredText(data.evaluationDate, 'Data da avaliação');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))
    || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new EvaluationValidationError('Data da avaliação inválida');
  }
  const requestId = requiredText(data.requestId, 'Identificador da solicitação');
  if (!/^[\w-]{16,100}$/.test(requestId)) throw new EvaluationValidationError('Identificador inválido');
  const observations = object(data.observations);
  const referrals = validateReferrals(data.referrals);
  return {
    organization: filter.organization, cycle: filter.cycle, period: filter.period,
    requestId, attendanceRollId: requiredText(data.attendanceRollId, 'Chamada'),
    studentName: requiredText(data.studentName, 'Assistido'), age: Number(data.age),
    moment: data.moment as CreateEvaluationRequest['moment'], evaluationDate: date,
    answers: validateAnswers(data.answers),
    observations: {
      attention: optionalText(observations.attention), potential: optionalText(observations.potential),
      additional: optionalText(observations.additional)
    },
    referrals, otherReferral: referrals.includes('other') ? optionalText(data.otherReferral) : ''
  };
}

export function calculateIndices(answerSets: Array<Record<string, EvaluationAnswer>>): DevelopmentIndices {
  const points = { A: 2, B: 1, C: 0 };
  const totals: Record<string, { obtained: number; maximum: number }> = {};
  for (const dimension of evaluationInstrument.dimensions) {
  const values = answerSets.map(answers => answers[dimension.id]).filter(answer => answer !== 'NO' && answer !== undefined);
    totals[dimension.id] = {
      obtained: values.reduce((sum, answer) => sum + points[answer as keyof typeof points], 0),
      maximum: values.length * 2
    };
  }
  const percentage = (ids: string[]): number | null => {
    const obtained = ids.reduce((sum, id) => sum + totals[id].obtained, 0);
    const maximum = ids.reduce((sum, id) => sum + totals[id].maximum, 0);
    return maximum ? Math.round(obtained / maximum * 10000) / 100 : null;
  };
  const dimensionIds = evaluationInstrument.dimensions.map(item => item.id);
  const maximumPoints = dimensionIds.reduce((sum, id) => sum + totals[id].maximum, 0);
  return {
    idg: percentage(dimensionIds),
    ide: {
      eu: percentage(evaluationInstrument.dimensions.filter(item => item.axis === 'eu').map(item => item.id)),
      outro: percentage(evaluationInstrument.dimensions.filter(item => item.axis === 'outro').map(item => item.id)),
      mundo: percentage(evaluationInstrument.dimensions.filter(item => item.axis === 'mundo').map(item => item.id))
    },
    idd: Object.fromEntries(dimensionIds.map(id => [id, percentage([id])])),
    maximumPoints, observedQuestions: maximumPoints / 2,
    obtainedPoints: dimensionIds.reduce((sum, id) => sum + totals[id].obtained, 0)
  };
}
