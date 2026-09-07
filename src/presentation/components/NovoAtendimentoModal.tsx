import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FichaAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import { FichaAcompanhamentoService } from '@modules/assistance/fichas/application/services/FichaAcompanhamentoService';
import { ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { StatusProfissional, TipoAssistencia } from '@modules/assistance/assistencia/domain/entities/Assistencia';

interface NovoAtendimentoModalProps {
  isOpen: boolean;
  ficha: FichaAcompanhamento | null;
  createdBy: string;
  onClose: () => void;
  onCreated: (ficha: FichaAcompanhamento) => void;
}

const isTipoAssistencia = (value: string): value is TipoAssistencia => (
  Object.values(TipoAssistencia).includes(value as TipoAssistencia)
);

const NovoAtendimentoModal: React.FC<NovoAtendimentoModalProps> = ({
  isOpen,
  ficha,
  createdBy,
  onClose,
  onCreated
}) => {
  const [profissionalId, setProfissionalId] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !ficha) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const service = new ProfissionalAssistenciaService();
        const list = isTipoAssistencia(ficha.tipoAssistencia)
          ? await service.getProfissionaisByTipo(ficha.tipoAssistencia)
          : await service.getAllProfissionais();
        const active = list
          .filter(item => item.status === StatusProfissional.Ativo)
          .map(item => ({ id: item.id, nome: item.nome }));
        if (!cancelled) {
          setOptions(active);
          setProfissionalId(
            active.some(item => item.id === ficha.profissionalId)
              ? ficha.profissionalId
              : (active[0]?.id || '')
          );
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error('Não foi possível carregar os profissionais');
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, ficha]);

  if (!isOpen || !ficha) {
    return null;
  }

  const handleConfirm = async () => {
    const profissional = options.find(item => item.id === profissionalId);
    if (!profissional) {
      toast.error('Selecione o profissional responsável');
      return;
    }
    setSaving(true);
    try {
      const service = new FichaAcompanhamentoService();
      const created = await service.reabrirAtendimento(ficha.id, profissional, createdBy);
      toast.success(`Novo atendimento criado para ${created.pacienteNome}`);
      onCreated(created);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o novo atendimento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900">Novo atendimento</h2>
        <p className="text-sm text-gray-600 mt-2">
          Gera uma nova ficha a partir do histórico de <strong>{ficha.pacienteNome}</strong>,
          sem preencher do zero. O profissional anterior era {ficha.profissionalNome}.
        </p>
        <label className="block mt-4">
          <span className="block text-sm font-medium text-gray-700 mb-1">Profissional responsável</span>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={profissionalId}
            onChange={event => setProfissionalId(event.target.value)}
            disabled={loading || options.length === 0}
          >
            {options.length === 0 && <option value="">Nenhum profissional disponível</option>}
            {options.map(item => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-md disabled:opacity-50"
            onClick={() => void handleConfirm()}
            disabled={saving || loading || !profissionalId}
          >
            {saving ? 'Gerando...' : 'Gerar atendimento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovoAtendimentoModal;
