// Presentation Page - Admin Leadership Management
// Manage church leaders and pastoral team

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Leader,
  LeaderRole,
  LeaderStatus,
  LEADER_ROLE_LABELS,
  LEADER_STATUS_LABELS
} from '@modules/content-management/leadership/domain/entities/Leader';
import { LeadershipService } from '@modules/content-management/leadership/application/services/LeadershipService';

interface LeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leader: Leader) => void;
  leader?: Leader | null;
  mode: 'create' | 'edit';
}

const LeaderModal: React.FC<LeaderModalProps> = ({ isOpen, onClose, onSave, leader, mode }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cargo: LeaderRole.Lider,
    cargoPersonalizado: '',
    ministerio: '',
    bio: '',
    foto: '',
    email: '',
    telefone: '',
    ordem: 0,
    status: LeaderStatus.Ativo
  });

  const leadershipService = new LeadershipService();

  useEffect(() => {
    if (leader && mode === 'edit') {
      setFormData({
        nome: leader.nome,
        cargo: leader.cargo,
        cargoPersonalizado: leader.cargoPersonalizado || '',
        ministerio: leader.ministerio || '',
        bio: leader.bio || '',
        foto: leader.foto || '',
        email: leader.email || '',
        telefone: leader.telefone || '',
        ordem: leader.ordem,
        status: leader.status
      });
    } else {
      setFormData({
        nome: '',
        cargo: LeaderRole.Lider,
        cargoPersonalizado: '',
        ministerio: '',
        bio: '',
        foto: '',
        email: '',
        telefone: '',
        ordem: 0,
        status: LeaderStatus.Ativo
      });
    }
  }, [leader, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('O nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        const newLeader = await leadershipService.createLeader({
          ...formData,
          criadoPor: currentUser?.email || 'admin'
        });
        onSave(newLeader);
        alert('✅ Líder cadastrado com sucesso!');
      } else if (leader) {
        const updated = await leadershipService.updateLeader(leader.id, formData);
        onSave(updated);
        alert('✅ Líder atualizado com sucesso!');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving leader:', error);
      alert(`❌ Erro ao salvar líder: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? '👤 Novo Líder' : '✏️ Editar Líder'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value as LeaderRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LEADER_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Personalizado</label>
              <input
                type="text"
                value={formData.cargoPersonalizado}
                onChange={(e) => setFormData({ ...formData, cargoPersonalizado: e.target.value })}
                placeholder="Ex: Pastor Presidente"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ministério</label>
              <input
                type="text"
                value={formData.ministerio}
                onChange={(e) => setFormData({ ...formData, ministerio: e.target.value })}
                placeholder="Ex: Louvor, Jovens, Crianças..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaderStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LEADER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto</label>
              <input
                type="url"
                value={formData.foto}
                onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                placeholder="Uma breve descrição sobre o líder..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
              <input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Cadastrar' : 'Atualizar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminLeadershipPage: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const leadershipService = new LeadershipService();

  useEffect(() => {
    loadLeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      const data = await leadershipService.getAllLeaders();
      setLeaders(data);
    } catch (error) {
      console.error('Error loading leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedLeader(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (leader: Leader) => {
    setSelectedLeader(leader);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (leader: Leader) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${leader.nome}"?`)) return;

    try {
      await leadershipService.deleteLeader(leader.id);
      setLeaders(prev => prev.filter(l => l.id !== leader.id));
      alert('✅ Líder excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting leader:', error);
      alert(`❌ Erro ao excluir líder: ${error.message}`);
    }
  };

  const handleSave = (leader: Leader) => {
    if (modalMode === 'create') {
      setLeaders(prev => [...prev, leader]);
    } else {
      setLeaders(prev => prev.map(l => l.id === leader.id ? leader : l));
    }
  };

  const getStatusColor = (status: LeaderStatus) => {
    switch (status) {
      case LeaderStatus.Ativo: return 'bg-green-100 text-green-800';
      case LeaderStatus.Inativo: return 'bg-red-100 text-red-800';
      case LeaderStatus.Afastado: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando liderança...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">👥 Gerenciar Liderança</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie os líderes e equipe pastoral da igreja
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>➕</span> Novo Líder
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{leaders.length}</p>
              <p className="text-sm text-gray-600">Total de Líderes</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {leaders.filter(l => l.status === LeaderStatus.Ativo).length}
              </p>
              <p className="text-sm text-gray-600">Ativos</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {leaders.filter(l => l.status === LeaderStatus.Afastado).length}
              </p>
              <p className="text-sm text-gray-600">Afastados</p>
            </div>
          </div>
        </div>

        {/* Leaders List */}
        <div className="bg-white rounded-lg shadow">
          {leaders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum líder cadastrado</h3>
              <p className="text-gray-500 mb-4">Clique em "Novo Líder" para adicionar o primeiro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministério</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaders.map((leader) => (
                    <tr key={leader.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leader.ordem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                            {leader.foto ? (
                              <img src={leader.foto} alt={leader.nome} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-lg">👤</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{leader.nome}</div>
                            {leader.email && (
                              <div className="text-sm text-gray-500">{leader.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leader.cargoPersonalizado || LEADER_ROLE_LABELS[leader.cargo]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leader.ministerio || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leader.status)}`}>
                          {LEADER_STATUS_LABELS[leader.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(leader)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(leader)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <LeaderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        leader={selectedLeader}
        mode={modalMode}
      />
    </div>
  );
};

export default AdminLeadershipPage;
