import React from 'react';
import { DIFFICULTY_LABELS, StudentDifficultyRecord } from '@modules/pedagogy/domain/entities/Pedagogy';

export default function LegacyEvaluationObservations({ records }: { records: StudentDifficultyRecord[] }) {
  if (!records.length) return null;
  return <details className="rounded-lg border border-gray-200 p-4">
    <summary className="cursor-pointer font-medium">Registros anteriores de acompanhamento ({records.length})</summary>
    <p className="my-3 text-sm text-gray-600">Os registros anteriores permanecem disponíveis. Como não contêm as nove respostas da avaliação, não participam dos índices de desenvolvimento.</p>
    <div className="space-y-3">{records.map(item => <article key={item.id} className="border-t pt-3 text-sm">
      <h4 className="font-semibold">{item.studentName} · {item.classGroup || 'Turma não informada'}</h4>
      <p className="text-gray-500">{item.educatorName} · {item.createdAt.toLocaleDateString('pt-BR')}</p>
      <p>{item.difficulties.map(type => DIFFICULTY_LABELS[type]).join(', ')}{item.otherDifficulty ? ` (${item.otherDifficulty})` : ''}</p>
      <p className="whitespace-pre-wrap">{item.description}</p>
    </article>)}</div>
  </details>;
}
