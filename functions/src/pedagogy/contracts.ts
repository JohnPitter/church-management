export type EvaluationOrganization = 'church' | 'ong';
export type EvaluationCycle = 1 | 2 | 3 | 4 | 5;
export type EvaluationMoment = 'initial' | 'intermediate' | 'final';
export type EvaluationAnswer = 'A' | 'B' | 'C' | 'NO';
export type EvaluationAxis = 'eu' | 'outro' | 'mundo';
export type Referral = 'none' | 'psychology' | 'family' | 'coordination' | 'other';

export interface EvaluationDimension {
  id: string;
  axis: EvaluationAxis;
  label: string;
}

export interface EvaluationQuestion {
  dimensionId: string;
  text: string;
  example: string;
}

export interface EvaluationInstrument {
  version: number;
  axes: Array<{ id: EvaluationAxis; label: string; description: string }>;
  dimensions: EvaluationDimension[];
  cycles: Array<{ id: EvaluationCycle; label: string; questions: EvaluationQuestion[] }>;
  moments: Array<{ id: EvaluationMoment; label: string }>;
  answers: Array<{ id: EvaluationAnswer; label: string }>;
  referrals: Array<{ id: Referral; label: string }>;
  observations: Array<{ id: 'attention' | 'potential' | 'additional'; label: string; example: string }>;
}

export interface CreateEvaluationRequest {
  requestId: string;
  organization: EvaluationOrganization;
  attendanceRollId: string;
  studentName: string;
  age: number;
  cycle: EvaluationCycle;
  moment: EvaluationMoment;
  period: string;
  evaluationDate: string;
  answers: Record<string, EvaluationAnswer>;
  observations: { attention: string; potential: string; additional: string };
  referrals: Referral[];
  otherReferral: string;
}

export interface DevelopmentIndices {
  idg: number | null;
  ide: Record<EvaluationAxis, number | null>;
  idd: Record<string, number | null>;
  observedQuestions: number;
  obtainedPoints: number;
  maximumPoints: number;
}

export interface DevelopmentEvaluation extends CreateEvaluationRequest {
  id: string;
  instrumentVersion: number;
  studentId: string;
  classGroup: string;
  educatorId: string;
  educatorName: string;
  createdAt: string;
  indices: DevelopmentIndices;
}

export interface EvaluationReportFilter {
  organization: EvaluationOrganization;
  period: string;
  cycle: EvaluationCycle;
  classGroup?: string;
  studentId?: string;
  includeDetails?: boolean;
}

export interface EvaluationReport {
  filter: EvaluationReportFilter;
  generatedAt: string;
  records: DevelopmentEvaluation[];
  totalRecords: number;
  detailsLoaded: boolean;
  evolution: Array<{ moment: EvaluationMoment; indices: DevelopmentIndices; students: number; evaluations: number }>;
  studentCount: number;
  methodology: string;
}
