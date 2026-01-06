import React, { useState, useEffect } from 'react';
import { AssistidoService } from '@modules/assistance/assistidos/application/services/AssistidoService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import AssistidoModal from '../components/AssistidoModal';
import AtendimentoModal from '../components/AtendimentoModal';
import {
  Assistido,
  AssistidoEntity,
  StatusAssistido,
  NecessidadeAssistido,
  TipoAtendimento
} from '../../modules/assistance/assistidos/domain/entities/Assistido';
import {
  HiUsers,
  HiClipboardDocumentList,
  HiChartBar,
  HiPlus,
  HiCheckCircle,
  HiMinusCircle,
  HiDocumentText,
  HiUserGroup,
  HiXMark,
  HiArrowPath,
  HiEye,
  HiPencil,
  HiHeart,
  HiNoSymbol,
  HiTrash,
  HiPrinter,
  HiCurrencyDollar
} from 'react-icons/hi2';

interface AssistidosManagementPageProps {}

const AssistidosManagementPage: React.FC<AssistidosManagementPageProps> = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'assistidos' | 'atendimentos' | 'relatorios'>('assistidos');
  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [selectedAssistido, setSelectedAssistido] = useState<Assistido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'atendimento'>('view');
  const [filterStatus, setFilterStatus] = useState<StatusAssistido | 'all'>('all');
  const [filterNecessidade, setFilterNecessidade] = useState<NecessidadeAssistido | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<any>(null);

  const assistidoService = new AssistidoService();

  useEffect(() => {
    loadAssistidos();
    loadStatistics();
  }, []);

  const loadAssistidos = async () => {
    try {
      setIsLoading(true);
      const data = await assistidoService.getAllAssistidos();
      setAssistidos(data);
    } catch (error) {
      console.error('Error loading assistidos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('permissions') || errorMessage.includes('insufficient')) {
        alert('Erro: Você não tem permissão para acessar os dados de assistidos. Contate o administrador.');
      } else {
        alert('Erro ao carregar assistidos: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await assistidoService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Statistics are optional, don't show alert for them
    }
  };

  const handleCreateAssistido = () => {
    setSelectedAssistido(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditAssistido = (assistido: Assistido) => {
    setSelectedAssistido(assistido);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewAssistido = (assistido: Assistido) => {
    setSelectedAssistido(assistido);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleAddAtendimento = (assistido: Assistido) => {
    setSelectedAssistido(assistido);
    setModalMode('atendimento');
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    await loadAssistidos();
    await loadStatistics();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssistido(null);
  };

  const handleStatusChange = async (assistido: Assistido, newStatus: StatusAssistido) => {
    try {
      await assistidoService.updateAssistidoStatus(assistido.id, newStatus);
      await loadAssistidos();
      await loadStatistics();
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleDeleteAssistido = async (assistido: Assistido) => {
    // Double confirmation for safety
    const firstConfirm = window.confirm(
      `⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o assistido "${assistido.nome}"?\n\n` +
      `Esta ação não pode ser desfeita e todos os dados serão perdidos:\n` +
      `• Dados pessoais e familiares\n` +
      `• Histórico completo de atendimentos\n` +
      `• Registros de doações\n\n` +
      `Clique em OK para continuar ou Cancelar para voltar.`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `🔴 CONFIRMAÇÃO FINAL\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE:\n` +
      `Nome: ${assistido.nome}\n` +
      `CPF: ${assistido.cpf || 'Não informado'}\n` +
      `Telefone: ${assistido.telefone}\n\n` +
      `Digite "CONFIRMAR" no próximo prompt para prosseguir.`
    );

    if (!secondConfirm) return;

    const finalConfirmation = window.prompt(
      'Para confirmar a exclusão PERMANENTE, digite exatamente: CONFIRMAR'
    );

    if (finalConfirmation !== 'CONFIRMAR') {
      alert('Exclusão cancelada. Texto de confirmação não confere.');
      return;
    }

    try {
      await assistidoService.deleteAssistido(assistido.id);
      await loadAssistidos();
      await loadStatistics();
      alert(`✅ ${assistido.nome} foi excluído permanentemente do sistema.`);
    } catch (error) {
      console.error('Error deleting assistido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao excluir assistido: ' + errorMessage);
    }
  };

  const filteredAssistidos = assistidos.filter(assistido => {
    const matchesStatus = filterStatus === 'all' || assistido.status === filterStatus;
    const matchesNecessidade = filterNecessidade === 'all' || assistido.necessidades.includes(filterNecessidade);
    const matchesSearch = !searchTerm || 
      assistido.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assistido.cpf && assistido.cpf.includes(searchTerm)) ||
      assistido.telefone.includes(searchTerm);
    
    return matchesStatus && matchesNecessidade && matchesSearch;
  });

  const getStatusColor = (status: StatusAssistido) => {
    const colors = {
      [StatusAssistido.Ativo]: 'bg-green-100 text-green-800',
      [StatusAssistido.Inativo]: 'bg-gray-100 text-gray-800',
      [StatusAssistido.Suspenso]: 'bg-yellow-100 text-yellow-800',
      [StatusAssistido.Transferido]: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const getStatusLabel = (status: StatusAssistido) => {
    const labels = {
      [StatusAssistido.Ativo]: 'Ativo',
      [StatusAssistido.Inativo]: 'Inativo',
      [StatusAssistido.Suspenso]: 'Suspenso',
      [StatusAssistido.Transferido]: 'Transferido'
    };
    return labels[status];
  };

  const getNecessidadeLabel = (necessidade: NecessidadeAssistido) => {
    return AssistidoEntity.formatarNecessidades([necessidade])[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Assistidos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre pessoas assistidas pela igreja e suas famílias
              </p>
            </div>
            {activeTab === 'assistidos' && (
              <button
                onClick={handleCreateAssistido}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Cadastrar Assistido
              </button>
            )}
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assistidos')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assistidos'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiUsers className="w-5 h-5 mr-2" />
              Assistidos
            </button>
            <button
              onClick={() => setActiveTab('atendimentos')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'atendimentos'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiClipboardDocumentList className="w-5 h-5 mr-2" />
              Atendimentos
            </button>
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'relatorios'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiChartBar className="w-5 h-5 mr-2" />
              Relatórios
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'assistidos' && (
          <>
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <HiCheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalAtivos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <HiMinusCircle className="w-7 h-7 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Inativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalInativos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HiDocumentText className="w-7 h-7 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Atendimentos (30d)</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.atendimentosUltimos30Dias}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <HiUserGroup className="w-7 h-7 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Famílias</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.familiasTotais}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF ou telefone..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full lg:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusAssistido | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value={StatusAssistido.Ativo}>Ativo</option>
                <option value={StatusAssistido.Inativo}>Inativo</option>
                <option value={StatusAssistido.Suspenso}>Suspenso</option>
                <option value={StatusAssistido.Transferido}>Transferido</option>
              </select>
            </div>
            <div className="w-full lg:w-64">
              <select
                value={filterNecessidade}
                onChange={(e) => setFilterNecessidade(e.target.value as NecessidadeAssistido | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as necessidades</option>
                {Object.values(NecessidadeAssistido).map(necessidade => (
                  <option key={necessidade} value={necessidade}>
                    {getNecessidadeLabel(necessidade)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterNecessidade('all');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                title="Limpar filtros"
              >
                <HiXMark className="w-4 h-4 mr-2" />
                Limpar
              </button>
              <button
                onClick={loadAssistidos}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
                title="Atualizar lista"
              >
                <HiArrowPath className="w-4 h-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Assistidos List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Assistidos ({filteredAssistidos.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Necessidades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Atendimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssistidos.map((assistido) => (
                <tr key={assistido.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{assistido.nome}</div>
                      <div className="text-sm text-gray-500">
                        {AssistidoEntity.calcularIdade(assistido.dataNascimento)} anos • {assistido.endereco.cidade}
                        {assistido.familiares.length > 0 && (
                          <span className="ml-2 text-blue-600">
                            👨‍👩‍👧‍👦 {assistido.familiares.length + 1} pessoas
                          </span>
                        )}
                      </div>
                      {assistido.cpf && (
                        <div className="text-xs text-gray-400">CPF: {assistido.cpf}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assistido.telefone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assistido.status)}`}>
                      {getStatusLabel(assistido.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {assistido.necessidades.slice(0, 3).map(necessidade => (
                        <span key={necessidade} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {getNecessidadeLabel(necessidade)}
                        </span>
                      ))}
                      {assistido.necessidades.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{assistido.necessidades.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assistido.dataUltimoAtendimento 
                      ? new Date(assistido.dataUltimoAtendimento).toLocaleDateString('pt-BR')
                      : 'Nenhum'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewAssistido(assistido)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        title="Visualizar dados"
                      >
                        <HiEye className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditAssistido(assistido)}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        title="Editar dados"
                      >
                        <HiPencil className="w-4 h-4 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleAddAtendimento(assistido)}
                        className="inline-flex items-center text-green-600 hover:text-green-900"
                        title="Registrar atendimento"
                      >
                        <HiHeart className="w-4 h-4 mr-1" />
                        Atender
                      </button>
                      {assistido.status === StatusAssistido.Ativo ? (
                        <button
                          onClick={() => handleStatusChange(assistido, StatusAssistido.Inativo)}
                          className="inline-flex items-center text-red-600 hover:text-red-900"
                          title="Inativar assistido"
                        >
                          <HiNoSymbol className="w-4 h-4 mr-1" />
                          Inativar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(assistido, StatusAssistido.Ativo)}
                          className="inline-flex items-center text-green-600 hover:text-green-900"
                          title="Ativar assistido"
                        >
                          <HiCheckCircle className="w-4 h-4 mr-1" />
                          Ativar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAssistido(assistido)}
                        className="inline-flex items-center text-red-700 hover:text-red-900 font-medium"
                        title="Excluir permanentemente"
                      >
                        <HiTrash className="w-4 h-4 mr-1" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {filteredAssistidos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum assistido encontrado com os filtros aplicados.</p>
              <button
                onClick={handleCreateAssistido}
                className="inline-flex items-center mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Cadastrar primeiro assistido
              </button>
            </div>
          )}
        </div>
          </>
        )}

        {/* Aba de Atendimentos */}
        {activeTab === 'atendimentos' && (
          <AtendimentosListView assistidos={assistidos} settings={settings} />
        )}

        {/* Aba de Relatórios */}
        {activeTab === 'relatorios' && (
          <RelatoriosView assistidos={assistidos} assistidoService={assistidoService} settings={settings} />
        )}

      {/* Modal para cadastro/edição/visualização */}
      {modalMode !== 'atendimento' && (
        <AssistidoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleModalSave}
          assistido={selectedAssistido}
          mode={modalMode}
        />
      )}

      {/* Modal para atendimento */}
      {modalMode === 'atendimento' && (
        <AtendimentoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleModalSave}
          assistido={selectedAssistido}
        />
      )}
      </div>
    </div>
  );
};

// Componente para listar todos os atendimentos
const AtendimentosListView: React.FC<{ 
  assistidos: Assistido[], 
  settings: any 
}> = ({ assistidos, settings }) => {
  const [filterTipo, setFilterTipo] = useState<TipoAtendimento | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Extrair todos os atendimentos de todos os assistidos
  const allAtendimentos = assistidos.flatMap(assistido => 
    assistido.atendimentos.map(atendimento => ({
      ...atendimento,
      assistidoNome: assistido.nome,
      assistidoId: assistido.id,
      assistidoCpf: assistido.cpf,
      assistidoTelefone: assistido.telefone
    }))
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Filtrar atendimentos
  const filteredAtendimentos = allAtendimentos.filter(atendimento => {
    const matchesTipo = filterTipo === 'all' || atendimento.tipo === filterTipo;
    const matchesSearch = !searchTerm || 
      atendimento.assistidoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter.startDate && dateFilter.endDate) {
      const atendimentoDate = new Date(atendimento.data);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = atendimentoDate >= startDate && atendimentoDate <= endDate;
    }

    return matchesTipo && matchesSearch && matchesDate;
  });

  const getTipoLabel = (tipo: TipoAtendimento) => {
    const labels: Record<TipoAtendimento, string> = {
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
    return labels[tipo];
  };

  const getTipoColor = (tipo: TipoAtendimento) => {
    const colors: Record<TipoAtendimento, string> = {
      [TipoAtendimento.CestaBasica]: 'bg-green-100 text-green-800',
      [TipoAtendimento.Donativos]: 'bg-blue-100 text-blue-800',
      [TipoAtendimento.Medicamento]: 'bg-red-100 text-red-800',
      [TipoAtendimento.Vestuario]: 'bg-pink-100 text-pink-800',
      [TipoAtendimento.Orientacao]: 'bg-purple-100 text-purple-800',
      [TipoAtendimento.EncaminhamentoMedico]: 'bg-orange-100 text-orange-800',
      [TipoAtendimento.EncaminhamentoJuridico]: 'bg-indigo-100 text-indigo-800',
      [TipoAtendimento.AconselhamentoEspiritual]: 'bg-teal-100 text-teal-800',
      [TipoAtendimento.AuxilioFinanceiro]: 'bg-yellow-100 text-yellow-800',
      [TipoAtendimento.Documentacao]: 'bg-gray-100 text-gray-800',
      [TipoAtendimento.Outro]: 'bg-gray-100 text-gray-800'
    };
    return colors[tipo];
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico de Atendimentos</h2>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por assistido, descrição ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as TipoAtendimento | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {Object.values(TipoAtendimento).map(tipo => (
              <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Data inicial"
          />

          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Data final"
          />
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">Total de Atendimentos</div>
            <div className="text-2xl font-bold text-gray-900">{filteredAtendimentos.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">Assistidos Atendidos</div>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(filteredAtendimentos.map(a => a.assistidoId)).size}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">Valor Total em Doações</div>
            <div className="text-2xl font-bold text-gray-900">
              R$ {filteredAtendimentos.reduce((sum, a) => sum + (a.valorDoacao || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Lista de atendimentos */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assistido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAtendimentos.map((atendimento, index) => (
                <tr key={`${atendimento.id}_${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{atendimento.assistidoNome}</div>
                      <div className="text-xs text-gray-500">{atendimento.assistidoTelefone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(atendimento.tipo)}`}>
                      {getTipoLabel(atendimento.tipo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={atendimento.descricao}>
                      {atendimento.descricao}
                    </div>
                    {atendimento.itensDoados && atendimento.itensDoados.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        📦 {atendimento.itensDoados.map(item => `${item.quantidade} ${item.unidade} de ${item.item}`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {atendimento.responsavel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {atendimento.valorDoacao ? `R$ ${atendimento.valorDoacao.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAtendimentos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum atendimento encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para relatórios
const RelatoriosView: React.FC<{ 
  assistidos: Assistido[], 
  assistidoService: AssistidoService,
  settings: any 
}> = ({ assistidos, assistidoService, settings }) => {
  const [reportType, setReportType] = useState<'geral' | 'necessidades' | 'atendimentos' | 'financeiro'>('geral');
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const stats = await assistidoService.getStatistics();
      
      // Calcular dados do relatório
      const totalAssistidos = assistidos.length;
      const totalAtivos = assistidos.filter(a => a.status === StatusAssistido.Ativo).length;
      const totalFamilias = assistidos.filter(a => a.familiares.length > 0).length;
      const totalPessoasAtendidas = assistidos.reduce((sum, a) => sum + 1 + a.familiares.length, 0);
      
      // Atendimentos
      const allAtendimentos = assistidos.flatMap(a => a.atendimentos);
      const totalAtendimentos = allAtendimentos.length;
      const valorTotalDoacoes = allAtendimentos.reduce((sum, a) => sum + (a.valorDoacao || 0), 0);
      
      // Últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const atendimentosUltimos30Dias = allAtendimentos.filter(a => new Date(a.data) >= thirtyDaysAgo);
      
      // Distribuição por tipo de atendimento
      const distribuicaoTipos: Record<TipoAtendimento, number> = {} as Record<TipoAtendimento, number>;
      Object.values(TipoAtendimento).forEach(tipo => {
        distribuicaoTipos[tipo] = allAtendimentos.filter(a => a.tipo === tipo).length;
      });
      
      // Distribuição por necessidade
      const distribuicaoNecessidades: Record<NecessidadeAssistido, number> = {} as Record<NecessidadeAssistido, number>;
      Object.values(NecessidadeAssistido).forEach(necessidade => {
        distribuicaoNecessidades[necessidade] = assistidos.filter(a => a.necessidades.includes(necessidade)).length;
      });
      
      // Faixa etária
      const faixasEtarias = {
        '0-12': 0,
        '13-18': 0,
        '19-30': 0,
        '31-50': 0,
        '51-65': 0,
        '65+': 0
      };
      
      assistidos.forEach(a => {
        const idade = AssistidoEntity.calcularIdade(a.dataNascimento);
        if (idade <= 12) faixasEtarias['0-12']++;
        else if (idade <= 18) faixasEtarias['13-18']++;
        else if (idade <= 30) faixasEtarias['19-30']++;
        else if (idade <= 50) faixasEtarias['31-50']++;
        else if (idade <= 65) faixasEtarias['51-65']++;
        else faixasEtarias['65+']++;
      });
      
      setReportData({
        geradoEm: new Date(),
        totalAssistidos,
        totalAtivos,
        totalFamilias,
        totalPessoasAtendidas,
        totalAtendimentos,
        valorTotalDoacoes,
        atendimentosUltimos30Dias: atendimentosUltimos30Dias.length,
        valorDoacoesUltimos30Dias: atendimentosUltimos30Dias.reduce((sum, a) => sum + (a.valorDoacao || 0), 0),
        distribuicaoTipos,
        distribuicaoNecessidades,
        faixasEtarias,
        totalInativos: stats.totalInativos,
        necessidadeMaisComum: stats.necessidadeMaisComum,
        familiasTotais: stats.familiasTotais,
        rendaMediaFamiliar: stats.rendaMediaFamiliar,
        idadeMedia: stats.idadeMedia
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    generateReport();
  }, []);

  if (!reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <div className="flex space-x-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Atualizar dados do relatório"
            >
              <HiArrowPath className="w-4 h-4 mr-2" />
              {isGenerating ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 rounded-md text-white hover:opacity-90"
              style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
              title="Imprimir relatório"
            >
              <HiPrinter className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </button>
          </div>
        </div>

        {/* Seletor de tipo de relatório */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setReportType('geral')}
              className={`inline-flex items-center px-4 py-2 rounded ${reportType === 'geral' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <HiChartBar className="w-4 h-4 mr-2" />
              Relatório Geral
            </button>
            <button
              onClick={() => setReportType('necessidades')}
              className={`inline-flex items-center px-4 py-2 rounded ${reportType === 'necessidades' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <HiHeart className="w-4 h-4 mr-2" />
              Por Necessidades
            </button>
            <button
              onClick={() => setReportType('atendimentos')}
              className={`inline-flex items-center px-4 py-2 rounded ${reportType === 'atendimentos' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <HiClipboardDocumentList className="w-4 h-4 mr-2" />
              Atendimentos
            </button>
            <button
              onClick={() => setReportType('financeiro')}
              className={`inline-flex items-center px-4 py-2 rounded ${reportType === 'financeiro' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <HiCurrencyDollar className="w-4 h-4 mr-2" />
              Financeiro
            </button>
          </div>
        </div>

        {/* Relatório Geral */}
        {reportType === 'geral' && (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total de Assistidos</div>
                <div className="text-3xl font-bold text-gray-900">{reportData.totalAssistidos}</div>
                <div className="text-xs text-green-600 mt-2">
                  {reportData.totalAtivos} ativos
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total de Famílias</div>
                <div className="text-3xl font-bold text-gray-900">{reportData.totalFamilias}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {reportData.totalPessoasAtendidas} pessoas no total
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total de Atendimentos</div>
                <div className="text-3xl font-bold text-gray-900">{reportData.totalAtendimentos}</div>
                <div className="text-xs text-blue-600 mt-2">
                  {reportData.atendimentosUltimos30Dias} nos últimos 30 dias
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Valor Total Doado</div>
                <div className="text-3xl font-bold text-gray-900">
                  R$ {reportData.valorTotalDoacoes.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 mt-2">
                  R$ {reportData.valorDoacoesUltimos30Dias.toFixed(2)} últimos 30 dias
                </div>
              </div>
            </div>

            {/* Distribuição por faixa etária */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Faixa Etária</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(reportData.faixasEtarias).map(([faixa, count]) => (
                  <div key={faixa} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                    <div className="text-sm text-gray-600">{faixa} anos</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Relatório por Necessidades */}
        {reportType === 'necessidades' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Necessidades</h3>
            <div className="space-y-4">
              {Object.entries(reportData.distribuicaoNecessidades)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([necessidade, count]) => {
                  const percentage = reportData.totalAtivos > 0 
                    ? ((count as number) / reportData.totalAtivos * 100).toFixed(1)
                    : '0';
                  return (
                    <div key={necessidade} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {AssistidoEntity.formatarNecessidades([necessidade as NecessidadeAssistido])[0]}
                          </span>
                          <span className="text-sm text-gray-500">
                            {count as number} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Relatório de Atendimentos */}
        {reportType === 'atendimentos' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo de Atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(reportData.distribuicaoTipos)
                .filter(([,count]) => (count as number) > 0)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">
                        {getTipoLabel(tipo as TipoAtendimento)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((count as number) / reportData.totalAtendimentos * 100).toFixed(1)}% do total
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Relatório Financeiro */}
        {reportType === 'financeiro' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-sm text-gray-600">Total de Doações</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {reportData.valorTotalDoacoes.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">Média por Atendimento</div>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {reportData.totalAtendimentos > 0 
                      ? (reportData.valorTotalDoacoes / reportData.totalAtendimentos).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600">Renda Média Familiar</div>
                  <div className="text-2xl font-bold text-purple-600">
                    R$ {reportData.rendaMediaFamiliar?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Doações por Tipo de Atendimento</h3>
              <div className="space-y-3">
                {(() => {
                  const doacoesPorTipo = assistidos.flatMap(a => a.atendimentos)
                    .filter(a => a.valorDoacao && a.valorDoacao > 0)
                    .reduce((acc, atendimento) => {
                      const tipo = atendimento.tipo;
                      if (!acc[tipo]) {
                        acc[tipo] = { count: 0, total: 0 };
                      }
                      acc[tipo].count++;
                      acc[tipo].total += atendimento.valorDoacao || 0;
                      return acc;
                    }, {} as Record<string, { count: number, total: number }>);
                  
                  return Object.entries(doacoesPorTipo)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .map(([tipo, data]) => (
                      <div key={tipo} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{getTipoLabel(tipo as TipoAtendimento)}</div>
                          <div className="text-sm text-gray-500">{data.count} doações</div>
                        </div>
                        <div className="text-lg font-semibold">R$ {data.total.toFixed(2)}</div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Informações do relatório */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Relatório gerado em {new Date(reportData.geradoEm).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

// Helper function for TipoAtendimento labels
const getTipoLabel = (tipo: TipoAtendimento) => {
  const labels: Record<TipoAtendimento, string> = {
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
  return labels[tipo];
};

export default AssistidosManagementPage;