import {
  ClassSessionRecord,
  FeedbackKind,
  GuidelineApplication,
  PedagogyEntity,
  PedagogicalFeedback,
  PedagogicalGuideline,
  PedagogyOrganization,
  StudentDifficultyRecord,
  belongsToOrganization
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
    return this.repository.createGuideline({
      ...data,
      organization: data.organization || PedagogyOrganization.Church,
      createdAt: now,
      updatedAt: now
    });
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

  async listGuidelines(organization?: PedagogyOrganization): Promise<PedagogicalGuideline[]> {
    return this.filterByOrganization(await this.repository.listGuidelines(), organization);
  }

  async listActiveGuidelines(
    referenceDate = new Date(),
    organization?: PedagogyOrganization
  ): Promise<PedagogicalGuideline[]> {
    const all = await this.listGuidelines(organization);
    return all.filter(item => PedagogyEntity.isGuidelineActive(item, referenceDate));
  }

  async createSession(
    data: Omit<ClassSessionRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ClassSessionRecord> {
    PedagogyEntity.validateSessionRecord(data);
    const now = new Date();
    return this.repository.createSession({
      ...data,
      organization: data.organization || PedagogyOrganization.Church,
      createdAt: now,
      updatedAt: now
    });
  }

  async listSessions(
    educatorId?: string,
    organization?: PedagogyOrganization
  ): Promise<ClassSessionRecord[]> {
    return this.filterByOrganization(await this.repository.listSessions(educatorId), organization);
  }

  async createDifficulty(
    data: Omit<StudentDifficultyRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudentDifficultyRecord> {
    PedagogyEntity.validateDifficulty(data);
    const now = new Date();
    return this.repository.createDifficulty({
      ...data,
      organization: data.organization || PedagogyOrganization.Church,
      createdAt: now,
      updatedAt: now
    });
  }

  async listDifficulties(
    educatorId?: string,
    organization?: PedagogyOrganization
  ): Promise<StudentDifficultyRecord[]> {
    return this.filterByOrganization(await this.repository.listDifficulties(educatorId), organization);
  }

  async createApplication(
    data: Omit<GuidelineApplication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GuidelineApplication> {
    PedagogyEntity.validateApplication(data);
    const now = new Date();
    return this.repository.createApplication({
      ...data,
      organization: data.organization || PedagogyOrganization.Church,
      createdAt: now,
      updatedAt: now
    });
  }

  async listApplications(
    educatorId?: string,
    organization?: PedagogyOrganization
  ): Promise<GuidelineApplication[]> {
    return this.filterByOrganization(await this.repository.listApplications(educatorId), organization);
  }

  async createFeedback(
    data: Omit<PedagogicalFeedback, 'id' | 'createdAt'>
  ): Promise<PedagogicalFeedback> {
    PedagogyEntity.validateFeedback(data);
    return this.repository.createFeedback({
      ...data,
      organization: data.organization || PedagogyOrganization.Church,
      createdAt: new Date()
    });
  }

  async listFeedbackForEducator(
    educatorId: string,
    organization?: PedagogyOrganization
  ): Promise<PedagogicalFeedback[]> {
    const [direct, collective] = await Promise.all([
      this.repository.listFeedback(educatorId),
      this.repository.listCollectiveFeedback()
    ]);
    const merged = [...direct, ...collective.filter(item => item.toEducatorId !== educatorId)];
    return this.filterByOrganization(merged, organization)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listAllFeedback(organization?: PedagogyOrganization): Promise<PedagogicalFeedback[]> {
    return this.filterByOrganization(await this.repository.listFeedback(), organization);
  }

  async getDashboardStats(
    educatorIds: string[],
    organization?: PedagogyOrganization
  ): Promise<PedagogyDashboardStats> {
    const [sessions, difficulties, applications, guidelines] = await Promise.all([
      this.listSessions(undefined, organization),
      this.listDifficulties(undefined, organization),
      this.listApplications(undefined, organization),
      this.listGuidelines(organization)
    ]);

    const studentsServed = sessions.reduce((sum, item) => sum + item.totalStudents, 0);
    const attendanceValues = sessions
      .filter(item => item.totalStudents > 0)
      .map(item => PedagogyEntity.attendanceRate(item));
    const engagementValues = sessions
      .filter(item => item.presentCount > 0)
      .map(item => PedagogyEntity.engagementRate(item));

    const recurringStudents = this.countRecurringDifficulties(difficulties);
    const educatorsWithPendingRecords = PedagogyEntity.educatorsWithoutSessionRecords(
      educatorIds.map(id => ({ id })),
      sessions
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

  private filterByOrganization<T extends { organization?: PedagogyOrganization }>(
    items: T[],
    organization?: PedagogyOrganization
  ): T[] {
    if (!organization) {
      return items;
    }
    return items.filter(item => belongsToOrganization(item.organization, organization));
  }
}

export const pedagogyService = new PedagogyService();
export { FeedbackKind };
