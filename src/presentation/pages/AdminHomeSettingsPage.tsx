// Presentation Page - Admin Home Settings (Simplified)
// Simple interface to choose layout style and configure sections

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { HomeSettingsService } from '@modules/content-management/home-settings/application/services/HomeSettingsService';
import {
  HomeSettings,
  HomeLayoutStyle,
  HomeSectionVisibility,
  LAYOUT_STYLE_INFO,
  SECTION_INFO
} from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

export const AdminHomeSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings: _churchSettings } = useSettings();
  const { confirm } = useConfirmDialog();
  const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<HomeLayoutStyle>(HomeLayoutStyle.CANVA);
  const [sectionVisibility, setSectionVisibility] = useState<HomeSectionVisibility>({
    hero: true,
    verseOfDay: true,
    quickActions: true,
    welcomeBanner: true,
    features: true,
    events: true,
    statistics: false,
    contact: false,
    testimonials: false,
    socialMedia: true
  });

  const homeSettingsService = new HomeSettingsService();

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await homeSettingsService.getSettings();
      setHomeSettings(settings);
      setSelectedStyle(settings.layoutStyle);
      setSectionVisibility(settings.sections);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser?.email) return;

    try {
      setSaving(true);
      await homeSettingsService.updateSettings(
        {
          layoutStyle: selectedStyle,
          sections: sectionVisibility
        },
        currentUser.email
      );
      toast.success('Configurações salvas com sucesso!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = (section: keyof HomeSectionVisibility) => {
    // Don't allow disabling required sections
    if (SECTION_INFO[section].required && sectionVisibility[section]) {
      toast.error(`A seção "${SECTION_INFO[section].name}" é obrigatória e não pode ser desativada.`);
      return;
    }

    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Configurações da Home Page
          </h1>
          <p className="text-lg text-gray-600">
            Escolha o estilo visual e configure quais seções aparecem na página inicial
          </p>
        </div>

        {/* Layout Style Selection */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              1️⃣ Escolha o Estilo Visual
            </h2>
            <p className="text-gray-600">
              Selecione o design que melhor representa sua igreja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(LAYOUT_STYLE_INFO).map(([key, info]) => {
              const style = key as HomeLayoutStyle;
              const isSelected = selectedStyle === style;

              return (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }
                  `}
                >
                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-6xl mb-4">{info.icon}</div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {info.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">
                    {info.description}
                  </p>

                  {/* Characteristics */}
                  <ul className="space-y-1 text-left">
                    {info.characteristics.map((char, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Color palette */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Paleta de cores:</p>
                    <div className="flex gap-2">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: info.colors.primary,
                          borderRadius: '6px',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                        title="Cor primária"
                      />
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: info.colors.secondary,
                          borderRadius: '6px',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                        title="Cor secundária"
                      />
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: info.colors.accent,
                          borderRadius: '6px',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                        title="Cor de destaque"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Visibility Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              2️⃣ Configure as Seções Visíveis
            </h2>
            <p className="text-gray-600">
              Ative ou desative as seções que aparecem na home page
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(SECTION_INFO).map(([key, info]) => {
              const section = key as keyof HomeSectionVisibility;
              const isEnabled = sectionVisibility[section];
              const isRequired = info.required;

              return (
                <div
                  key={section}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isEnabled
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                    }
                    ${isRequired ? 'opacity-75' : 'cursor-pointer'}
                  `}
                  onClick={() => !isRequired && handleToggleSection(section)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {info.name}
                        </h3>
                        {isRequired && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            Obrigatória
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {info.description}
                      </p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRequired) handleToggleSection(section);
                      }}
                      disabled={isRequired}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${isEnabled ? 'bg-green-600' : 'bg-gray-300'}
                        ${isRequired ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Dica:</strong> Seções marcadas como "Obrigatória" são essenciais para a experiência
                  do usuário e não podem ser desativadas. Você pode personalizar o conteúdo delas após salvar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">👁️</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Preview da Configuração Atual</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Estilo Selecionado:</p>
                  <p className="text-lg font-semibold">
                    {LAYOUT_STYLE_INFO[selectedStyle].icon} {LAYOUT_STYLE_INFO[selectedStyle].name}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-90 mb-1">Seções Ativas:</p>
                  <p className="text-lg font-semibold">
                    {Object.values(sectionVisibility).filter(Boolean).length} de {Object.keys(sectionVisibility).length}
                  </p>
                </div>
              </div>
              <p className="text-sm opacity-90">
                Após salvar, visite a home page para ver as mudanças aplicadas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 transition-colors font-medium border border-gray-300"
          >
            ← Voltar para Home
          </button>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                const confirmed = await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja restaurar as configurações padrão?', variant: 'warning' });
                if (confirmed) {
                  homeSettingsService.resetToDefaults(currentUser?.email || 'unknown')
                    .then(() => {
                      toast.success('Configurações restauradas!');
                      loadSettings();
                    })
                    .catch(() => toast.error('Erro ao restaurar configurações'));
                }
              }}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              🔄 Restaurar Padrões
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`
                px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg
                ${saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                }
                text-white
              `}
            >
              {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
            </button>
          </div>
        </div>

        {/* Last updated info */}
        {homeSettings && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Última atualização: {homeSettings.updatedAt.toLocaleString('pt-BR')}
            {homeSettings.updatedBy && ` por ${homeSettings.updatedBy}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomeSettingsPage;
