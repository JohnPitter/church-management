import { useEffect, useState } from 'react';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { developmentEvaluationService, DevelopmentEvaluation, EvaluationReport, EvaluationReportFilter } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';

export function useEvaluationReport({ organization, refresh, saved }: { organization: PedagogyOrganization; refresh: number; saved?: DevelopmentEvaluation }) {
  const today = new Date();
  const [filter, setFilter] = useState<EvaluationReportFilter>({ organization, cycle: 1, period: `${today.getFullYear()}-${today.getMonth() < 6 ? 1 : 2}` });
  const [report, setReport] = useState<EvaluationReport>();
  const [options, setOptions] = useState<DevelopmentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (saved?.organization === organization) setFilter({ organization, cycle: saved.cycle, period: saved.period });
  }, [saved, organization]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setReport(undefined);
    developmentEvaluationService.report(filter).then(result => {
      if (!active) return;
      setReport(result);
      if (!filter.classGroup && !filter.studentId) setOptions(result.records);
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar as avaliações'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, refresh, retry]);
  const updateFilter = (updates: Partial<EvaluationReportFilter>) => {
    if (updates.period || updates.cycle) {
      setOptions([]);
      setFilter(current => ({ ...current, ...updates, classGroup: undefined, studentId: undefined }));
      return;
    }
    setFilter(current => ({ ...current, ...updates }));
  };
  return { filter, report, options, loading, error, updateFilter, retry: () => setRetry(value => value + 1) };
}
