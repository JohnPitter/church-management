// Presentation Page - Prayer Request
// Formulário para enviar pedidos de oração (layout padrão do painel)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { useAuth } from '../contexts/AuthContext';
import { PageShell } from '../components/common/PageShell';

interface PrayerRequestForm {
  name: string;
  email: string;
  phone: string;
  category: string;
  request: string;
  isPublic: boolean;
}

const initialForm: PrayerRequestForm = {
  name: '',
  email: '',
  phone: '',
  category: 'health',
  request: '',
  isPublic: false
};

const categories = [
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'family', label: 'Família', icon: '👨‍👩‍👧‍👦' },
  { value: 'work', label: 'Trabalho/Finanças', icon: '💼' },
  { value: 'spiritual', label: 'Vida Espiritual', icon: '✝️' },
  { value: 'relationships', label: 'Relacionamentos', icon: '❤️' },
  { value: 'gratitude', label: 'Gratidão', icon: '🙏' },
  { value: 'other', label: 'Outros', icon: '📝' }
];

export const PrayerPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<PrayerRequestForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setForm((prev) => {
      const nextName = prev.name || currentUser.displayName || '';
      const nextEmail = prev.email || currentUser.email || '';
      if (nextName === prev.name && nextEmail === prev.email) {
        return prev;
      }
      return { ...prev, name: nextName, email: nextEmail };
    });
  }, [currentUser?.id, currentUser?.displayName, currentUser?.email]);

  const handleChange = (field: keyof PrayerRequestForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.request.trim()) {
      setError('Por favor, preencha seu nome e o pedido de oração.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'prayerRequests'), {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        category: form.category,
        request: form.request.trim(),
        isPublic: form.isPublic,
        isAnonymous: false,
        isUrgent: false,
        status: 'pending',
        prayedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'public-form'
      });

      await loggingService.logUserAction(
        'Prayer request submitted',
        'Public prayer request created',
        currentUser as any
      );

      setSubmitted(true);
      setForm({
        ...initialForm,
        name: currentUser?.displayName || '',
        email: currentUser?.email || ''
      });
    } catch (err) {
      console.error('Error submitting prayer request:', err);
      setError('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageShell
        title="Pedido de Oração"
        subtitle="Compartilhe seu pedido conosco. Cremos no poder da oração!"
      >
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pedido enviado!</h2>
          <p className="text-sm text-gray-600 mb-6">
            Recebemos seu pedido de oração. Nossa equipe estará orando por você.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="inline-flex justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Enviar outro pedido
            </button>
            <Link
              to="/prayer-requests"
              className="inline-flex justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Ver pedidos da comunidade
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pedido de Oração"
      subtitle="Compartilhe seu pedido conosco. Cremos no poder da oração!"
      actions={
        <Link
          to="/prayer-requests"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Ver comunidade
        </Link>
      }
    >
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Como podemos te chamar?"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (opcional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleChange('category', cat.value)}
                  className={`p-3 rounded-md border text-center transition-colors ${
                    form.category === cat.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  <div className="text-xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu pedido de oração *
            </label>
            <textarea
              value={form.request}
              onChange={(e) => handleChange('request', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Compartilhe seu pedido aqui..."
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={form.isPublic}
              onChange={(e) => handleChange('isPublic', e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-600">
              Permitir que meu pedido seja compartilhado com a comunidade (sem identificação)
              para oração coletiva
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar pedido de oração'}
            </button>
            <Link
              to="/prayer-requests"
              className="inline-flex justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>

          <p className="text-xs text-gray-500 border-t border-gray-100 pt-4">
            &ldquo;Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com
            ação de graças, apresentem seus pedidos a Deus.&rdquo; — Filipenses 4:6
          </p>
        </form>
      </div>
    </PageShell>
  );
};

export default PrayerPage;
