import React, { FormEvent, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ClassAttendanceRoll, PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { CreateEvaluationRequest, DevelopmentEvaluation, developmentEvaluationService, EvaluationInstrument } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { EvaluationIdentification, EvaluationObservations, EvaluationQuestions } from './EvaluationFields';

function initialDraft(): Omit<CreateEvaluationRequest, 'requestId' | 'organization'> {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return {
    attendanceRollId: '', studentName: '', age: 0, cycle: 1, moment: 'initial',
    period: `${today.getFullYear()}-${today.getMonth() < 6 ? 1 : 2}`, evaluationDate: localDate,
    answers: {}, observations: { attention: '', potential: '', additional: '' }, referrals: [], otherReferral: ''
  };
}

interface Props {
  organization: PedagogyOrganization;
  rolls: ClassAttendanceRoll[];
  educatorName: string;
  instrument: EvaluationInstrument;
  onSaved: (record: DevelopmentEvaluation) => void;
}

export default function EvaluationForm({ organization, rolls, educatorName, instrument, onSaved }: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const requestId = useRef<string | undefined>(undefined);
  const onChange = (updates: Partial<typeof draft>) => {
    requestId.current = undefined;
    setDraft(current => ({ ...current, ...updates }));
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    requestId.current = requestId.current || crypto.randomUUID();
    try {
      const record = await developmentEvaluationService.create({ ...draft, requestId: requestId.current, organization });
      toast.success('Avaliação registrada');
      requestId.current = undefined;
      setDraft(current => ({ ...current, studentName: '', age: 0, answers: {}, observations: { attention: '', potential: '', additional: '' }, referrals: [], otherReferral: '' }));
      onSaved(record);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a avaliação');
    } finally { setSaving(false); }
  };
  if (!rolls.length) return <p className="text-gray-600">Registre uma chamada para selecionar o assistido e a turma da avaliação.</p>;
  return <form onSubmit={save} className="space-y-6">
    <h3 className="text-lg font-semibold">Avaliação do Desenvolvimento</h3>
    <p className="text-sm text-gray-600">Responda às nove perguntas a partir das observações do cotidiano. Utilize N/O quando não foi possível observar.</p>
    <fieldset disabled={saving} className="space-y-6">
      <EvaluationIdentification draft={draft} instrument={instrument} onChange={onChange} rolls={rolls} educatorName={educatorName} />
      <EvaluationQuestions draft={draft} instrument={instrument} onChange={onChange} />
      <EvaluationObservations draft={draft} instrument={instrument} onChange={onChange} />
    </fieldset>
    <button disabled={saving} type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar avaliação'}</button>
  </form>;
}
