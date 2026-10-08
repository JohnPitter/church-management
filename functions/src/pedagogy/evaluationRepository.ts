import { createHash } from 'crypto';
import { firestore } from 'firebase-admin';
import { CreateEvaluationRequest, DevelopmentEvaluation, EvaluationReportFilter } from './contracts';
import { calculateIndices, EvaluationValidationError } from './evaluationDomain';
import { evaluationInstrument } from './instrument';

interface EvaluationAuthor { id: string; name: string; collective: boolean }
const normalize = (value: string): string => value.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

export class EvaluationRepository {
  constructor(private readonly db: firestore.Firestore) {}

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
    const snapshot = await query.limit(5001).get();
    if (snapshot.size > 5000) throw new EvaluationValidationError('O relatório excede 5.000 avaliações. Reduza o período.');
    return snapshot.docs.map(doc => doc.data() as DevelopmentEvaluation);
  }
}
