import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';
import { FirebaseONGRepository } from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository';
import { ONGInfo, ONGEntity } from '@modules/ong-management/settings/domain/entities/ONG';

const ONGSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Check if user has ONG management permissions
  const canManageONG = hasPermission(SystemModule.ONG, PermissionAction.Manage);
  const hasAccess = canManageONG && currentUser?.status === 'approved';
  
  const [formData, setFormData] = useState<Partial<ONGInfo>>({
    nome: '',
    descricao: '',
    missao: '',
    visao: '',
    valores: [],
    cnpj: '',
    registroONG: '',
    areasAtuacao: [],
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      pais: 'Brasil'
    },
    contato: {
      telefone: '',
      telefone2: '',
      email: '',
      emailContato: '',
      website: ''
    },
    redesSociais: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      whatsapp: ''
    }
  });

  const [newValue, setNewValue] = useState('');
  const [newArea, setNewArea] = useState('');

  const ongRepository = new FirebaseONGRepository();

  useEffect(() => {
    loadONGInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadONGInfo = async () => {
    setLoading(true);
    try {
      const info = await ongRepository.getONGInfo();
      if (info) {
        setFormData(info);
        if (info.logo) {
          setLogoPreview(info.logo);
        }
      }
    } catch (error) {
      console.error('Error loading ONG info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar informações da ONG';
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof ONGInfo];
        const updatedParent = typeof parentValue === 'object' && parentValue !== null
          ? { ...parentValue, [child]: value }
          : { [child]: value };
        
        return {
          ...prev,
          [parent]: updatedParent
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ A imagem deve ter no máximo 5MB');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddValue = () => {
    if (newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        valores: [...(prev.valores || []), newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      valores: prev.valores?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      setFormData(prev => ({
        ...prev,
        areasAtuacao: [...(prev.areasAtuacao || []), newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const handleRemoveArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areasAtuacao: prev.areasAtuacao?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome?.trim()) {
      alert('❌ Nome da ONG é obrigatório');
      return false;
    }
    
    if (!formData.contato?.email?.trim()) {
      alert('❌ Email de contato é obrigatório');
      return false;
    }
    
    if (!formData.contato?.telefone?.trim()) {
      alert('❌ Telefone de contato é obrigatório');
      return false;
    }
    
    if (formData.cnpj && !ONGEntity.validarCNPJ(formData.cnpj)) {
      alert('❌ CNPJ inválido');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      let logoUrl = formData.logo;
      
      // Upload logo if changed
      if (logoFile) {
        logoUrl = await ongRepository.uploadONGLogo(logoFile);
      }
      
      const updatedData = {
        ...formData,
        logo: logoUrl,
        updatedBy: currentUser?.email || 'admin'
      };
      
      await ongRepository.updateONGInfo(updatedData);
      alert('✅ Informações da ONG atualizadas com sucesso!');
    } catch (error) {
      console.error('Error saving ONG info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar informações da ONG';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: '🏢' },
    { id: 'contact', label: 'Contato', icon: '📞' },
    { id: 'address', label: 'Endereço', icon: '📍' },
    { id: 'social', label: 'Redes Sociais', icon: '🌐' },
    { id: 'mission', label: 'Missão e Valores', icon: '🎯' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-4">
            Você precisa ser um administrador aprovado para acessar as configurações da ONG.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Informações de Debug:</h3>
            <p className="text-sm text-yellow-700">
              <strong>Usuário:</strong> {currentUser?.displayName || 'N/A'}<br/>
              <strong>Role:</strong> {currentUser?.role || 'N/A'}<br/>
              <strong>Status:</strong> {currentUser?.status || 'N/A'}<br/>
              <strong>Pode Gerenciar ONG:</strong> {canManageONG ? 'Sim' : 'Não'}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">⚙️ Configurações da ONG</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie as informações da sua organização
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tab 0: Basic Info */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo da ONG
                  </label>
                  <div className="flex items-center space-x-6">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-32 w-32 object-contain border border-gray-300 rounded-lg"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG ou GIF (max. 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da ONG *
                    </label>
                    <input
                      type="text"
                      value={formData.nome || ''}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da organização"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj || ''}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao || ''}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Breve descrição da ONG..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registro da ONG
                  </label>
                  <input
                    type="text"
                    value={formData.registroONG || ''}
                    onChange={(e) => handleInputChange('registroONG', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de registro oficial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Áreas de Atuação
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Digite uma área de atuação"
                    />
                    <button
                      onClick={handleAddArea}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.areasAtuacao?.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {area}
                        <button
                          onClick={() => handleRemoveArea(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Contact */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Principal *
                    </label>
                    <input
                      type="email"
                      value={formData.contato?.email || ''}
                      onChange={(e) => handleInputChange('contato.email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="contato@ong.org.br"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Secundário
                    </label>
                    <input
                      type="email"
                      value={formData.contato?.emailContato || ''}
                      onChange={(e) => handleInputChange('contato.emailContato', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="secretaria@ong.org.br"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone Principal *
                    </label>
                    <input
                      type="tel"
                      value={formData.contato?.telefone || ''}
                      onChange={(e) => handleInputChange('contato.telefone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone Secundário
                    </label>
                    <input
                      type="tel"
                      value={formData.contato?.telefone2 || ''}
                      onChange={(e) => handleInputChange('contato.telefone2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 3333-3333"
                      maxLength={15}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.contato?.website || ''}
                      onChange={(e) => handleInputChange('contato.website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.ong.org.br"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Address */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.cep || ''}
                      onChange={(e) => handleInputChange('endereco.cep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.logradouro || ''}
                      onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.numero || ''}
                      onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.complemento || ''}
                      onChange={(e) => handleInputChange('endereco.complemento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Sala, Andar, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.bairro || ''}
                      onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.cidade || ''}
                      onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.endereco?.estado || ''}
                      onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.pais || 'Brasil'}
                      onChange={(e) => handleInputChange('endereco.pais', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Social Media */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📘 Facebook
                    </label>
                    <input
                      type="url"
                      value={formData.redesSociais?.facebook || ''}
                      onChange={(e) => handleInputChange('redesSociais.facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://facebook.com/suaong"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📷 Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.redesSociais?.instagram || ''}
                      onChange={(e) => handleInputChange('redesSociais.instagram', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://instagram.com/suaong"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐦 Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.redesSociais?.twitter || ''}
                      onChange={(e) => handleInputChange('redesSociais.twitter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://twitter.com/suaong"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💼 LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.redesSociais?.linkedin || ''}
                      onChange={(e) => handleInputChange('redesSociais.linkedin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/company/suaong"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📺 YouTube
                    </label>
                    <input
                      type="url"
                      value={formData.redesSociais?.youtube || ''}
                      onChange={(e) => handleInputChange('redesSociais.youtube', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/suaong"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💬 WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.redesSociais?.whatsapp || ''}
                      onChange={(e) => handleInputChange('redesSociais.whatsapp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Mission and Values */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Missão
                  </label>
                  <textarea
                    value={formData.missao || ''}
                    onChange={(e) => handleInputChange('missao', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva a missão da ONG..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👁️ Visão
                  </label>
                  <textarea
                    value={formData.visao || ''}
                    onChange={(e) => handleInputChange('visao', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva a visão da ONG..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💎 Valores
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Digite um valor"
                    />
                    <button
                      onClick={handleAddValue}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.valores?.map((valor, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-700">{valor}</span>
                        <button
                          onClick={() => handleRemoveValue(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ONGSettingsPage;