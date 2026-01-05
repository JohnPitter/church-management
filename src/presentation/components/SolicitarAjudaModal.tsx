// Presentation Component - Solicitar Ajuda Modal
// Modal for professionals to request help from other professionals

import React, { useState, useEffect } from 'react';
import { HelpRequestPriority } from '../../modules/assistance/help-requests/domain/entities/HelpRequest';
import { ProfissionalAssistencia, TipoAssistencia } from '../../domain/entities/Assistencia';
import { HelpRequestService } from '../../infrastructure/services/HelpRequestService';
import { ProfissionalAssistenciaService } from '../../infrastructure/services/AssistenciaService';

interface SolicitarAjudaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;

  // Informações do solicitante (profissional logado)
  requesterId: string;
  requesterName: string;
  requesterSpecialty: string;
  requesterEmail?: string; // Email para filtrar corretamente

  // Informações do assistido/ficha
  assistidoId: string;
  assistidoNome: string;
  fichaId: string;
  agendamentoId?: string;

  // ID do usuário logado
  currentUserId: string;
}

export const SolicitarAjudaModal: React.FC<SolicitarAjudaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requesterId,
  requesterName,
  requesterSpecialty,
  requesterEmail,
  assistidoId,
  assistidoNome,
  fichaId,
  agendamentoId,
  currentUserId
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [especialidade, setEspecialidade] = useState<TipoAssistencia | ''>('');
  const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState<ProfissionalAssistencia[]>([]);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<HelpRequestPriority>(HelpRequestPriority.Normal);

  const helpRequestService = new HelpRequestService();
  const profissionalService = new ProfissionalAssistenciaService();

  // Load professionals when specialty changes
  useEffect(() => {
    if (especialidade) {
      loadProfissionais();
    } else {
      setProfissionaisDisponiveis([]);
      setProfissionalSelecionado('');
    }
  }, [especialidade]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEspecialidade('');
    setProfissionaisDisponiveis([]);
    setProfissionalSelecionado('');
    setMotivo('');
    setDescricao('');
    setPrioridade(HelpRequestPriority.Normal);
    setError(null);
  };

  const loadProfissionais = async () => {
    if (!especialidade) return;

    try {
      setLoadingProfissionais(true);
      const profissionais = await profissionalService.getProfissionaisByTipo(especialidade);

      // Filter out the requester (by ID or email) and only show active professionals
      const profissionaisFiltrados = profissionais.filter(p => {
        const isSameId = p.id === requesterId;
        const isSameEmail = requesterEmail && p.email.toLowerCase() === requesterEmail.toLowerCase();
        const isRequester = isSameId || isSameEmail;
        return !isRequester && p.status === 'ativo';
      });

      setProfissionaisDisponiveis(profissionaisFiltrados);
    } catch (error) {
      console.error('Error loading professionals:', error);
      setError('Erro ao carregar profissionais');
    } finally {
      setLoadingProfissionais(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!especialidade) {
      setError('Selecione uma especialidade');
      return;
    }

    if (!profissionalSelecionado) {
      setError('Selecione um profissional');
      return;
    }

    if (!motivo.trim()) {
      setError('Informe o motivo da solicitação');
      return;
    }

    if (motivo.trim().length < 10) {
      setError('O motivo deve ter no mínimo 10 caracteres');
      return;
    }

    if (!descricao.trim()) {
      setError('Informe a descrição detalhada');
      return;
    }

    if (descricao.trim().length < 20) {
      setError('A descrição deve ter no mínimo 20 caracteres');
      return;
    }

    try {
      setLoading(true);

      const profissional = profissionaisDisponiveis.find(p => p.id === profissionalSelecionado);
      if (!profissional) {
        throw new Error('Profissional não encontrado');
      }

      await helpRequestService.createHelpRequest({
        requesterId,
        requesterName,
        requesterSpecialty,
        helperId: profissional.id,
        helperName: profissional.nome,
        helperSpecialty: profissional.especialidade,
        assistidoId,
        assistidoNome,
        fichaId,
        agendamentoId,
        motivo: motivo.trim(),
        descricao: descricao.trim(),
        prioridade,
        createdBy: currentUserId
      });

      alert('✓ Pedido de ajuda enviado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating help request:', error);
      setError('Erro ao enviar pedido de ajuda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white mb-10">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Solicitar Ajuda de Outro Profissional
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Peça auxílio de um colega especializado para este caso
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Assistido Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Assistido:</h4>
              <p className="text-blue-800">{assistidoNome}</p>
            </div>

            {/* Especialidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidade Necessária <span className="text-red-600">*</span>
              </label>
              <select
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value as TipoAssistencia)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Selecione a especialidade</option>
                <option value={TipoAssistencia.Psicologica}>Psicologia</option>
                <option value={TipoAssistencia.Fisioterapia}>Fisioterapia</option>
                <option value={TipoAssistencia.Nutricao}>Nutrição</option>
                <option value={TipoAssistencia.Social}>Assistência Social</option>
                <option value={TipoAssistencia.Juridica}>Jurídica</option>
                <option value={TipoAssistencia.Medica}>Médica</option>
              </select>
            </div>

            {/* Profissional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profissional <span className="text-red-600">*</span>
              </label>
              {loadingProfissionais ? (
                <div className="text-center py-4 text-gray-500">
                  Carregando profissionais...
                </div>
              ) : profissionaisDisponiveis.length === 0 && especialidade ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                  Nenhum profissional disponível nesta especialidade
                </div>
              ) : (
                <select
                  value={profissionalSelecionado}
                  onChange={(e) => setProfissionalSelecionado(e.target.value)}
                  disabled={loading || !especialidade}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {profissionaisDisponiveis.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.registroProfissional}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade <span className="text-red-600">*</span>
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as HelpRequestPriority)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value={HelpRequestPriority.Low}>Baixa</option>
                <option value={HelpRequestPriority.Normal}>Normal</option>
                <option value={HelpRequestPriority.High}>Alta</option>
                <option value={HelpRequestPriority.Urgent}>Urgente</option>
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={loading}
                placeholder="Ex: Avaliação nutricional complementar"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className={`text-sm mt-1 text-right ${
                motivo.length < 10 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {motivo.length}/100 caracteres {motivo.length < 10 && '(mínimo 10)'}
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada <span className="text-red-600">*</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loading}
                placeholder="Descreva detalhadamente o caso e o tipo de auxílio necessário..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className={`text-sm mt-1 text-right ${
                descricao.length < 20 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {descricao.length}/500 caracteres {descricao.length < 20 && '(mínimo 20)'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {loading ? 'Enviando...' : 'Enviar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
