import { createHash } from 'crypto';
import { firestore } from 'firebase-admin';
import { CreateEvaluationRequest, DevelopmentEvaluation, EvaluationReportFilter, EvaluationWorkspace, EvaluationWorkspaceRequest } from './contracts';
import { calculateIndices, EvaluationValidationError } from './evaluationDomain';
import { evaluationInstrument } from './instrument';

interface EvaluationAuthor { id: string; name: string; collective: boolean }
const normalize = (value: string): string => value.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

export class EvaluationRepository {
  constructor(private readonly db: firestore.Firestore) {}

  async workspace(request: EvaluationWorkspaceRequest & { educatorId?: string }): Promise<EvaluationWorkspace['records']> {
    const collection = request.section === 'evaluation' ? 'classAttendanceRolls' : 'guidelineApplications';
    let query: firestore.Query = this.db.collection(collection);
    if (request.educatorId) query = query.where('educatorId', '==', request.educatorId);
    const fields = request.section === 'evaluation'
      ? ['organization', 'classGroup', 'students', 'sessionDate']
      : ['organization', 'guidelineTitle', 'educatorName', 'month', 'year', 'applicationNarrative', 'applicationDifficulties', 'strategies', 'observedResults'];
    const snapshot = await query.select(...fields).limit(1001).get();
    if (snapshot.size > 1000) throw new EvaluationValidationError('Mais de 1.000 registros disponíveis. Consulte a coordenação pela versão web.');
    return snapshot.docs.filter(doc => (doc.data().organization || 'church') === request.organization).map(doc => {
      const data = doc.data();
      if (request.section === 'evaluation') return {
        id: doc.id, classGroup: String(data.classGroup || ''),
        sessionDate: data.sessionDate?.toDate?.().toISOString().slice(0, 10) || '',
        students: (data.students || []).map((student: { name: string }) => ({ name: String(student.name || '') }))
      };
      return {
        id: doc.id, guidelineTitle: String(data.guidelineTitle || ''), educatorName: String(data.educatorName || ''),
        month: Number(data.month || 0), year: Number(data.year || 0),
        applicationNarrative: String(data.applicationNarrative || ''), applicationDifficulties: String(data.applicationDifficulties || ''),
        strategies: String(data.strategies || ''), observedResults: String(data.observedResults || '')
      };
    });
  }

  async create(request: CreateEvaluationRequest, author: EvaluationAuthor): Promise<DevelopmentEvaluation> {
    const id = digest(`${author.id}:${request.requestId}`);
    const ref = this.db.collection('developmentEvaluations').doc(id);
    return this.db.runTransaction(async transaction => {
      const previous = await transaction.get(ref);
      if (previous.exists) return previous.data() as DevelopmentEvaluation;
      const attendance = await transaction.get(this.db.collection('classAttendanceRolls').doc(request.attendanceRollId));
      const roll = attendance.data();
      if (!roll || (roll.organization || 'church') !== request.organization
        || (!author.collective && roll.educatorId !== author.id)) {
        throw new EvaluationValidationError('Chamada indisponível para esta avaliação');
      }
      const matches = (roll.students as Array<{ name: string; studentId?: string }> || [])
        .filter(student => normalize(student.name) === normalize(request.studentName));
      if (matches.length !== 1 || !roll.classGroup?.trim()) {
        throw new EvaluationValidationError('Selecione um assistido identificado de forma única na chamada');
      }
      const studentName = matches[0].name.trim();
      const classGroup = String(roll.classGroup).trim();
      const record: DevelopmentEvaluation = {
        ...request, id, studentName, classGroup,
        studentId: digest(`${request.organization}:${classGroup}:${matches[0].studentId || normalize(studentName)}`),
        educatorId: author.id, educatorName: author.name, createdAt: new Date().toISOString(),
        instrumentVersion: evaluationInstrument.version, indices: calculateIndices([request.answers])
      };
      transaction.create(ref, record);
      return record;
    });
  }

  async list(filter: EvaluationReportFilter, educatorId?: string): Promise<DevelopmentEvaluation[]> {
    let query: firestore.Query = this.db.collection('developmentEvaluations')
      .where('organization', '==', filter.organization).where('period', '==', filter.period).where('cycle', '==', filter.cycle);
    if (educatorId) query = query.where('educatorId', '==', educatorId);
    if (filter.classGroup) query = query.where('classGroup', '==', filter.classGroup);
    if (filter.studentId) query = query.where('studentId', '==', filter.studentId);
    if (!filter.includeDetails) {
      query = query.select(
        'answers', 'classGroup', 'createdAt', 'cycle', 'evaluationDate', 'id', 'moment',
        'organization', 'period', 'studentId', 'studentName'
      );
    }
    const snapshot = await query.limit(5001).get();
    if (snapshot.size > 5000) throw new EvaluationValidationError('O relatório excede 5.000 avaliações. Reduza o período.');
    return snapshot.docs.map(doc => doc.data() as DevelopmentEvaluation);
  }
}
