export enum PedagogyOrganization {
  Church = 'church',
  ONG = 'ong'
}

export const PEDAGOGY_ORGANIZATION_LABELS: Record<PedagogyOrganization, string> = {
  [PedagogyOrganization.Church]: 'Igreja',
  [PedagogyOrganization.ONG]: 'ONG'
};

export function resolvePedagogyOrganization(value: unknown): PedagogyOrganization {
  return value === PedagogyOrganization.ONG
    ? PedagogyOrganization.ONG
    : PedagogyOrganization.Church;
}

export function belongsToOrganization(
  value: unknown,
  organization: PedagogyOrganization
): boolean {
  return resolvePedagogyOrganization(value) === organization;
}

export enum GuidelineStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived'
}

export enum GuidelinePeriodType {
  Semester = 'semester',
  Year = 'year',
  Custom = 'custom'
}

export enum SupportMaterialType {
  Link = 'link',
  Image = 'image',
  Video = 'video'
}

export enum StudentDifficultyType {
  Attention = 'attention',
  Comprehension = 'comprehension',
  SocialInteraction = 'social_interaction',
  Behavior = 'behavior',
  Participation = 'participation',
  Communication = 'communication',
  Learning = 'learning',
  Other = 'other'
}

export enum FeedbackKind {
  Feedback = 'feedback',
  Adjustment = 'adjustment',
  Guidance = 'guidance',
  Reply = 'reply',
  RequestInfo = 'request_info',
  Material = 'material',
  Followup = 'followup'
}

export interface SupportMaterial {
  type: SupportMaterialType;
  title: string;
  url: string;
}

export interface PedagogicalGuideline {
  id: string;
  organization: PedagogyOrganization;
  title: string;
  content: string;
  periodType: GuidelinePeriodType;
  validFrom: Date;
  validUntil: Date;
  year?: number;
  semester?: 1 | 2;
  classGroup?: string;
  area?: string;
  supportMaterials: SupportMaterial[];
  status: GuidelineStatus;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSessionRecord {
  id: string;
  organization: PedagogyOrganization;
  educatorId: string;
  educatorName: string;
  classGroup: string;
  area?: string;
  sessionDate: Date;
  totalStudents: number;
  presentCount: number;
  engagedCount: number;
  lowEngagementCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentDifficultyRecord {
  id: string;
  organization: PedagogyOrganization;
  educatorId: string;
  educatorName: string;
  sessionRecordId?: string;
  studentName: string;
  classGroup?: string;
  difficulties: StudentDifficultyType[];
  otherDifficulty?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidelineApplication {
  id: string;
  organization: PedagogyOrganization;
  educatorId: string;
  educatorName: string;
  guidelineId: string;
  guidelineTitle: string;
  month: number;
  year: number;
  applicationDifficulties: string;
  applicationNarrative: string;
  strategies: string;
  observedResults: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PedagogicalFeedback {
  id: string;
  organization: PedagogyOrganization;
  fromUserId: string;
  fromUserName: string;
  toEducatorId?: string;
  toEducatorName?: string;
  isCollective: boolean;
  guidelineId?: string;
  relatedRecordId?: string;
  kind: FeedbackKind;
  message: string;
  materials: SupportMaterial[];
  createdAt: Date;
}

export const DIFFICULTY_LABELS: Record<StudentDifficultyType, string> = {
  [StudentDifficultyType.Attention]: 'Atenção',
  [StudentDifficultyType.Comprehension]: 'Compreensão',
  [StudentDifficultyType.SocialInteraction]: 'Interação social',
  [StudentDifficultyType.Behavior]: 'Comportamento',
  [StudentDifficultyType.Participation]: 'Participação',
  [StudentDifficultyType.Communication]: 'Comunicação',
  [StudentDifficultyType.Learning]: 'Aprendizagem',
  [StudentDifficultyType.Other]: 'Outros'
};

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  [FeedbackKind.Feedback]: 'Feedback',
  [FeedbackKind.Adjustment]: 'Solicitar ajuste',
  [FeedbackKind.Guidance]: 'Orientação pedagógica',
  [FeedbackKind.Reply]: 'Resposta a registro',
  [FeedbackKind.RequestInfo]: 'Solicitar informação',
  [FeedbackKind.Material]: 'Compartilhar material',
  [FeedbackKind.Followup]: 'Encaminhamento'
};

export class PedagogyEntity {
  static validateGuideline(data: Partial<PedagogicalGuideline>): void {
    if (!data.title?.trim()) {
      throw new Error('Título da diretriz é obrigatório');
    }
    if (!data.content?.trim()) {
      throw new Error('Conteúdo da diretriz é obrigatório');
    }
    if (!data.validFrom || !data.validUntil) {
      throw new Error('Período de validade é obrigatório');
    }
    if (new Date(data.validUntil).getTime() < new Date(data.validFrom).getTime()) {
      throw new Error('A data final deve ser posterior à data inicial');
    }
  }

  static isGuidelineActive(guideline: PedagogicalGuideline, referenceDate = new Date()): boolean {
    if (guideline.status !== GuidelineStatus.Published) {
      return false;
    }
    const from = new Date(guideline.validFrom).getTime();
    const until = new Date(guideline.validUntil).getTime();
    const now = referenceDate.getTime();
    return now >= from && now <= until;
  }

  static validateSessionRecord(data: Partial<ClassSessionRecord>): void {
    if (!data.classGroup?.trim()) {
      throw new Error('Turma é obrigatória');
    }
    if (!data.sessionDate) {
      throw new Error('Data do encontro é obrigatória');
    }
    const total = data.totalStudents ?? 0;
    const present = data.presentCount ?? 0;
    const engaged = data.engagedCount ?? 0;
    const low = data.lowEngagementCount ?? 0;
    if (total < 0 || present < 0 || engaged < 0 || low < 0) {
      throw new Error('Indicadores não podem ser negativos');
    }
    if (present > total) {
      throw new Error('Presentes não podem exceder o total de alunos');
    }
    if (engaged + low > present) {
      throw new Error('Engajados e baixo engajamento não podem exceder os presentes');
    }
  }

  static attendanceRate(record: Pick<ClassSessionRecord, 'totalStudents' | 'presentCount'>): number {
    if (record.totalStudents <= 0) {
      return 0;
    }
    return Math.round((record.presentCount / record.totalStudents) * 100);
  }

  static engagementRate(record: Pick<ClassSessionRecord, 'presentCount' | 'engagedCount'>): number {
    if (record.presentCount <= 0) {
      return 0;
    }
    return Math.round((record.engagedCount / record.presentCount) * 100);
  }

  static educatorsWithoutSessionRecords<T extends { id: string }>(
    educators: T[],
    sessions: Array<{ educatorId: string }>
  ): T[] {
    const withSession = new Set(sessions.map(item => item.educatorId));
    return educators.filter(educator => !withSession.has(educator.id));
  }

  static validateDifficulty(data: Partial<StudentDifficultyRecord>): void {
    if (!data.studentName?.trim()) {
      throw new Error('Nome do aluno é obrigatório');
    }
    if (!data.difficulties?.length) {
      throw new Error('Selecione ao menos uma dificuldade');
    }
    if (
      data.difficulties.includes(StudentDifficultyType.Other)
      && !data.otherDifficulty?.trim()
    ) {
      throw new Error('Descreva a dificuldade em "Outros"');
    }
    if (!data.description?.trim()) {
      throw new Error('Descrição breve da situação é obrigatória');
    }
  }

  static validateApplication(data: Partial<GuidelineApplication>): void {
    if (!data.guidelineId) {
      throw new Error('Diretriz pedagógica é obrigatória');
    }
    if (!data.month || data.month < 1 || data.month > 12) {
      throw new Error('Mês inválido');
    }
    if (!data.year) {
      throw new Error('Ano é obrigatório');
    }
    if (!data.applicationNarrative?.trim()) {
      throw new Error('Relato da aplicação é obrigatório');
    }
  }

  static validateFeedback(data: Partial<PedagogicalFeedback>): void {
    if (!data.message?.trim()) {
      throw new Error('Mensagem é obrigatória');
    }
    if (!data.isCollective && !data.toEducatorId) {
      throw new Error('Selecione o arte-educador destinatário');
    }
  }
}
