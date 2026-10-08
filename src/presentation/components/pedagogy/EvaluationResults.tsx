import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { EvaluationInstrument, EvaluationReport } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { formatDevelopmentIndex as formatIndex } from '../../utils/evaluationReportContent';
import { evaluationChartSeries, evaluationDimensionSeries, evolutionColors } from '../../utils/evaluationChart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export function EvaluationEvolution({ report, instrument }: { report: EvaluationReport; instrument: EvaluationInstrument }) {
  const series = evaluationChartSeries(report, instrument);
  const labels = report.evolution.map(item => instrument.moments.find(moment => moment.id === item.moment)?.label || item.moment);
  return <section className="space-y-4">
    <h3 className="font-semibold">Evolução do desenvolvimento</h3>
    <p className="text-sm text-gray-600">{report.studentCount} assistido(s) · {report.totalRecords ?? report.records.length} avaliação(ões) no período. Dados não observados ficam fora do cálculo.</p>
    <div className="h-72"><Line data={{ labels, datasets: series.map((item, index) => ({
      label: item.label, data: item.values, borderColor: evolutionColors[index], backgroundColor: evolutionColors[index], spanGaps: false
    })) }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, ticks: { callback: value => `${value}%` } } } }} /></div>
    <h4 className="font-medium">Desenvolvimento por dimensão (IDD)</h4>
    <div className="h-[520px]"><Bar data={{ labels: instrument.dimensions.map(item => item.label), datasets: evaluationDimensionSeries(report, instrument)
      .map((item, index) => ({ label: item.label, data: item.values, backgroundColor: evolutionColors[index] })) }}
      options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { min: 0, max: 100, ticks: { callback: value => `${value}%` } } } }} /></div>
    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <caption className="text-left font-medium mb-2">IDG, IDE e IDD por momento</caption>
      <thead><tr><th className="p-2">Índice</th>{labels.map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead>
      <tbody>
        <tr><th className="p-2">Assistidos avaliados</th>{report.evolution.map(item => <td className="p-2" key={item.moment}>{item.students}</td>)}</tr>
        {series.map(item => <tr className="border-t" key={item.label}><th className="p-2">{item.label}</th>{item.values.map((value, index) => <td className="p-2" key={index}>{formatIndex(value)}</td>)}</tr>)}
        {instrument.dimensions.map(dimension => <tr className="border-t" key={dimension.id}><th className="p-2">IDD — {dimension.label}</th>
          {report.evolution.map(item => <td className="p-2" key={item.moment}>{formatIndex(item.indices.idd[dimension.id])}</td>)}
        </tr>)}
      </tbody>
    </table></div>
    <p className="text-xs text-gray-500">{report.methodology}</p>
  </section>;
}

export function EvaluationHistory({ report, instrument }: { report: EvaluationReport; instrument: EvaluationInstrument }) {
  return <section className="space-y-3">
    <h3 className="font-semibold">Avaliações e acompanhamento qualitativo</h3>
    {report.records.map(record => <details key={record.id} className="rounded-lg border border-gray-200 p-4">
      <summary className="cursor-pointer font-medium">{record.studentName} · {record.classGroup} · {instrument.moments.find(item => item.id === record.moment)?.label} · {record.evaluationDate.split('-').reverse().join('/')} · IDG {formatIndex(record.indices.idg)}</summary>
      <div className="mt-4 space-y-3 text-sm">
        <p>{record.educatorName} · {record.age} anos · {instrument.cycles.find(item => item.id === record.cycle)?.label}</p>
        {instrument.cycles.find(item => item.id === record.cycle)?.questions.map(question => <p key={question.dimensionId}>
          <strong>{question.text}</strong><br />{instrument.answers.find(item => item.id === record.answers[question.dimensionId])?.label}
        </p>)}
        {instrument.observations.map(item => <p className="whitespace-pre-wrap" key={item.id}><strong>{item.label}</strong><br />{record.observations[item.id] || 'Sem observação registrada'}</p>)}
        <p><strong>Necessidade de encaminhamento:</strong> {record.referrals.map(id => instrument.referrals.find(item => item.id === id)?.label).join('; ')}</p>
        {record.otherReferral && <p className="whitespace-pre-wrap">Outro encaminhamento: {record.otherReferral}</p>}
      </div>
    </details>)}
    {!report.records.length && <p className="text-gray-500">Nenhuma avaliação neste período e ciclo.</p>}
  </section>;
}
