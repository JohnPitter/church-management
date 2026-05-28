import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from 'config/firebase';
import { VisitorStatus, FollowUpStatus } from '@modules/church-management/visitors/domain/entities/Visitor';
import toast, { Toaster } from 'react-hot-toast';
import { applyPhoneMask } from '../../utils/inputMasks';

interface SelfRegistrationForm {
  nome: string;
  whatsapp: string;
  jaCristao: '' | 'sim' | 'nao';
  quemTrouxe: string;
  tipoQuemTrouxe: '' | 'amigo' | 'parente' | 'vizinho' | 'redes_sociais' | 'passou_na_frente' | 'outro';
  primeiraVez: '' | 'sim' | 'nao';
  receberComunicacoes: boolean;
}

const INITIAL_FORM: SelfRegistrationForm = {
  nome: '',
  whatsapp: '',
  jaCristao: '',
  quemTrouxe: '',
  tipoQuemTrouxe: '',
  primeiraVez: '',
  receberComunicacoes: false,
};

export const VisitorSelfRegistrationPage: React.FC = () => {
  const { settings, loading } = useSettings();
  const [formData, setFormData] = useState<SelfRegistrationForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const churchName = settings?.churchName || 'Nossa Igreja';
  const primaryColor = settings?.primaryColor || '#3B82F6';

  const handleChange = (field: keyof SelfRegistrationForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    } else {
      const digits = formData.whatsapp.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        newErrors.whatsapp = 'Informe um número de WhatsApp válido';
      }
    }

    if (!formData.jaCristao) {
      newErrors.jaCristao = 'Selecione uma opção';
    }

    if (!formData.primeiraVez) {
      newErrors.primeiraVez = 'Selecione uma opção';
    }

    if (!formData.tipoQuemTrouxe) {
      newErrors.tipoQuemTrouxe = 'Selecione como conheceu a igreja';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTipoQuemTrouxeLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      amigo: 'Amigo(a)',
      parente: 'Parente/Familiar',
      vizinho: 'Vizinho(a)',
      redes_sociais: 'Redes Sociais',
      passou_na_frente: 'Passei na frente',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const howDidYouKnow = formData.tipoQuemTrouxe === 'outro'
        ? formData.quemTrouxe
        : `${getTipoQuemTrouxeLabel(formData.tipoQuemTrouxe)}${formData.quemTrouxe ? ` - ${formData.quemTrouxe}` : ''}`;

      const observations = [
        formData.jaCristao === 'sim' ? 'Já é cristão' : 'Ainda não é cristão',
        formData.primeiraVez === 'sim' ? 'Primeira vez na igreja' : 'Já visitou antes',
        formData.receberComunicacoes ? 'Deseja receber comunicações' : 'Não deseja receber comunicações',
      ].join(' | ');

      const visitorData: Record<string, unknown> = {
        name: formData.nome.trim(),
        phone: formData.whatsapp,
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: Timestamp.fromDate(new Date()),
        totalVisits: 1,
        contactAttempts: [],
        interests: [],
        isMember: false,
        createdBy: 'self-registration',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        howDidYouKnow,
        observations,
        selfRegistration: true,
        jaCristao: formData.jaCristao === 'sim',
        primeiraVez: formData.primeiraVez === 'sim',
        receberComunicacoes: formData.receberComunicacoes,
        tipoQuemTrouxe: formData.tipoQuemTrouxe,
        nomeQuemTrouxe: formData.quemTrouxe,
      };

      await addDoc(collection(db, 'visitors'), visitorData);
      setIsSubmitted(true);
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      console.error('Error submitting visitor registration:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRegistration = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setIsSubmitted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${primaryColor}20` }}>
            <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Bem-vindo(a)!</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Seu cadastro foi realizado com sucesso. Ficamos muito felizes com a sua visita ao(à) <strong>{churchName}</strong>!
          </p>
          <button
            onClick={handleNewRegistration}
            className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
            style={{ backgroundColor: primaryColor }}
          >
            Novo Cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="text-white py-8 sm:py-12 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{churchName}</h1>
          <p className="text-sm sm:text-base opacity-90">Cadastro de Visitantes</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 -mt-4 sm:-mt-6 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 space-y-5">
          <p className="text-sm text-gray-600 text-center">
            Preencha seus dados para nos conhecermos melhor. Ficamos felizes com sua visita!
          </p>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Seu nome completo"
              maxLength={100}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => handleChange('whatsapp', applyPhoneMask(e.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                errors.whatsapp ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
          </div>

          {/* Já é cristão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Você já é cristão? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('jaCristao', 'sim')}
                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.jaCristao === 'sim'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => handleChange('jaCristao', 'nao')}
                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.jaCristao === 'nao'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Não
              </button>
            </div>
            {errors.jaCristao && <p className="text-red-500 text-xs mt-1">{errors.jaCristao}</p>}
          </div>

          {/* Como conheceu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Como conheceu a igreja? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'amigo', label: 'Amigo(a)' },
                { value: 'parente', label: 'Familiar' },
                { value: 'vizinho', label: 'Vizinho(a)' },
                { value: 'redes_sociais', label: 'Redes Sociais' },
                { value: 'passou_na_frente', label: 'Passei na frente' },
                { value: 'outro', label: 'Outro' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('tipoQuemTrouxe', option.value)}
                  className={`py-2.5 px-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                    formData.tipoQuemTrouxe === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.tipoQuemTrouxe && <p className="text-red-500 text-xs mt-1">{errors.tipoQuemTrouxe}</p>}
          </div>

          {/* Nome de quem trouxe (condicional) */}
          {(formData.tipoQuemTrouxe === 'amigo' || formData.tipoQuemTrouxe === 'parente' || formData.tipoQuemTrouxe === 'vizinho' || formData.tipoQuemTrouxe === 'outro') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {formData.tipoQuemTrouxe === 'outro' ? 'Conte-nos como conheceu' : 'Nome de quem te trouxe'}
              </label>
              <input
                type="text"
                value={formData.quemTrouxe}
                onChange={(e) => handleChange('quemTrouxe', e.target.value)}
                placeholder={formData.tipoQuemTrouxe === 'outro' ? 'Como conheceu a igreja...' : 'Nome da pessoa'}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          )}

          {/* Primeira vez */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              É a sua primeira vez aqui? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('primeiraVez', 'sim')}
                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.primeiraVez === 'sim'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Sim, primeira vez
              </button>
              <button
                type="button"
                onClick={() => handleChange('primeiraVez', 'nao')}
                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.primeiraVez === 'nao'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Já visitei antes
              </button>
            </div>
            {errors.primeiraVez && <p className="text-red-500 text-xs mt-1">{errors.primeiraVez}</p>}
          </div>

          {/* Receber comunicações */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="receberComunicacoes"
              checked={formData.receberComunicacoes}
              onChange={(e) => handleChange('receberComunicacoes', e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 flex-shrink-0"
            />
            <label htmlFor="receberComunicacoes" className="text-sm text-gray-700 cursor-pointer">
              Desejo receber comunicações e novidades da igreja por WhatsApp
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-base"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? 'Enviando...' : 'Cadastrar'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Seus dados serão utilizados apenas para comunicação interna da igreja.
          </p>
        </form>
      </div>
    </div>
  );
};

export default VisitorSelfRegistrationPage;
