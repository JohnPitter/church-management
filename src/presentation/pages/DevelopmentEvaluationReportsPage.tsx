import React, { useState } from 'react';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import PageShell from '../components/common/PageShell';
import PedagogyOrgSwitch from '../components/PedagogyOrgSwitch';
import DevelopmentEvaluationPanel from '../components/pedagogy/DevelopmentEvaluationPanel';

export default function DevelopmentEvaluationReportsPage() {
  const [organization, setOrganization] = useState(PedagogyOrganization.ONG);
  return <PageShell title="Avaliações do Desenvolvimento" subtitle="Acompanhamento qualitativo para as equipes de Pedagogia e Psicologia">
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <PedagogyOrgSwitch value={organization} onChange={setOrganization} />
      <DevelopmentEvaluationPanel mode="reports" organization={organization} />
    </div>
  </PageShell>;
}
