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
  const { filter, report, details, options, loading, detailsLoading, error, updateFilter, loadDetails, retry } = useEvaluationReport(organization);
  const [exporting, setExporting] = useState(false);
  const exportReport = async (format: 'pdf' | 'word') => {
    if (!report || exporting) return;
    setExporting(true);
    try {
      const detailedReport = await loadDetails();
      if (format === 'pdf') await exportEvaluationPDF(detailedReport, instrument);
      else await exportEvaluationWord(detailedReport, instrument);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Erro ao exportar o relatório'); }
    finally { setExporting(false); }
  };
  return <div className="space-y-6">
    <h3 className="text-lg font-semibold">Relatório qualitativo individual e coletivo</h3>
    <EvaluationReportFilters filter={filter} instrument={instrument} options={options} onChange={updateFilter} />
    <div className="flex gap-3">
      <button disabled={loading || !(report?.totalRecords ?? report?.records.length) || exporting || detailsLoading} onClick={() => void exportReport('pdf')} className="rounded bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50">Exportar PDF</button>
      <button disabled={loading || !(report?.totalRecords ?? report?.records.length) || exporting || detailsLoading} onClick={() => void exportReport('word')} className="rounded border border-sky-600 px-4 py-2 text-sm text-sky-700 disabled:opacity-50">Exportar Word</button>
    </div>
    {loading && <p role="status">Carregando avaliações...</p>}
    {error && <div role="alert"><p className="text-red-700">{error}</p><button className="underline" onClick={retry}>Tentar novamente</button></div>}
    {!loading && report && <>
      <EvaluationEvolution report={report} instrument={instrument} />
      {details ? <EvaluationHistory report={details} instrument={instrument} /> : <section className="space-y-3 rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold">Avaliações e acompanhamento qualitativo</h3>
        {(report.totalRecords ?? report.records.length) ? <>
          <p className="text-sm text-gray-600">O histórico detalhado é carregado somente quando solicitado para manter o relatório rápido.</p>
          <button disabled={detailsLoading} onClick={() => void loadDetails().catch(cause => toast.error(cause instanceof Error ? cause.message : 'Erro ao carregar o histórico'))} className="rounded border border-sky-600 px-4 py-2 text-sm text-sky-700 disabled:opacity-50">{detailsLoading ? 'Carregando histórico...' : 'Carregar histórico detalhado'}</button>
        </> : <p className="text-gray-500">Nenhuma avaliação neste período e ciclo.</p>}
      </section>}
    </>}
  </div>;
}
