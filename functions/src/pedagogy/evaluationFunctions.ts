import { firestore } from 'firebase-admin';
import { https, logger, region } from 'firebase-functions/v1';
import { evaluationAccess, EvaluationUser, ModuleGrant } from './evaluationAccess';
import { EvaluationValidationError, validateEvaluation, validateReportFilter } from './evaluationDomain';
import { buildEvaluationReport } from './evaluationReport';
import { EvaluationRepository } from './evaluationRepository';
import { evaluationInstrument } from './instrument';

async function authorize(context: https.CallableContext) {
  if (!context.auth) throw new https.HttpsError('unauthenticated', 'Entre no sistema para continuar');
  const uid = context.auth.uid;
  const db = firestore();
  const userDoc = await db.collection('users').doc(uid).get();
  const user = userDoc.data() as EvaluationUser | undefined;
  if (!user || user.status !== 'approved') {
    logger.warn('Evaluation access denied', { uid });
    throw new https.HttpsError('permission-denied', 'Acesso não autorizado');
  }
  const roleDoc = await db.collection('rolePermissions').doc(user.role).get();
  const access = evaluationAccess(user, roleDoc.data()?.modules as ModuleGrant[] | undefined);
  if (!access.view) {
    logger.warn('Evaluation permission denied', { uid, role: user.role });
    throw new https.HttpsError('permission-denied', 'Sem permissão para avaliações pedagógicas');
  }
  return { uid, user, access, repository: new EvaluationRepository(db) };
}

async function handle<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof https.HttpsError) throw error;
    if (error instanceof EvaluationValidationError) throw new https.HttpsError('invalid-argument', error.message);
    logger.error('Pedagogical evaluation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new https.HttpsError('internal', 'Não foi possível concluir a avaliação. Tente novamente.');
  }
}

export const getDevelopmentEvaluationInstrument = region('southamerica-east1').https.onCall((_data, context) => handle(async () => {
  await authorize(context);
  return evaluationInstrument;
}));

export const createDevelopmentEvaluation = region('southamerica-east1').https.onCall((data: unknown, context) => handle(async () => {
  const { uid, user, access, repository } = await authorize(context);
  if (!access.create) throw new https.HttpsError('permission-denied', 'Sem permissão para registrar avaliações');
  const request = validateEvaluation(data);
  return repository.create(request, { id: uid, name: user.displayName || 'Arte-educador', collective: access.collective });
}));

export const getDevelopmentEvaluationReport = region('southamerica-east1').https.onCall((data: unknown, context) => handle(async () => {
  const { uid, access, repository } = await authorize(context);
  const filter = validateReportFilter(data);
  const records = await repository.list(filter, access.collective ? undefined : uid);
  logger.info('Qualitative evaluation report accessed', { uid, organization: filter.organization, period: filter.period, cycle: filter.cycle });
  return buildEvaluationReport(records, filter);
}));
