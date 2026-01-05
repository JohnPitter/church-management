import React, { useState, useEffect } from 'react';
import { AssistidoService } from '../../infrastructure/services/AssistidoService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Assistido, 
  AssistidoEntity,
  StatusAssistido, 
  SituacaoFamiliar,
  Escolaridade,
  NecessidadeAssistido,
  EnderecoAssistido,
  FamiliarAssistido,
  TipoParentesco,
  AtendimentoAssistido,
  TipoAtendimento,
  TipoMoradia
} from '../../modules/assistance/assistidos/domain/entities/Assistido';

interface AssistidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  assistido?: Assistido | null;
  mode: 'create' | 'edit' | 'view';
}

const AssistidoModal: React.FC<AssistidoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assistido,
  mode
}) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const assistidoService = new AssistidoService();
  
  const [activeTab, setActiveTab] = useState<'dados' | 'familia' | 'atendimentos'>('dados');

  const getTipoAtendimentoLabel = (tipo: TipoAtendimento): string => {
    const labels = {
      [TipoAtendimento.CestaBasica]: 'Cesta Básica',
      [TipoAtendimento.Donativos]: 'Donativos',
      [TipoAtendimento.Medicamento]: 'Medicamento',
      [TipoAtendimento.Vestuario]: 'Vestuário',
      [TipoAtendimento.Orientacao]: 'Orientação',
      [TipoAtendimento.EncaminhamentoMedico]: 'Encaminhamento Médico',
      [TipoAtendimento.EncaminhamentoJuridico]: 'Encaminhamento Jurídico',
      [TipoAtendimento.AconselhamentoEspiritual]: 'Aconselhamento Espiritual',
      [TipoAtendimento.AuxilioFinanceiro]: 'Auxílio Financeiro',
      [TipoAtendimento.Documentacao]: 'Documentação',
      [TipoAtendimento.Outro]: 'Outro'
    };
    return labels[tipo] || tipo;
  };

  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    } as EnderecoAssistido,
    situacaoFamiliar: SituacaoFamiliar.Solteiro,
    rendaFamiliar: '',
    profissao: '',
    escolaridade: Escolaridade.FundamentalIncompleto,
    necessidades: [] as NecessidadeAssistido[],
    // Novos campos
    tipoMoradia: TipoMoradia.Alugada,
    quantidadeComodos: '',
    possuiCadUnico: false,
    qualBeneficio: '',
    observacoes: '',
    responsavelAtendimento: currentUser?.email || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [familiares, setFamiliares] = useState<FamiliarAssistido[]>([]);
  const [showAddFamiliar, setShowAddFamiliar] = useState(false);
  const [editingFamiliar, setEditingFamiliar] = useState<FamiliarAssistido | null>(null);
  
  const [familiarForm, setFamiliarForm] = useState({
    nome: '',
    parentesco: TipoParentesco.Outro,
    dataNascimento: '',
    cpf: '',
    telefone: '',
    profissao: '',
    renda: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (assistido && mode !== 'create') {
        setFormData({
          nome: assistido.nome,
          cpf: assistido.cpf || '',
          rg: assistido.rg || '',
          dataNascimento: assistido.dataNascimento.toISOString().split('T')[0],
          telefone: assistido.telefone,
          email: assistido.email || '',
          endereco: assistido.endereco,
          situacaoFamiliar: assistido.situacaoFamiliar,
          rendaFamiliar: assistido.rendaFamiliar?.toString() || '',
          profissao: assistido.profissao || '',
          escolaridade: assistido.escolaridade,
          necessidades: assistido.necessidades,
          // Novos campos
          tipoMoradia: assistido.tipoMoradia || TipoMoradia.Alugada,
          quantidadeComodos: assistido.quantidadeComodos?.toString() || '',
          possuiCadUnico: assistido.possuiCadUnico || false,
          qualBeneficio: assistido.qualBeneficio || '',
          observacoes: assistido.observacoes || '',
          responsavelAtendimento: assistido.responsavelAtendimento
        });
        setFamiliares(assistido.familiares || []);
      } else {
        // Reset form for create mode
        setFormData({
          nome: '',
          cpf: '',
          rg: '',
          dataNascimento: '',
          telefone: '',
          email: '',
          endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          },
          situacaoFamiliar: SituacaoFamiliar.Solteiro,
          rendaFamiliar: '',
          profissao: '',
          escolaridade: Escolaridade.FundamentalIncompleto,
          necessidades: [],
          // Novos campos
          tipoMoradia: TipoMoradia.Alugada,
          quantidadeComodos: '',
          possuiCadUnico: false,
          qualBeneficio: '',
          observacoes: '',
          responsavelAtendimento: currentUser?.email || ''
        });
        setFamiliares([]);
      }
      setErrors({});
      setShowAddFamiliar(false);
      setEditingFamiliar(null);
      resetFamiliarForm();
    }
  }, [isOpen, assistido, mode, currentUser]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('endereco.')) {
      const enderecoField = field.replace('endereco.', '');
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNecessidadeChange = (necessidade: NecessidadeAssistido, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      necessidades: checked 
        ? [...prev.necessidades, necessidade]
        : prev.necessidades.filter(n => n !== necessidade)
    }));
  };

  const resetFamiliarForm = () => {
    setFamiliarForm({
      nome: '',
      parentesco: TipoParentesco.Outro,
      dataNascimento: '',
      cpf: '',
      telefone: '',
      profissao: '',
      renda: ''
    });
  };

  const handleFamiliarInputChange = (field: string, value: any) => {
    setFamiliarForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFamiliar = () => {
    setEditingFamiliar(null);
    resetFamiliarForm();
    setShowAddFamiliar(true);
  };

  const handleEditFamiliar = (familiar: FamiliarAssistido) => {
    setEditingFamiliar(familiar);
    setFamiliarForm({
      nome: familiar.nome,
      parentesco: familiar.parentesco,
      dataNascimento: familiar.dataNascimento ? familiar.dataNascimento.toISOString().split('T')[0] : '',
      cpf: familiar.cpf || '',
      telefone: familiar.telefone || '',
      profissao: familiar.profissao || '',
      renda: familiar.renda?.toString() || ''
    });
    setShowAddFamiliar(true);
  };

  const handleSaveFamiliar = () => {
    if (!familiarForm.nome.trim()) {
      alert('Nome do familiar é obrigatório');
      return;
    }

    if (familiarForm.cpf && !AssistidoEntity.validarCPF(familiarForm.cpf)) {
      alert('CPF do familiar é inválido');
      return;
    }

    if (familiarForm.telefone && !AssistidoEntity.validarTelefone(familiarForm.telefone)) {
      alert('Telefone do familiar é inválido');
      return;
    }

    const newFamiliar: FamiliarAssistido = {
      id: editingFamiliar ? editingFamiliar.id : `temp_${Date.now()}`,
      nome: familiarForm.nome,
      parentesco: familiarForm.parentesco,
      dataNascimento: familiarForm.dataNascimento ? new Date(familiarForm.dataNascimento) : undefined,
      cpf: familiarForm.cpf || undefined,
      telefone: familiarForm.telefone || undefined,
      profissao: familiarForm.profissao || undefined,
      renda: familiarForm.renda ? parseFloat(familiarForm.renda) : undefined
    };

    if (editingFamiliar) {
      setFamiliares(prev => prev.map(f => f.id === editingFamiliar.id ? newFamiliar : f));
    } else {
      setFamiliares(prev => [...prev, newFamiliar]);
    }

    setShowAddFamiliar(false);
    resetFamiliarForm();
    setEditingFamiliar(null);
  };

  const handleRemoveFamiliar = (familiarId: string) => {
    if (window.confirm('Tem certeza que deseja remover este familiar?')) {
      setFamiliares(prev => prev.filter(f => f.id !== familiarId));
    }
  };

  const getParentescoLabel = (parentesco: TipoParentesco) => {
    const labels: Record<TipoParentesco, string> = {
      [TipoParentesco.Pai]: 'Pai',
      [TipoParentesco.Mae]: 'Mãe',
      [TipoParentesco.Filho]: 'Filho',
      [TipoParentesco.Filha]: 'Filha',
      [TipoParentesco.Esposo]: 'Esposo',
      [TipoParentesco.Esposa]: 'Esposa',
      [TipoParentesco.Irmao]: 'Irmão',
      [TipoParentesco.Irma]: 'Irmã',
      [TipoParentesco.Avo]: 'Avô',
      [TipoParentesco.Avoa]: 'Avó',
      [TipoParentesco.Neto]: 'Neto',
      [TipoParentesco.Neta]: 'Neta',
      [TipoParentesco.Tio]: 'Tio',
      [TipoParentesco.Tia]: 'Tia',
      [TipoParentesco.Primo]: 'Primo',
      [TipoParentesco.Prima]: 'Prima',
      [TipoParentesco.Outro]: 'Outro'
    };
    return labels[parentesco];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Usar a validação completa da entidade
    const assistidoData = {
      ...formData,
      dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
      quantidadeComodos: formData.quantidadeComodos ? parseInt(formData.quantidadeComodos) : undefined,
      rendaFamiliar: formData.rendaFamiliar ? parseFloat(formData.rendaFamiliar) : undefined
    };

    const validationErrors = AssistidoEntity.validarAssistido(assistidoData);
    
    // Converter erros para o formato do estado
    validationErrors.forEach((erro, index) => {
      if (erro.includes('Nome')) {
        newErrors.nome = erro;
      } else if (erro.includes('Data de nascimento')) {
        newErrors.dataNascimento = erro;
      } else if (erro.includes('Telefone')) {
        newErrors.telefone = erro;
      } else if (erro.includes('CPF')) {
        newErrors.cpf = erro;
      } else if (erro.includes('Email')) {
        newErrors.email = erro;
      } else if (erro.includes('Logradouro')) {
        newErrors['endereco.logradouro'] = erro;
      } else if (erro.includes('Número')) {
        newErrors['endereco.numero'] = erro;
      } else if (erro.includes('Bairro')) {
        newErrors['endereco.bairro'] = erro;
      } else if (erro.includes('Cidade')) {
        newErrors['endereco.cidade'] = erro;
      } else if (erro.includes('Estado')) {
        newErrors['endereco.estado'] = erro;
      } else if (erro.includes('CEP')) {
        newErrors['endereco.cep'] = erro;
      } else if (erro.includes('Renda familiar')) {
        newErrors.rendaFamiliar = erro;
      } else if (erro.includes('Situação familiar')) {
        newErrors.situacaoFamiliar = erro;
      } else if (erro.includes('Escolaridade')) {
        newErrors.escolaridade = erro;
      } else if (erro.includes('Tipo de moradia')) {
        newErrors.tipoMoradia = erro;
      } else if (erro.includes('Quantidade de cômodos')) {
        newErrors.quantidadeComodos = erro;
      } else if (erro.includes('CadÚnico')) {
        newErrors.possuiCadUnico = erro;
      } else if (erro.includes('necessidade')) {
        newErrors.necessidades = erro;
      } else if (erro.includes('Responsável')) {
        newErrors.responsavelAtendimento = erro;
      } else if (erro.includes('Endereço')) {
        newErrors.endereco = erro;
      } else {
        newErrors[`error_${index}`] = erro;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const assistidoData = {
        ...formData,
        dataNascimento: new Date(formData.dataNascimento),
        rendaFamiliar: formData.rendaFamiliar ? parseFloat(formData.rendaFamiliar) : undefined,
        quantidadeComodos: parseInt(formData.quantidadeComodos),
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: mode === 'create' ? new Date() : assistido!.dataInicioAtendimento,
        dataUltimoAtendimento: assistido?.dataUltimoAtendimento,
        familiares: familiares,
        atendimentos: assistido?.atendimentos || [],
        createdBy: mode === 'create' ? (currentUser?.email || 'unknown') : assistido!.createdBy
      };

      if (mode === 'create') {
        await assistidoService.createAssistido(assistidoData);
        const familiaresInfo = familiares.length > 0 ? `\nFamiliares: ${familiares.length} pessoa${familiares.length > 1 ? 's' : ''} cadastrada${familiares.length > 1 ? 's' : ''}` : '';
        alert(`✅ ${formData.nome} foi cadastrado(a) como assistido(a) com sucesso!\n\nStatus: Ativo\nResponsável: ${formData.responsavelAtendimento}${familiaresInfo}`);
      } else if (mode === 'edit' && assistido) {
        await assistidoService.updateAssistido(assistido.id, assistidoData);
        const familiaresInfo = familiares.length > 0 ? `\nFamiliares: ${familiares.length} pessoa${familiares.length > 1 ? 's' : ''}` : '';
        alert(`✅ Dados de ${formData.nome} foram atualizados com sucesso!${familiaresInfo}`);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving assistido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar assistido: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const modalTitle = mode === 'create' ? 'Cadastrar Assistido' : 
                    mode === 'edit' ? 'Editar Assistido' : 'Visualizar Assistido';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('dados')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'dados'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('familia')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'familia'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Família ({familiares.length})
            </button>
            <button
              onClick={() => setActiveTab('atendimentos')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'atendimentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Atendimentos ({assistido?.atendimentos?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Aba Dados Pessoais */}
          {activeTab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={formData.cpf || ''}
                onChange={(e) => {
                  // Auto-format CPF as user types
                  const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                  handleInputChange('cpf', formatted);
                }}
                disabled={isReadOnly}
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cpf ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
              <input
                type="text"
                value={formData.rg || ''}
                onChange={(e) => handleInputChange('rg', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dataNascimento ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.dataNascimento && <p className="text-red-500 text-sm mt-1">{errors.dataNascimento}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => {
                  // Auto-format phone as user types
                  const numbers = e.target.value.replace(/\D/g, '');
                  let formatted = numbers;
                  if (numbers.length >= 2) {
                    formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
                  }
                  if (numbers.length >= 7) {
                    formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
                  }
                  handleInputChange('telefone', formatted);
                }}
                disabled={isReadOnly}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telefone ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Endereço</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logradouro *
              </label>
              <input
                type="text"
                value={formData.endereco.logradouro}
                onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.logradouro'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.logradouro'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.logradouro']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                value={formData.endereco.numero}
                onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.numero'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.numero'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.numero']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                value={formData.endereco.complemento || ''}
                onChange={(e) => handleInputChange('endereco.complemento', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                value={formData.endereco.bairro}
                onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.bairro'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.bairro'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.bairro']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.endereco.cidade}
                onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.cidade'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.cidade'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.cidade']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <input
                type="text"
                value={formData.endereco.estado}
                onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                disabled={isReadOnly}
                placeholder="Ex: SP"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.estado'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.estado'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.estado']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP *
              </label>
              <input
                type="text"
                value={formData.endereco.cep}
                onChange={(e) => {
                  // Auto-format CEP as user types
                  const numbers = e.target.value.replace(/\D/g, '');
                  const formatted = numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
                  handleInputChange('endereco.cep', formatted);
                }}
                disabled={isReadOnly}
                placeholder="00000-000"
                maxLength={9}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['endereco.cep'] ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors['endereco.cep'] && <p className="text-red-500 text-sm mt-1">{errors['endereco.cep']}</p>}
            </div>

            {/* Informações Socioeconômicas */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Informações Socioeconômicas</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Situação Familiar</label>
              <select
                value={formData.situacaoFamiliar}
                onChange={(e) => handleInputChange('situacaoFamiliar', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              >
                <option value={SituacaoFamiliar.Solteiro}>Solteiro(a)</option>
                <option value={SituacaoFamiliar.Casado}>Casado(a)</option>
                <option value={SituacaoFamiliar.Divorciado}>Divorciado(a)</option>
                <option value={SituacaoFamiliar.Viuvo}>Viúvo(a)</option>
                <option value={SituacaoFamiliar.UniaoEstavel}>União Estável</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escolaridade</label>
              <select
                value={formData.escolaridade}
                onChange={(e) => handleInputChange('escolaridade', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              >
                <option value={Escolaridade.Analfabeto}>Analfabeto</option>
                <option value={Escolaridade.FundamentalIncompleto}>Fundamental Incompleto</option>
                <option value={Escolaridade.FundamentalCompleto}>Fundamental Completo</option>
                <option value={Escolaridade.MedioIncompleto}>Médio Incompleto</option>
                <option value={Escolaridade.MedioCompleto}>Médio Completo</option>
                <option value={Escolaridade.SuperiorIncompleto}>Superior Incompleto</option>
                <option value={Escolaridade.SuperiorCompleto}>Superior Completo</option>
                <option value={Escolaridade.PosGraduacao}>Pós-Graduação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
              <input
                type="text"
                value={formData.profissao || ''}
                onChange={(e) => handleInputChange('profissao', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Renda Familiar</label>
              <input
                type="number"
                step="0.01"
                value={formData.rendaFamiliar || ''}
                onChange={(e) => handleInputChange('rendaFamiliar', e.target.value)}
                disabled={isReadOnly}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rendaFamiliar ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.rendaFamiliar && <p className="text-red-500 text-sm mt-1">{errors.rendaFamiliar}</p>}
            </div>

            {/* Informações de Moradia e Benefícios */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Informações de Moradia e Benefícios</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Moradia *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoMoradia"
                    value={TipoMoradia.Alugada}
                    checked={formData.tipoMoradia === TipoMoradia.Alugada}
                    onChange={(e) => handleInputChange('tipoMoradia', e.target.value)}
                    disabled={isReadOnly}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Alugada</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoMoradia"
                    value={TipoMoradia.Propria}
                    checked={formData.tipoMoradia === TipoMoradia.Propria}
                    onChange={(e) => handleInputChange('tipoMoradia', e.target.value)}
                    disabled={isReadOnly}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Própria</span>
                </label>
              </div>
              {errors.tipoMoradia && <p className="text-red-500 text-sm mt-1">{errors.tipoMoradia}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantos Cômodos *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.quantidadeComodos}
                onChange={(e) => handleInputChange('quantidadeComodos', e.target.value)}
                disabled={isReadOnly}
                placeholder="Ex: 3"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantidadeComodos ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.quantidadeComodos && <p className="text-red-500 text-sm mt-1">{errors.quantidadeComodos}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CadÚnico *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="possuiCadUnico"
                    value="true"
                    checked={formData.possuiCadUnico === true}
                    onChange={(e) => handleInputChange('possuiCadUnico', true)}
                    disabled={isReadOnly}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="possuiCadUnico"
                    value="false"
                    checked={formData.possuiCadUnico === false}
                    onChange={(e) => handleInputChange('possuiCadUnico', false)}
                    disabled={isReadOnly}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Não</span>
                </label>
              </div>
              {errors.possuiCadUnico && <p className="text-red-500 text-sm mt-1">{errors.possuiCadUnico}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qual Benefício
              </label>
              <input
                type="text"
                value={formData.qualBeneficio || ''}
                onChange={(e) => handleInputChange('qualBeneficio', e.target.value)}
                disabled={isReadOnly}
                placeholder="Ex: Bolsa Família, Auxílio Brasil, etc."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            {/* Necessidades */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Necessidades *</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(NecessidadeAssistido).map(necessidade => {
                  const labels = AssistidoEntity.formatarNecessidades([necessidade]);
                  return (
                    <label key={necessidade} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.necessidades.includes(necessidade)}
                        onChange={(e) => handleNecessidadeChange(necessidade, e.target.checked)}
                        disabled={isReadOnly}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{labels[0]}</span>
                    </label>
                  );
                })}
              </div>
              {errors.necessidades && <p className="text-red-500 text-sm mt-1">{errors.necessidades}</p>}
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                disabled={isReadOnly}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
                placeholder="Informações adicionais sobre a situação do assistido..."
              />
            </div>

            {/* Familiares */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900">Composição Familiar</h3>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddFamiliar}
                    className="px-3 py-1 text-sm text-white rounded-md font-medium hover:opacity-90"
                    style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
                  >
                    + Adicionar Familiar
                  </button>
                )}
              </div>

              {/* Lista de Familiares */}
              {familiares.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {familiares.map((familiar) => (
                    <div key={familiar.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="font-medium text-gray-900">{familiar.nome}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {getParentescoLabel(familiar.parentesco)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            {familiar.dataNascimento && (
                              <div>
                                <strong>Idade:</strong> {AssistidoEntity.calcularIdade(familiar.dataNascimento)} anos
                              </div>
                            )}
                            {familiar.telefone && (
                              <div>
                                <strong>Telefone:</strong> {familiar.telefone}
                              </div>
                            )}
                            {familiar.profissao && (
                              <div>
                                <strong>Profissão:</strong> {familiar.profissao}
                              </div>
                            )}
                            {familiar.renda && (
                              <div>
                                <strong>Renda:</strong> R$ {familiar.renda.toFixed(2)}
                              </div>
                            )}
                          </div>
                          {familiar.cpf && (
                            <div className="text-xs text-gray-500 mt-1">
                              CPF: {familiar.cpf}
                            </div>
                          )}
                        </div>
                        {!isReadOnly && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditFamiliar(familiar)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFamiliar(familiar.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhum familiar cadastrado</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddFamiliar}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clique aqui para adicionar o primeiro familiar
                    </button>
                  )}
                </div>
              )}

              {/* Modal para Adicionar/Editar Familiar */}
              {showAddFamiliar && !isReadOnly && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                  <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingFamiliar ? 'Editar Familiar' : 'Adicionar Familiar'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddFamiliar(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome *
                          </label>
                          <input
                            type="text"
                            value={familiarForm.nome || ''}
                            onChange={(e) => handleFamiliarInputChange('nome', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parentesco *
                          </label>
                          <select
                            value={familiarForm.parentesco}
                            onChange={(e) => handleFamiliarInputChange('parentesco', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.values(TipoParentesco).map(parentesco => (
                              <option key={parentesco} value={parentesco}>
                                {getParentescoLabel(parentesco)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                          <input
                            type="date"
                            value={familiarForm.dataNascimento || ''}
                            onChange={(e) => handleFamiliarInputChange('dataNascimento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                          <input
                            type="text"
                            value={familiarForm.cpf || ''}
                            onChange={(e) => {
                              const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                              handleFamiliarInputChange('cpf', formatted);
                            }}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                          <input
                            type="tel"
                            value={familiarForm.telefone || ''}
                            onChange={(e) => {
                              const numbers = e.target.value.replace(/\D/g, '');
                              let formatted = numbers;
                              if (numbers.length >= 2) {
                                formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
                              }
                              if (numbers.length >= 7) {
                                formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
                              }
                              handleFamiliarInputChange('telefone', formatted);
                            }}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                          <input
                            type="text"
                            value={familiarForm.profissao || ''}
                            onChange={(e) => handleFamiliarInputChange('profissao', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Renda Individual</label>
                          <input
                            type="number"
                            step="0.01"
                            value={familiarForm.renda || ''}
                            onChange={(e) => handleFamiliarInputChange('renda', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setShowAddFamiliar(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFamiliar}
                        className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90"
                        style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
                      >
                        {editingFamiliar ? 'Salvar Alterações' : 'Adicionar Familiar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Responsável pelo Atendimento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável pelo Atendimento</label>
              <input
                type="text"
                value={formData.responsavelAtendimento}
                onChange={(e) => handleInputChange('responsavelAtendimento', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
              />
            </div>
            </div>
          )}

          {/* Aba Família */}
          {activeTab === 'familia' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Familiares Cadastrados</h3>
              
              {/* Lista de familiares */}
              {familiares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum familiar cadastrado ainda.</p>
                  {!isReadOnly && (
                    <p className="mt-2">Use o botão "Adicionar Familiar" no final do formulário para cadastrar.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {familiares.map((familiar, index) => (
                    <div key={familiar.id || index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nome</label>
                          <p className="text-sm text-gray-900">{familiar.nome}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Parentesco</label>
                          <p className="text-sm text-gray-900">{getParentescoLabel(familiar.parentesco)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Idade</label>
                          <p className="text-sm text-gray-900">
                            {familiar.dataNascimento 
                              ? `${AssistidoEntity.calcularIdade(familiar.dataNascimento)} anos` 
                              : 'Não informado'
                            }
                          </p>
                        </div>
                        {familiar.cpf && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">CPF</label>
                            <p className="text-sm text-gray-900">{familiar.cpf}</p>
                          </div>
                        )}
                        {familiar.telefone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Telefone</label>
                            <p className="text-sm text-gray-900">{familiar.telefone}</p>
                          </div>
                        )}
                        {familiar.profissao && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profissão</label>
                            <p className="text-sm text-gray-900">{familiar.profissao}</p>
                          </div>
                        )}
                        {familiar.renda && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Renda</label>
                            <p className="text-sm text-gray-900">R$ {familiar.renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                      </div>
                      {!isReadOnly && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => setActiveTab('dados')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Editar na aba "Dados Pessoais"
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba Atendimentos */}
          {activeTab === 'atendimentos' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atendimentos</h3>
              
              {(!assistido?.atendimentos || assistido.atendimentos.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum atendimento registrado ainda.</p>
                  {mode !== 'create' && (
                    <p className="mt-2">Use o botão "Atender" na lista de assistidos para registrar um novo atendimento.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {assistido.atendimentos
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((atendimento, index) => (
                    <div key={atendimento.id || index} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data</label>
                          <p className="text-sm text-gray-900">
                            {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo</label>
                          <p className="text-sm text-gray-900">{getTipoAtendimentoLabel(atendimento.tipo)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Responsável</label>
                          <p className="text-sm text-gray-900">{atendimento.responsavel}</p>
                        </div>
                        {atendimento.valorDoacao && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Valor da Doação</label>
                            <p className="text-sm text-gray-900">
                              R$ {atendimento.valorDoacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        {atendimento.proximoRetorno && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Próximo Retorno</label>
                            <p className="text-sm text-gray-900">
                              {new Date(atendimento.proximoRetorno).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <p className="text-sm text-gray-900 mt-1">{atendimento.descricao}</p>
                      </div>

                      {atendimento.itensDoados && atendimento.itensDoados.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700">Itens Doados</label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {atendimento.itensDoados.map((item, itemIndex) => (
                              <span 
                                key={itemIndex} 
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {item.item} - {item.quantidade} {item.unidade}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
            >
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Cadastrar' : 'Salvar'}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistidoModal;