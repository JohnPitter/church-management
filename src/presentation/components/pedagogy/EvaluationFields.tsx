import React from 'react';
import type { CreateEvaluationRequest, EvaluationAnswer, EvaluationInstrument, Referral } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { ClassAttendanceRoll } from '@modules/pedagogy/domain/entities/Pedagogy';

export const evaluationFieldClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';
type Draft = Omit<CreateEvaluationRequest, 'requestId' | 'organization'>;
interface FieldsProps { draft: Draft; instrument: EvaluationInstrument; onChange: (updates: Partial<Draft>) => void }

export function EvaluationIdentification({ draft, instrument, onChange, rolls, educatorName }: FieldsProps & { rolls: ClassAttendanceRoll[]; educatorName: string }) {
  const selectedRoll = rolls.find(roll => roll.id === draft.attendanceRollId);
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <label>Chamada e turma<select required className={evaluationFieldClass} value={draft.attendanceRollId}
      onChange={event => onChange({ attendanceRollId: event.target.value, studentName: '' })}>
      <option value="">Selecione a chamada</option>
      {rolls.map(roll => <option key={roll.id} value={roll.id}>{roll.classGroup} · {roll.sessionDate.toLocaleDateString('pt-BR')}</option>)}
    </select></label>
    <label>Assistido<select required className={evaluationFieldClass} value={draft.studentName} onChange={event => onChange({ studentName: event.target.value })}>
      <option value="">Selecione o assistido da chamada</option>
      {selectedRoll?.students.map((student, index) => <option key={index} value={student.name}>{student.name}</option>)}
    </select></label>
    <label>Idade<input required type="number" min="4" max="130" className={evaluationFieldClass} value={draft.age || ''}
      onChange={event => onChange({ age: Number(event.target.value) })} /></label>
    <label>Ciclo<select required className={evaluationFieldClass} value={draft.cycle} onChange={event => onChange({ cycle: Number(event.target.value) as Draft['cycle'], answers: {} })}>
      {instrument.cycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}
    </select></label>
    <label>Momento da avaliação<select required className={evaluationFieldClass} value={draft.moment} onChange={event => onChange({ moment: event.target.value as Draft['moment'] })}>
      {instrument.moments.map(moment => <option key={moment.id} value={moment.id}>{moment.label}</option>)}
    </select></label>
    <label>Data da avaliação<input required type="date" className={evaluationFieldClass} value={draft.evaluationDate} onChange={event => onChange({ evaluationDate: event.target.value })} /></label>
    <label>Ano<input required type="number" min="2000" max="2099" className={evaluationFieldClass} value={draft.period.split('-')[0]}
      onChange={event => onChange({ period: `${event.target.value}-${draft.period.split('-')[1]}` })} /></label>
    <label>Semestre<select className={evaluationFieldClass} value={draft.period.split('-')[1]} onChange={event => onChange({ period: `${draft.period.split('-')[0]}-${event.target.value}` })}>
      <option value="1">1º semestre</option><option value="2">2º semestre</option>
    </select></label>
    <p className="text-sm text-gray-600 md:col-span-2">Arte-educador: {educatorName}. Selecione o ciclo apropriado ao acompanhamento do assistido.</p>
  </div>;
}

export function EvaluationQuestions({ draft, instrument, onChange }: FieldsProps) {
  const cycle = instrument.cycles.find(item => item.id === draft.cycle);
  return <div className="space-y-6">{instrument.axes.map(axis => <section key={axis.id} className="space-y-4">
    <h4 className="font-semibold text-sky-900">{axis.label} — {axis.description}</h4>
    {cycle?.questions.filter(question => instrument.dimensions.find(dimension => dimension.id === question.dimensionId)?.axis === axis.id)
      .map(question => <fieldset key={question.dimensionId} className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">{question.text}</legend>
        <p className="mb-3 text-sm text-gray-500">{question.example}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{instrument.answers.map(answer => <label key={answer.id} className="flex items-start gap-2 text-sm">
          <input required type="radio" name={question.dimensionId} value={answer.id} checked={draft.answers[question.dimensionId] === answer.id}
            onChange={() => onChange({ answers: { ...draft.answers, [question.dimensionId]: answer.id as EvaluationAnswer } })} />
          {answer.id === 'NO' ? 'N/O' : answer.id}) {answer.label}
        </label>)}</div>
      </fieldset>)}
  </section>)}</div>;
}

export function EvaluationObservations({ draft, instrument, onChange }: FieldsProps) {
  const toggle = (referral: Referral) => {
    if (referral === 'none') return onChange({ referrals: draft.referrals.includes('none') ? [] : ['none'] });
    const next = draft.referrals.filter(item => item !== 'none');
    onChange({ referrals: next.includes(referral) ? next.filter(item => item !== referral) : [...next, referral] });
  };
  return <section className="space-y-4">
    <h4 className="font-semibold">Observações Complementares e Encaminhamentos</h4>
    <p className="text-sm text-gray-600">As observações são opcionais e complementam o relatório. O arte-educador observa e comunica; a coordenação analisa e encaminha.</p>
    {instrument.observations.map(observation => <label key={observation.id} className="block text-sm">
      {observation.label} (opcional)
      <textarea maxLength={5000} className={`${evaluationFieldClass} mt-1 min-h-[90px]`} placeholder={observation.example}
        value={draft.observations[observation.id]} onChange={event => onChange({ observations: { ...draft.observations, [observation.id]: event.target.value } })} />
    </label>)}
    <fieldset className="space-y-2"><legend className="mb-2 font-medium">Necessidade de acompanhamento ou encaminhamento (obrigatório)</legend>
      {instrument.referrals.map(referral => <label key={referral.id} className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={draft.referrals.includes(referral.id)} onChange={() => toggle(referral.id)} />{referral.label}
      </label>)}
    </fieldset>
    {draft.referrals.includes('other') && <label className="block text-sm">Outro encaminhamento (opcional)
      <textarea maxLength={5000} className={evaluationFieldClass} value={draft.otherReferral} onChange={event => onChange({ otherReferral: event.target.value })} />
    </label>}
  </section>;
}
