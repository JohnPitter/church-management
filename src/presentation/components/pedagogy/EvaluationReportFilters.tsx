import React from 'react';
import type { DevelopmentEvaluation, EvaluationCycle, EvaluationInstrument, EvaluationReportFilter } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { evaluationFieldClass } from './EvaluationFields';

interface Props { filter: EvaluationReportFilter; instrument: EvaluationInstrument; options: DevelopmentEvaluation[]; onChange: (updates: Partial<EvaluationReportFilter>) => void }

export default function EvaluationReportFilters({ filter, instrument, options, onChange }: Props) {
  const [year, semester] = filter.period.split('-');
  const classes = Array.from(new Set(options.map(item => item.classGroup))).sort();
  const students = Array.from(new Map(options.filter(item => !filter.classGroup || item.classGroup === filter.classGroup).map(item => [item.studentId, item])).values());
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
    <label>Ano<input type="number" min="2000" max="2099" value={year} className={evaluationFieldClass} onChange={event => onChange({ period: `${event.target.value}-${semester}` })} /></label>
    <label>Semestre<select value={semester} className={evaluationFieldClass} onChange={event => onChange({ period: `${year}-${event.target.value}` })}><option value="1">1º semestre</option><option value="2">2º semestre</option></select></label>
    <label>Ciclo<select value={filter.cycle} className={evaluationFieldClass} onChange={event => onChange({ cycle: Number(event.target.value) as EvaluationCycle })}>
      {instrument.cycles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>
    <label>Turma<select value={filter.classGroup || ''} className={evaluationFieldClass} onChange={event => onChange({ classGroup: event.target.value || undefined, studentId: undefined })}>
      <option value="">Todas as turmas</option>{classes.map(item => <option key={item} value={item}>{item}</option>)}
    </select></label>
    <label>Assistido<select value={filter.studentId || ''} className={evaluationFieldClass} onChange={event => onChange({ studentId: event.target.value || undefined })}>
      <option value="">Coletivo</option>{students.map(item => <option key={item.studentId} value={item.studentId}>{item.studentName} · {item.classGroup}</option>)}
    </select></label>
  </div>;
}
