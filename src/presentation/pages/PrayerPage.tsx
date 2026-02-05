// Presentation Page - Prayer Request
// Public page for submitting prayer requests

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface PrayerRequest {
  name: string;
  email: string;
  phone: string;
  category: string;
  request: string;
  isPublic: boolean;
}

const initialForm: PrayerRequest = {
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
  const { settings } = useSettings();
  const _churchName = settings?.churchName || 'Nossa Igreja';
  const [form, setForm] = useState<PrayerRequest>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof PrayerRequest, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
        ...form,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'public-form'
      });
      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      console.error('Error submitting prayer request:', err);
      setError('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🙏</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pedido Enviado!
          </h2>
          <p className="text-gray-600 mb-8">
            Recebemos seu pedido de oração. Nossa equipe estará orando por você.
            Que Deus abençoe sua vida!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Enviar Outro Pedido
            </button>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="relative container mx-auto px-6 py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🙏</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Pedido de Oração
            </h1>
            <p className="text-lg md:text-xl text-purple-100 font-light leading-relaxed max-w-2xl mx-auto">
              Compartilhe seu pedido conosco. Cremos no poder da oração!
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="white"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="white"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="white"></path>
          </svg>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Como podemos te chamar?"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone (opcional)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Categoria
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleChange('category', cat.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        form.category === cat.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Request */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Pedido de Oração *
                </label>
                <textarea
                  value={form.request}
                  onChange={(e) => handleChange('request', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Compartilhe seu pedido aqui. Seja específico para que possamos orar de forma mais direcionada..."
                />
              </div>

              {/* Public checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={form.isPublic}
                  onChange={(e) => handleChange('isPublic', e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-600">
                  Permitir que meu pedido seja compartilhado com a comunidade da igreja
                  (sem identificação) para oração coletiva
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Enviar Pedido de Oração'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Bible Verse */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-xl md:text-2xl font-light italic leading-relaxed mb-6">
              "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas,
              e com ação de graças, apresentem seus pedidos a Deus."
            </blockquote>
            <p className="text-purple-200 font-medium">Filipenses 4:6</p>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 text-center">
          <Link
            to="/"
            className="inline-block bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all"
          >
            Voltar ao Início
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PrayerPage;
