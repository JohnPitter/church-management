import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import type {
  CreateEvaluationRequest, DevelopmentEvaluation, DevelopmentIndices, EvaluationAnswer,
  EvaluationCycle, EvaluationInstrument, EvaluationMoment, EvaluationReport, EvaluationReportFilter, Referral
} from '../../../../../functions/src/pedagogy/contracts';

export type {
  CreateEvaluationRequest, DevelopmentEvaluation, DevelopmentIndices, EvaluationAnswer,
  EvaluationCycle, EvaluationInstrument, EvaluationMoment, EvaluationReport, EvaluationReportFilter, Referral
};

class DevelopmentEvaluationService {
  async getInstrument(): Promise<EvaluationInstrument> {
    const call = httpsCallable<void, EvaluationInstrument>(functions, 'getDevelopmentEvaluationInstrument');
    return (await call()).data;
  }

  async create(data: CreateEvaluationRequest): Promise<DevelopmentEvaluation> {
    const call = httpsCallable<CreateEvaluationRequest, DevelopmentEvaluation>(functions, 'createDevelopmentEvaluation');
    return (await call(data)).data;
  }

  async report(filter: EvaluationReportFilter): Promise<EvaluationReport> {
    const call = httpsCallable<EvaluationReportFilter, EvaluationReport>(functions, 'getDevelopmentEvaluationReport');
    return (await call(filter)).data;
  }
}

export const developmentEvaluationService = new DevelopmentEvaluationService();
