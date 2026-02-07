// Presentation Page - Contact
// Public page for contacting the church

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { useAuth } from '../contexts/AuthContext';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialForm: ContactForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
};

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();
  const { currentUser } = useAuth();
  const _churchName = settings?.churchName || 'Nossa Igreja';
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...form,
        status: 'unread',
        createdAt: serverTimestamp()
      });

      // Log successful contact message
      await loggingService.logUserAction('Contact message sent', `From: "${form.name}"`, currentUser as any);

      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">✉️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Mensagem Enviada!
          </h2>
          <p className="text-gray-600 mb-8">
            Recebemos sua mensagem e responderemos em breve.
            Obrigado pelo contato!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Enviar Outra Mensagem
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
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="relative container mx-auto px-6 py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">💬</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Fale Conosco
            </h1>
            <p className="text-lg md:text-xl text-blue-100 font-light leading-relaxed max-w-2xl mx-auto">
              Estamos aqui para você. Entre em contato conosco!
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

      {/* Content Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informações
                </h2>

                {settings?.churchAddress && (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📍</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Endereço</h3>
                      <p className="text-gray-600 whitespace-pre-line">{settings.churchAddress}</p>
                    </div>
                  </div>
                )}

                {settings?.churchPhone && (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📞</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Telefone</h3>
                      <p className="text-gray-600">{settings.churchPhone}</p>
                    </div>
                  </div>
                )}

                {settings?.churchEmail && (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">✉️</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">E-mail</h3>
                      <a
                        href={`mailto:${settings.churchEmail}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {settings.churchEmail}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.churchWebsite && (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">🌐</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Website</h3>
                      <a
                        href={settings.churchWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {settings.churchWebsite.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.whatsappNumber && (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">💬</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                      <a
                        href={`https://wa.me/${settings.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-medium hover:bg-green-700 transition-colors text-sm"
                      >
                        <span>Conversar no WhatsApp</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* If no contact info is configured */}
                {!settings?.churchAddress && !settings?.churchPhone && !settings?.churchEmail && !settings?.whatsappNumber && (
                  <p className="text-gray-500 italic">
                    As informações de contato serão exibidas aqui quando configuradas.
                  </p>
                )}
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Envie sua Mensagem
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assunto
                        </label>
                        <input
                          type="text"
                          value={form.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Sobre o que deseja falar?"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Escreva sua mensagem aqui..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Mensagem'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <Link
            to="/"
            className="inline-block bg-white text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-md"
          >
            Voltar ao Início
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
