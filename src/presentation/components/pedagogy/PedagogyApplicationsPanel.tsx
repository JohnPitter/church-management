import React from 'react';
import { GuidelineApplication } from '@modules/pedagogy/domain/entities/Pedagogy';

export default function PedagogyApplicationsPanel({ applications }: { applications: GuidelineApplication[] }) {
  return <section className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold">Aplicação das diretrizes</h3>
      <p className="mt-1 text-sm text-gray-600">Relatos dos arte-educadores sobre as atividades realizadas, estratégias utilizadas e resultados observados na aplicação de cada diretriz.</p>
    </div>
    {!applications.length && <p className="text-gray-500">Nenhuma aplicação de diretriz registrada neste contexto.</p>}
    {applications.map(item => <article key={item.id} className="rounded-lg border border-gray-200 p-5 space-y-2">
      <h4 className="font-semibold">{item.guidelineTitle} · {String(item.month).padStart(2, '0')}/{item.year}</h4>
      <p className="text-xs text-gray-500">{item.educatorName}</p>
      <p><strong>Dificuldades:</strong> {item.applicationDifficulties || '—'}</p>
      <p><strong>Relato:</strong> {item.applicationNarrative}</p>
      <p><strong>Estratégias:</strong> {item.strategies || '—'}</p>
      <p><strong>Resultados:</strong> {item.observedResults || '—'}</p>
    </article>)}
  </section>;
}
