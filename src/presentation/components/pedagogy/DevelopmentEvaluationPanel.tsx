import React, { useEffect, useState } from 'react';
import { ClassAttendanceRoll, PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { developmentEvaluationService, DevelopmentEvaluation, EvaluationInstrument } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import EvaluationForm from './EvaluationForm';
import EvaluationReportPanel from './EvaluationReportPanel';

type Props = { organization: PedagogyOrganization } & (
  | { mode: 'evaluation'; rolls: ClassAttendanceRoll[]; educatorName: string }
  | { mode: 'reports' }
);

export default function DevelopmentEvaluationPanel(props: Props) {
  const { organization } = props;
  const [instrument, setInstrument] = useState<EvaluationInstrument>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState<DevelopmentEvaluation>();
  useEffect(() => {
    let active = true;
    setError('');
    developmentEvaluationService.getInstrument().then(result => { if (active) setInstrument(result); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar o instrumento de avaliação'); });
    return () => { active = false; };
  }, [retry]);
  if (error) return <div role="alert"><p className="text-red-700">{error}</p><button className="underline" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div>;
  if (!instrument) return <p role="status">Carregando instrumento de avaliação...</p>;
  return <div className="space-y-8">
    {props.mode === 'evaluation' ? <>
      <EvaluationForm key={`${organization}-form`} organization={organization} rolls={props.rolls} educatorName={props.educatorName} instrument={instrument} onSaved={setSaved} />
      {saved?.organization === organization && <p role="status" className="text-sm text-green-700">Avaliação de {saved.studentName} registrada. Consulte os indicadores e o acompanhamento na aba Relatórios.</p>}
    </> : <EvaluationReportPanel key={`${organization}-report`} organization={organization} instrument={instrument} />}
  </div>;
}
