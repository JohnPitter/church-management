import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import type { EvaluationInstrument } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { EvaluationEvolution, EvaluationHistory } from './EvaluationResults';
import EvaluationReportFilters from './EvaluationReportFilters';
import { useEvaluationReport } from './useEvaluationReport';
import { exportEvaluationPDF, exportEvaluationWord } from '../../utils/evaluationReportExport';

interface Props { organization: PedagogyOrganization; instrument: EvaluationInstrument }

export default function EvaluationReportPanel({ organization, instrument }: Props) {
  const { filter, report, options, loading, error, updateFilter, retry } = useEvaluationReport(organization);
  const [exporting, setExporting] = useState(false);
  const exportReport = async (format: 'pdf' | 'word') => {
    if (!report || exporting) return;
    setExporting(true);
    try {
      if (format === 'pdf') await exportEvaluationPDF(report, instrument);
      else await exportEvaluationWord(report, instrument);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Erro ao exportar o relatório'); }
    finally { setExporting(false); }
  };
  return <div className="space-y-6">
    <h3 className="text-lg font-semibold">Relatório qualitativo individual e coletivo</h3>
    <EvaluationReportFilters filter={filter} instrument={instrument} options={options} onChange={updateFilter} />
    <div className="flex gap-3">
      <button disabled={loading || !report?.records.length || exporting} onClick={() => void exportReport('pdf')} className="rounded bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50">Exportar PDF</button>
      <button disabled={loading || !report?.records.length || exporting} onClick={() => void exportReport('word')} className="rounded border border-sky-600 px-4 py-2 text-sm text-sky-700 disabled:opacity-50">Exportar Word</button>
    </div>
    {loading && <p role="status">Carregando avaliações...</p>}
    {error && <div role="alert"><p className="text-red-700">{error}</p><button className="underline" onClick={retry}>Tentar novamente</button></div>}
    {!loading && report && <><EvaluationEvolution report={report} instrument={instrument} /><EvaluationHistory report={report} instrument={instrument} /></>}
  </div>;
}
