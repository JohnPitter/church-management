import {
  ClassSessionRecord,
  FeedbackKind,
  GuidelineApplication,
  PedagogyEntity,
  PedagogicalFeedback,
  PedagogicalGuideline,
  StudentDifficultyRecord
} from '../../domain/entities/Pedagogy';
import { FirebasePedagogyRepository } from '../../infrastructure/repositories/FirebasePedagogyRepository';

export interface PedagogyDashboardStats {
  studentsServed: number;
  averageAttendance: number;
  averageEngagement: number;
  studentsNeedingFollowup: number;
  educatorsWithPendingRecords: number;
  activeGuidelineTitle: string;
  lastApplicationDate?: Date;
}

export class PedagogyService {
  constructor(private readonly repository = new FirebasePedagogyRepository()) {}

  async createGuideline(
    data: Omit<PedagogicalGuideline, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PedagogicalGuideline> {
    PedagogyEntity.validateGuideline(data);
    const now = new Date();
    return this.repository.createGuideline({ ...data, createdAt: now, updatedAt: now });
  }

  async updateGuideline(
    id: string,
    updates: Partial<PedagogicalGuideline>
  ): Promise<void> {
    if (updates.title || updates.content || updates.validFrom || updates.validUntil) {
      const current = await this.repository.getGuideline(id);
      PedagogyEntity.validateGuideline({ ...current, ...updates } as PedagogicalGuideline);
    }
    await this.repository.updateGuideline(id, { ...updates, updatedAt: new Date() });
  }

  async deleteGuideline(id: string): Promise<void> {
    await this.repository.deleteGuideline(id);
  }

  async listGuidelines(): Promise<PedagogicalGuideline[]> {
    return this.repository.listGuidelines();
  }

  async listActiveGuidelines(referenceDate = new Date()): Promise<PedagogicalGuideline[]> {
    const all = await this.repository.listGuidelines();
    return all.filter(item => PedagogyEntity.isGuidelineActive(item, referenceDate));
  }

  async createSession(
    data: Omit<ClassSessionRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ClassSessionRecord> {
    PedagogyEntity.validateSessionRecord(data);
    const now = new Date();
    return this.repository.createSession({ ...data, createdAt: now, updatedAt: now });
  }

  async listSessions(educatorId?: string): Promise<ClassSessionRecord[]> {
    return this.repository.listSessions(educatorId);
  }

  async createDifficulty(
    data: Omit<StudentDifficultyRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudentDifficultyRecord> {
    PedagogyEntity.validateDifficulty(data);
    const now = new Date();
    return this.repository.createDifficulty({ ...data, createdAt: now, updatedAt: now });
  }

  async listDifficulties(educatorId?: string): Promise<StudentDifficultyRecord[]> {
    return this.repository.listDifficulties(educatorId);
  }

  async createApplication(
    data: Omit<GuidelineApplication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GuidelineApplication> {
    PedagogyEntity.validateApplication(data);
    const now = new Date();
    return this.repository.createApplication({ ...data, createdAt: now, updatedAt: now });
  }

  async listApplications(educatorId?: string): Promise<GuidelineApplication[]> {
    return this.repository.listApplications(educatorId);
  }

  async createFeedback(
    data: Omit<PedagogicalFeedback, 'id' | 'createdAt'>
  ): Promise<PedagogicalFeedback> {
    PedagogyEntity.validateFeedback(data);
    return this.repository.createFeedback({ ...data, createdAt: new Date() });
  }

  async listFeedbackForEducator(educatorId: string): Promise<PedagogicalFeedback[]> {
    const [direct, collective] = await Promise.all([
      this.repository.listFeedback(educatorId),
      this.repository.listCollectiveFeedback()
    ]);
    const merged = [...direct, ...collective.filter(item => item.toEducatorId !== educatorId)];
    return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listAllFeedback(): Promise<PedagogicalFeedback[]> {
    return this.repository.listFeedback();
  }

  async getDashboardStats(educatorIds: string[]): Promise<PedagogyDashboardStats> {
    const [sessions, difficulties, applications, guidelines] = await Promise.all([
      this.repository.listSessions(),
      this.repository.listDifficulties(),
      this.repository.listApplications(),
      this.repository.listGuidelines()
    ]);

    const studentsServed = sessions.reduce((sum, item) => sum + item.totalStudents, 0);
    const attendanceValues = sessions
      .filter(item => item.totalStudents > 0)
      .map(item => PedagogyEntity.attendanceRate(item));
    const engagementValues = sessions
      .filter(item => item.presentCount > 0)
      .map(item => PedagogyEntity.engagementRate(item));

    const recurringStudents = this.countRecurringDifficulties(difficulties);
    const educatorsWithSession = new Set(sessions.map(item => item.educatorId));
    const educatorsWithPendingRecords = educatorIds.filter(
      id => !educatorsWithSession.has(id)
    ).length;

    const activeGuideline = guidelines.find(item => PedagogyEntity.isGuidelineActive(item));
    const lastApplication = applications[0];

    return {
      studentsServed,
      averageAttendance: this.average(attendanceValues),
      averageEngagement: this.average(engagementValues),
      studentsNeedingFollowup: recurringStudents,
      educatorsWithPendingRecords,
      activeGuidelineTitle: activeGuideline?.title || 'Nenhuma diretriz vigente',
      lastApplicationDate: lastApplication?.createdAt
    };
  }

  getTopDifficulties(records: StudentDifficultyRecord[], limit = 5): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>();
    records.forEach(record => {
      record.difficulties.forEach(type => {
        counts.set(type, (counts.get(type) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private countRecurringDifficulties(records: StudentDifficultyRecord[]): number {
    const byStudent = new Map<string, number>();
    records.forEach(record => {
      const key = record.studentName.trim().toLowerCase();
      byStudent.set(key, (byStudent.get(key) || 0) + 1);
    });
    return Array.from(byStudent.values()).filter(count => count >= 2).length;
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
}

export const pedagogyService = new PedagogyService();
export { FeedbackKind };
