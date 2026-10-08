import { useEffect, useState } from 'react';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { developmentEvaluationService, DevelopmentEvaluation, EvaluationReport, EvaluationReportFilter } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export function useEvaluationReport(organization: PedagogyOrganization) {
  const today = new Date();
  const [filter, setFilter] = useState<EvaluationReportFilter>({ organization, cycle: 1, period: `${today.getFullYear()}-${today.getMonth() < 6 ? 1 : 2}` });
  const requestedFilter = useDebouncedValue(filter, 350);
  const [report, setReport] = useState<EvaluationReport>();
  const [details, setDetails] = useState<EvaluationReport>();
  const [options, setOptions] = useState<DevelopmentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!/^20\d{2}-[12]$/.test(requestedFilter.period)) {
      setLoading(false);
      setReport(undefined);
      return () => { active = false; };
    }
    setLoading(true); setError(''); setReport(undefined);
    setDetails(undefined);
    developmentEvaluationService.report({ ...requestedFilter, includeDetails: false }).then(result => {
      if (!active) return;
      setReport(result);
      if (!requestedFilter.classGroup && !requestedFilter.studentId) setOptions(result.records);
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar as avaliações'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedFilter, retry]);
  const updateFilter = (updates: Partial<EvaluationReportFilter>) => {
    setLoading(true);
    setDetails(undefined);
    if (updates.period || updates.cycle) {
      setOptions([]);
      setFilter(current => ({ ...current, ...updates, classGroup: undefined, studentId: undefined }));
      return;
    }
    setFilter(current => ({ ...current, ...updates }));
  };
  const loadDetails = async (): Promise<EvaluationReport> => {
    if (details) return details;
    setDetailsLoading(true);
    try {
      const detailedReport = await developmentEvaluationService.report({ ...requestedFilter, includeDetails: true });
      setDetails(detailedReport);
      return detailedReport;
    } finally { setDetailsLoading(false); }
  };
  return { filter, report, details, options, loading, detailsLoading, error, updateFilter, loadDetails, retry: () => setRetry(value => value + 1) };
}
