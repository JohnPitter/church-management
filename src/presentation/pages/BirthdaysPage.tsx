// Presentation Page - Aniversariantes do mês (paridade com app mobile)
import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import PageShell from '../components/common/PageShell';

interface BirthdayEntry {
  id: string;
  name: string;
  day: number;
  month: number;
  photoURL?: string;
  phone?: string;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const BirthdaysPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BirthdayEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDocs(collection(db, 'members'));
        const list: BirthdayEntry[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const status = (data.status || '').toString().toLowerCase();
          if (status === 'inactive' || status === 'transferred') return;
          const name = (data.name || data.fullName || '').toString().trim();
          if (!name) return;
          const birth = toDate(data.birthDate) || toDate(data.dataNascimento);
          if (!birth) return;
          // Datas gravadas de forma inconsistente: usar UTC como no mobile
          const m = birth.getUTCMonth() + 1;
          const d = birth.getUTCDate();
          if (m !== month) return;
          list.push({
            id: docSnap.id,
            name,
            day: d,
            month: m,
            photoURL: data.photoURL || data.photoUrl,
            phone: data.phone || data.telefone,
          });
        });
        list.sort((a, b) => a.day - b.day || a.name.localeCompare(b.name, 'pt-BR'));
        if (!cancelled) setItems(list);
      } catch (e) {
        console.error('Error loading birthdays:', e);
        if (!cancelled) setError('Não foi possível carregar os aniversariantes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const todayDay = today.getDate();
  const isCurrentMonth = month === today.getMonth() + 1;

  return (
    <PageShell
      title="Aniversariantes"
      subtitle={`Celebre com a família da igreja — ${MONTHS_PT[month - 1]}`}
      actions={
        <select
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          aria-label="Mês"
        >
          {MONTHS_PT.map((label, idx) => (
            <option key={label} value={idx + 1}>
              {label}
            </option>
          ))}
        </select>
      }
    >
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-gray-900">Nenhum aniversariante este mês</p>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre a data de nascimento nos membros para aparecer aqui.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => {
            const isToday = isCurrentMonth && b.day === todayDay;
            return (
              <li
                key={b.id}
                className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm ${
                  isToday ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'
                }`}
              >
                {b.photoURL ? (
                  <img
                    src={b.photoURL}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {b.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{b.name}</p>
                  <p className="text-sm text-gray-600">
                    Dia {b.day}
                    {isToday && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Hoje
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
};

export default BirthdaysPage;
