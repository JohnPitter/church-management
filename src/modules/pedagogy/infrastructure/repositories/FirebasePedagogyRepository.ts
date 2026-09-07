import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  ClassAttendanceRoll,
  ClassSessionRecord,
  GuidelineApplication,
  PedagogicalFeedback,
  PedagogicalGuideline,
  resolvePedagogyOrganization,
  StudentDifficultyRecord
} from '../../domain/entities/Pedagogy';

type TimestampLike = Date | Timestamp | { toDate?: () => Date } | undefined;

function toDate(value: TimestampLike, fallback = new Date()): Date {
  if (!value) {
    return fallback;
  }
  if (value instanceof Date) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return fallback;
}

function omitUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export class FirebasePedagogyRepository {
  private readonly guidelines = 'pedagogicalGuidelines';
  private readonly sessions = 'classSessionRecords';
  private readonly difficulties = 'studentDifficultyRecords';
  private readonly applications = 'guidelineApplications';
  private readonly feedback = 'pedagogicalFeedback';
  private readonly attendance = 'classAttendanceRolls';

  async createGuideline(
    data: Omit<PedagogicalGuideline, 'id'>
  ): Promise<PedagogicalGuideline> {
    const ref = await addDoc(collection(db, this.guidelines), this.serializeGuideline(data));
    return { ...data, id: ref.id };
  }

  async updateGuideline(
    id: string,
    updates: Partial<PedagogicalGuideline>
  ): Promise<void> {
    await updateDoc(doc(db, this.guidelines, id), omitUndefined({
      ...this.serializeGuideline(updates as Omit<PedagogicalGuideline, 'id'>),
      updatedAt: Timestamp.fromDate(updates.updatedAt || new Date())
    }) as Record<string, Timestamp | string | number | boolean | object | null>);
  }

  async deleteGuideline(id: string): Promise<void> {
    await deleteDoc(doc(db, this.guidelines, id));
  }

  async getGuideline(id: string): Promise<PedagogicalGuideline | null> {
    const snap = await getDoc(doc(db, this.guidelines, id));
    if (!snap.exists()) {
      return null;
    }
    return this.mapGuideline(snap.id, snap.data());
  }

  async listGuidelines(): Promise<PedagogicalGuideline[]> {
    const snap = await getDocs(
      query(collection(db, this.guidelines), orderBy('validFrom', 'desc'))
    );
    return snap.docs.map(item => this.mapGuideline(item.id, item.data()));
  }

  async createSession(data: Omit<ClassSessionRecord, 'id'>): Promise<ClassSessionRecord> {
    const ref = await addDoc(collection(db, this.sessions), this.serializeSession(data));
    return { ...data, id: ref.id };
  }

  async updateSession(id: string, updates: Partial<ClassSessionRecord>): Promise<void> {
    await updateDoc(doc(db, this.sessions, id), omitUndefined({
      ...this.serializeSession(updates as Omit<ClassSessionRecord, 'id'>),
      updatedAt: Timestamp.fromDate(updates.updatedAt || new Date())
    }) as Record<string, Timestamp | string | number | boolean | object | null>);
  }

  async listSessions(educatorId?: string): Promise<ClassSessionRecord[]> {
    const base = collection(db, this.sessions);
    const q = educatorId
      ? query(base, where('educatorId', '==', educatorId), orderBy('sessionDate', 'desc'))
      : query(base, orderBy('sessionDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(item => this.mapSession(item.id, item.data()));
  }

  async createDifficulty(
    data: Omit<StudentDifficultyRecord, 'id'>
  ): Promise<StudentDifficultyRecord> {
    const ref = await addDoc(collection(db, this.difficulties), this.serializeDifficulty(data));
    return { ...data, id: ref.id };
  }

  async listDifficulties(educatorId?: string): Promise<StudentDifficultyRecord[]> {
    const base = collection(db, this.difficulties);
    const q = educatorId
      ? query(base, where('educatorId', '==', educatorId), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(item => this.mapDifficulty(item.id, item.data()));
  }

  async createApplication(
    data: Omit<GuidelineApplication, 'id'>
  ): Promise<GuidelineApplication> {
    const ref = await addDoc(collection(db, this.applications), this.serializeApplication(data));
    return { ...data, id: ref.id };
  }

  async listApplications(educatorId?: string): Promise<GuidelineApplication[]> {
    const base = collection(db, this.applications);
    const q = educatorId
      ? query(base, where('educatorId', '==', educatorId), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(item => this.mapApplication(item.id, item.data()));
  }

  async createFeedback(
    data: Omit<PedagogicalFeedback, 'id'>
  ): Promise<PedagogicalFeedback> {
    const ref = await addDoc(collection(db, this.feedback), this.serializeFeedback(data));
    return { ...data, id: ref.id };
  }

  async listFeedback(educatorId?: string): Promise<PedagogicalFeedback[]> {
    const base = collection(db, this.feedback);
    const q = educatorId
      ? query(base, where('toEducatorId', '==', educatorId), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(item => this.mapFeedback(item.id, item.data()));
  }

  async listCollectiveFeedback(): Promise<PedagogicalFeedback[]> {
    const snap = await getDocs(
      query(
        collection(db, this.feedback),
        where('isCollective', '==', true),
        orderBy('createdAt', 'desc')
      )
    );
    return snap.docs.map(item => this.mapFeedback(item.id, item.data()));
  }

  async createAttendanceRoll(data: Omit<ClassAttendanceRoll, 'id'>): Promise<ClassAttendanceRoll> {
    const ref = await addDoc(collection(db, this.attendance), this.serializeAttendance(data));
    return { ...data, id: ref.id };
  }

  async listAttendanceRolls(educatorId?: string): Promise<ClassAttendanceRoll[]> {
    const base = collection(db, this.attendance);
    const q = educatorId
      ? query(base, where('educatorId', '==', educatorId), orderBy('sessionDate', 'desc'))
      : query(base, orderBy('sessionDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(item => this.mapAttendance(item.id, item.data()));
  }

  private serializeGuideline(data: Partial<PedagogicalGuideline>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      validFrom: data.validFrom ? Timestamp.fromDate(new Date(data.validFrom)) : undefined,
      validUntil: data.validUntil ? Timestamp.fromDate(new Date(data.validUntil)) : undefined,
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      updatedAt: data.updatedAt ? Timestamp.fromDate(new Date(data.updatedAt)) : undefined,
      supportMaterials: data.supportMaterials || []
    });
  }

  private mapGuideline(id: string, data: Record<string, unknown>): PedagogicalGuideline {
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      title: String(data.title || ''),
      content: String(data.content || ''),
      periodType: data.periodType as PedagogicalGuideline['periodType'],
      validFrom: toDate(data.validFrom as TimestampLike),
      validUntil: toDate(data.validUntil as TimestampLike),
      year: data.year as number | undefined,
      semester: data.semester as 1 | 2 | undefined,
      classGroup: data.classGroup as string | undefined,
      area: data.area as string | undefined,
      supportMaterials: (data.supportMaterials as PedagogicalGuideline['supportMaterials']) || [],
      status: data.status as PedagogicalGuideline['status'],
      createdBy: String(data.createdBy || ''),
      createdByName: String(data.createdByName || ''),
      createdAt: toDate(data.createdAt as TimestampLike),
      updatedAt: toDate(data.updatedAt as TimestampLike)
    };
  }

  private serializeSession(data: Partial<ClassSessionRecord>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      sessionDate: data.sessionDate ? Timestamp.fromDate(new Date(data.sessionDate)) : undefined,
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      updatedAt: data.updatedAt ? Timestamp.fromDate(new Date(data.updatedAt)) : undefined
    });
  }

  private mapSession(id: string, data: Record<string, unknown>): ClassSessionRecord {
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      educatorId: String(data.educatorId || ''),
      educatorName: String(data.educatorName || ''),
      classGroup: String(data.classGroup || ''),
      area: data.area as string | undefined,
      sessionDate: toDate(data.sessionDate as TimestampLike),
      totalStudents: Number(data.totalStudents || 0),
      presentCount: Number(data.presentCount || 0),
      engagedCount: Number(data.engagedCount || 0),
      lowEngagementCount: Number(data.lowEngagementCount || 0),
      notes: data.notes as string | undefined,
      createdAt: toDate(data.createdAt as TimestampLike),
      updatedAt: toDate(data.updatedAt as TimestampLike)
    };
  }

  private serializeDifficulty(data: Partial<StudentDifficultyRecord>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      updatedAt: data.updatedAt ? Timestamp.fromDate(new Date(data.updatedAt)) : undefined
    });
  }

  private mapDifficulty(id: string, data: Record<string, unknown>): StudentDifficultyRecord {
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      educatorId: String(data.educatorId || ''),
      educatorName: String(data.educatorName || ''),
      sessionRecordId: data.sessionRecordId as string | undefined,
      studentName: String(data.studentName || ''),
      classGroup: data.classGroup as string | undefined,
      difficulties: (data.difficulties as StudentDifficultyRecord['difficulties']) || [],
      otherDifficulty: data.otherDifficulty as string | undefined,
      description: String(data.description || ''),
      createdAt: toDate(data.createdAt as TimestampLike),
      updatedAt: toDate(data.updatedAt as TimestampLike)
    };
  }

  private serializeApplication(data: Partial<GuidelineApplication>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      updatedAt: data.updatedAt ? Timestamp.fromDate(new Date(data.updatedAt)) : undefined
    });
  }

  private mapApplication(id: string, data: Record<string, unknown>): GuidelineApplication {
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      educatorId: String(data.educatorId || ''),
      educatorName: String(data.educatorName || ''),
      guidelineId: String(data.guidelineId || ''),
      guidelineTitle: String(data.guidelineTitle || ''),
      month: Number(data.month || 0),
      year: Number(data.year || 0),
      applicationDifficulties: String(data.applicationDifficulties || ''),
      applicationNarrative: String(data.applicationNarrative || ''),
      strategies: String(data.strategies || ''),
      observedResults: String(data.observedResults || ''),
      createdAt: toDate(data.createdAt as TimestampLike),
      updatedAt: toDate(data.updatedAt as TimestampLike)
    };
  }

  private serializeFeedback(data: Partial<PedagogicalFeedback>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      materials: data.materials || []
    });
  }

  private mapFeedback(id: string, data: Record<string, unknown>): PedagogicalFeedback {
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      fromUserId: String(data.fromUserId || ''),
      fromUserName: String(data.fromUserName || ''),
      toEducatorId: data.toEducatorId as string | undefined,
      toEducatorName: data.toEducatorName as string | undefined,
      isCollective: Boolean(data.isCollective),
      guidelineId: data.guidelineId as string | undefined,
      relatedRecordId: data.relatedRecordId as string | undefined,
      kind: data.kind as PedagogicalFeedback['kind'],
      message: String(data.message || ''),
      materials: (data.materials as PedagogicalFeedback['materials']) || [],
      createdAt: toDate(data.createdAt as TimestampLike)
    };
  }

  private serializeAttendance(data: Partial<ClassAttendanceRoll>): Record<string, unknown> {
    return omitUndefined({
      ...data,
      organization: resolvePedagogyOrganization(data.organization),
      sessionDate: data.sessionDate ? Timestamp.fromDate(new Date(data.sessionDate)) : undefined,
      createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : undefined,
      updatedAt: data.updatedAt ? Timestamp.fromDate(new Date(data.updatedAt)) : undefined,
      students: data.students || []
    });
  }

  private mapAttendance(id: string, data: Record<string, unknown>): ClassAttendanceRoll {
    const students = Array.isArray(data.students)
      ? (data.students as Array<{ name?: string; present?: boolean }>).map(student => ({
          name: String(student?.name || ''),
          present: Boolean(student?.present)
        }))
      : [];
    return {
      id,
      organization: resolvePedagogyOrganization(data.organization),
      educatorId: String(data.educatorId || ''),
      educatorName: String(data.educatorName || ''),
      classGroup: String(data.classGroup || ''),
      sessionDate: toDate(data.sessionDate as TimestampLike),
      students,
      createdAt: toDate(data.createdAt as TimestampLike),
      updatedAt: toDate(data.updatedAt as TimestampLike)
    };
  }
}
