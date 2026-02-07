// Presentation Component - Atendimento Modal
// Modal for creating and managing assistance records for assistidos

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AssistidoService } from '@modules/assistance/assistidos/application/services/AssistidoService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Assistido, 
  AtendimentoAssistido,
  TipoAtendimento,
  ItemDoacao
} from '@modules/assistance/assistidos/domain/entities/Assistido';

interface AtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  assistido: Assistido | null;
}

const AtendimentoModal: React.FC<AtendimentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assistido
}) => {
  const { currentUser } = useAuth();
  const assistidoService = new AssistidoService();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: TipoAtendimento.CestaBasica,
    descricao: '',
    valorDoacao: '',
    proximoRetorno: ''
  });
  const [itensDoados, setItensDoados] = useState<ItemDoacao[]>([]);
  const [novoItem, setNovoItem] = useState({
    item: '',
    quantidade: '',
    unidade: 'kg'
  });

  useEffect(() => {
    if (isOpen && assistido) {
      // Reset form when modal opens
      setFormData({
        tipo: TipoAtendimento.CestaBasica,
        descricao: '',
        valorDoacao: '',
        proximoRetorno: ''
      });
      setItensDoados([]);
      setNovoItem({
        item: '',
        quantidade: '',
        unidade: 'kg'
      });
    }
  }, [isOpen, assistido]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNovoItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const adicionarItem = () => {
    if (novoItem.item.trim() && novoItem.quantidade) {
      const item: ItemDoacao = {
        item: novoItem.item.trim(),
        quantidade: parseFloat(novoItem.quantidade),
        unidade: novoItem.unidade
      };
      
      setItensDoados(prev => [...prev, item]);
      setNovoItem({
        item: '',
        quantidade: '',
        unidade: 'kg'
      });
    }
  };

  const removerItem = (index: number) => {
    setItensDoados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!assistido || !formData.descricao.trim()) {
      toast.error('Por favor, preencha a descrição do atendimento.');
      return;
    }

    try {
      setIsLoading(true);

      const atendimentoData: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date(),
        tipo: formData.tipo,
        descricao: formData.descricao.trim(),
        responsavel: currentUser?.email || 'unknown',
        ...(itensDoados.length > 0 && { itensDoados }),
        ...(formData.valorDoacao && { valorDoacao: parseFloat(formData.valorDoacao) }),
        ...(formData.proximoRetorno && { proximoRetorno: new Date(formData.proximoRetorno) })
      };

      await assistidoService.addAtendimento(assistido.id, atendimentoData);
      
      toast.success(`Atendimento registrado com sucesso para ${assistido.nome}! Tipo: ${getTipoAtendimentoLabel(formData.tipo)} | Data: ${new Date().toLocaleDateString('pt-BR')}`);
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving atendimento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao registrar atendimento: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isOpen || !assistido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registrar Atendimento</h2>
            <p className="text-sm text-gray-600 mt-1">
              Para: <span className="font-medium">{assistido.nome}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Tipo de Atendimento */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Atendimento *
            </label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo || TipoAtendimento.CestaBasica}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {Object.values(TipoAtendimento).map(tipo => (
                <option key={tipo} value={tipo}>
                  {getTipoAtendimentoLabel(tipo)}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Atendimento *
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva detalhadamente o atendimento realizado..."
              disabled={isLoading}
            />
          </div>

          {/* Itens Doados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Itens Doados (opcional)
            </label>
            
            {/* Adicionar novo item */}
            <div className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="item"
                    value={novoItem.item || ''}
                    onChange={handleNovoItemChange}
                    placeholder="Nome do item"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="quantidade"
                    value={novoItem.quantidade || ''}
                    onChange={handleNovoItemChange}
                    placeholder="Quantidade"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex">
                  <select
                    name="unidade"
                    value={novoItem.unidade || 'kg'}
                    onChange={handleNovoItemChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="unidade">unidade</option>
                    <option value="caixa">caixa</option>
                    <option value="pacote">pacote</option>
                  </select>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    disabled={isLoading || !novoItem.item.trim() || !novoItem.quantidade}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de itens adicionados */}
            {itensDoados.length > 0 && (
              <div className="space-y-2">
                {itensDoados.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span className="text-sm">
                      {item.item} - {item.quantidade} {item.unidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Valor da Doação */}
          <div>
            <label htmlFor="valorDoacao" className="block text-sm font-medium text-gray-700 mb-1">
              Valor da Doação (R$) - opcional
            </label>
            <input
              type="number"
              id="valorDoacao"
              name="valorDoacao"
              value={formData.valorDoacao || ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="0,00"
              disabled={isLoading}
            />
          </div>

          {/* Próximo Retorno */}
          <div>
            <label htmlFor="proximoRetorno" className="block text-sm font-medium text-gray-700 mb-1">
              Próximo Retorno - opcional
            </label>
            <input
              type="date"
              id="proximoRetorno"
              name="proximoRetorno"
              value={formData.proximoRetorno || ''}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading || !formData.descricao.trim()}
          >
            {isLoading ? 'Salvando...' : 'Registrar Atendimento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoModal;