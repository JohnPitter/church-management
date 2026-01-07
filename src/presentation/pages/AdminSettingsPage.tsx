// Presentation Page - Admin Settings
// System configuration and general settings

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

interface SystemSettings {
  churchName: string;
  churchTagline: string;
  churchAddress: string;
  churchPhone: string;
  churchEmail: string;
  churchWebsite: string;
  logoURL?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  eventReminders: boolean;
  autoApproveMembers: boolean;
  requireEventConfirmation: boolean;
  maxEventParticipants: number;
  allowPublicRegistration: boolean;
  maintenanceMode: boolean;
}

export const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings: contextSettings, updateSettings: updateContextSettings, loading: contextLoading } = useSettings();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings from context when available, with additional local-only settings
  useEffect(() => {
    if (contextSettings) {
      setSettings({
        ...contextSettings,
        // Additional settings not stored in church context - using defaults
        emailNotifications: true,
        smsNotifications: false,
        eventReminders: true,
        autoApproveMembers: false,
        requireEventConfirmation: true,
        maxEventParticipants: 200,
        allowPublicRegistration: true,
        maintenanceMode: false
      });
    }
  }, [contextSettings]);

  const tabs = [
    { id: 'general', label: 'Geral', icon: '⚙️' },
    { id: 'appearance', label: 'Aparência', icon: '🎨' },
    { id: 'notifications', label: 'Notificações', icon: '🔔' },
    { id: 'events', label: 'Eventos', icon: '📅' },
    { id: 'security', label: 'Segurança', icon: '🔒' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (UTC-3)' },
    { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' }
  ];

  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' }
  ];

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Update context settings (which saves to Firebase)
      await updateContextSettings({
        churchName: settings.churchName,
        churchTagline: settings.churchTagline,
        churchAddress: settings.churchAddress,
        churchPhone: settings.churchPhone,
        churchEmail: settings.churchEmail,
        churchWebsite: settings.churchWebsite,
        logoURL: settings.logoURL,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        timezone: settings.timezone,
        language: settings.language
      });
      
      await loggingService.logSystem('info', 'System settings updated', 
        `Updated by: ${currentUser?.email}, Church: ${settings.churchName}`, currentUser);
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      await loggingService.logSystem('error', 'Failed to update system settings', 
        `Error: ${error}, User: ${currentUser?.email}`, currentUser);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `church/church-logo-${timestamp}.${file.name.split('.').pop()}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update settings with new logo URL
      handleChange('logoURL', downloadURL);
      
      // Save to Firebase
      await updateContextSettings({
        ...settings,
        logoURL: downloadURL
      });

      await loggingService.logSystem('info', 'Church logo updated', 
        `New logo uploaded by: ${currentUser?.email}, Size: ${(file.size / 1024).toFixed(2)}KB`, currentUser);

      alert('Logo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      await loggingService.logSystem('error', 'Failed to upload church logo', 
        `Error: ${error}, User: ${currentUser?.email}`, currentUser);
      if (error.code === 'storage/unauthorized') {
        alert('Erro de permissão. Verifique se você tem permissão de administrador.');
      } else if (error.code === 'storage/canceled') {
        alert('Upload cancelado.');
      } else {
        alert('Erro ao fazer upload do logo: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings || !window.confirm('Tem certeza que deseja remover o logo?')) return;

    setSaving(true);
    try {
      handleChange('logoURL', undefined);
      
      await updateContextSettings({
        ...settings,
        logoURL: undefined
      });

      alert('Logo removido com sucesso!');
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Erro ao remover logo.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      if (contextSettings) {
        setSettings({
          ...contextSettings,
          // Reset additional local-only settings to defaults
          emailNotifications: true,
          smsNotifications: false,
          eventReminders: true,
          autoApproveMembers: false,
          requireEventConfirmation: true,
          maxEventParticipants: 200,
          allowPublicRegistration: true,
          maintenanceMode: false
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure as preferências gerais do sistema
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                disabled={saving || contextLoading || !settings}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Restaurar Padrões
              </button>
              <button
                onClick={handleSave}
                disabled={saving || contextLoading || !settings}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="mt-5 lg:mt-0 lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
              </div>

              <div className="p-6">
                {contextLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Carregando configurações...</span>
                  </div>
                ) : !settings ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Erro ao carregar configurações.</p>
                  </div>
                ) : (
                  <>
                    {/* General Tab */}
                    {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Igreja
                      </label>
                      <input
                        type="text"
                        value={settings?.churchName || ''}
                        onChange={(e) => handleChange('churchName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slogan/Frase da Igreja
                      </label>
                      <input
                        type="text"
                        value={settings?.churchTagline || ''}
                        onChange={(e) => handleChange('churchTagline', e.target.value)}
                        placeholder="Ex: Conectados pela fé"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Esta frase aparecerá no menu da aplicação
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      <textarea
                        value={settings?.churchAddress || ''}
                        onChange={(e) => handleChange('churchAddress', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={settings?.churchPhone || ''}
                          onChange={(e) => handleChange('churchPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={settings?.churchEmail || ''}
                          onChange={(e) => handleChange('churchEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={settings?.churchWebsite || ''}
                        onChange={(e) => handleChange('churchWebsite', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fuso Horário
                        </label>
                        <select
                          value={settings?.timezone || 'America/Sao_Paulo'}
                          onChange={(e) => handleChange('timezone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Idioma
                        </label>
                        <select
                          value={settings?.language || 'pt-BR'}
                          onChange={(e) => handleChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {languages.map(lang => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Igreja
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center relative">
                          {uploadingLogo && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                          {settings?.logoURL ? (
                            <img src={settings.logoURL} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                          ) : (
                            <span className="text-gray-400 text-sm">Logo</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo || saving}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                          </button>
                          {settings?.logoURL && (
                            <button
                              onClick={handleRemoveLogo}
                              disabled={uploadingLogo || saving}
                              className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Primária
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings?.primaryColor || '#3B82F6'}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="h-10 w-20 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            value={settings?.primaryColor || '#3B82F6'}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Secundária
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings?.secondaryColor || '#8B5CF6'}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="h-10 w-20 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            value={settings?.secondaryColor || '#8B5CF6'}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Notificações por E-mail</h4>
                          <p className="text-sm text-gray-500">Enviar notificações do sistema por e-mail</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.emailNotifications || false}
                          onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Notificações por SMS</h4>
                          <p className="text-sm text-gray-500">Enviar notificações importantes por SMS</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.smsNotifications || false}
                          onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Lembretes de Eventos</h4>
                          <p className="text-sm text-gray-500">Enviar lembretes automáticos de eventos</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.eventReminders || false}
                          onChange={(e) => handleChange('eventReminders', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Exigir Confirmação de Presença</h4>
                        <p className="text-sm text-gray-500">Todos os eventos requerem confirmação por padrão</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.requireEventConfirmation || false}
                        onChange={(e) => handleChange('requireEventConfirmation', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Participantes por Evento (Padrão)
                      </label>
                      <input
                        type="number"
                        value={settings?.maxEventParticipants || 200}
                        onChange={(e) => handleChange('maxEventParticipants', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Aprovar Membros Automaticamente</h4>
                        <p className="text-sm text-gray-500">Novos membros são aprovados sem revisão manual</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.autoApproveMembers || false}
                        onChange={(e) => handleChange('autoApproveMembers', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Permitir Registro Público</h4>
                        <p className="text-sm text-gray-500">Qualquer pessoa pode se registrar no sistema</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.allowPublicRegistration || false}
                        onChange={(e) => handleChange('allowPublicRegistration', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Modo de Manutenção</h4>
                        <p className="text-sm text-gray-500">Sistema indisponível para usuários não-admin</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.maintenanceMode || false}
                        onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </div>

                    {settings?.maintenanceMode && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <span className="text-xl text-red-400">⚠️</span>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Modo de Manutenção Ativo
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                O sistema está em modo de manutenção. Apenas administradores podem acessar.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};