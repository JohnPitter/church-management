import React from 'react';
import type { FichaTabProps } from './types';
export const FichaSessoesTab: React.FC<FichaTabProps> = (props) => {
  const {
    ficha,
    sessoes,
    novaSessao,
    setNovaSessao,
    editingSessao,
    isLoading,
    novoComentario,
    setNovoComentario,
    editandoDadosEspecializados,
    setEditandoDadosEspecializados,
    dadosEspecializadosForm,
    setDadosEspecializadosForm,
    validationErrors,
    isFormValid,
    handleAddComentario,
    handleAddSessao,
    handleEditSessao,
    handleCancelEdit,
    handleSaveDadosEspecializados,
    handleCancelEditDadosEspecializados,
    handleFieldChange,
    handleUpdateSessao,
    hasError,
    getInputClassName,
  } = props;

  return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessões Realizadas ({sessoes.length})</h3>
                {sessoes.length === 0 ? (
                  <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {sessoes.map((sessao) => (
                      <div key={sessao.id} className={`border rounded-lg p-4 ${editingSessao?.id === sessao.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              Sessao #{sessao.numeroSessao} - {sessao.tipoSessao}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              (sessao.status === 'concluida' || !sessao.status) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {sessao.status === 'nao_realizada' ? 'Nao Realizada' : 'Concluida'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {new Date(sessao.data).toLocaleDateString('pt-BR')} ({sessao.duracao}min)
                            </span>
                            <button
                              onClick={() => handleEditSessao(sessao)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title="Editar sessao"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{sessao.resumo}</p>
                        {sessao.observacoes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Observacoes:</span> {sessao.observacoes}
                          </p>
                        )}
                        {sessao.evolucao && (
                          <p className="text-sm text-gray-600 bg-green-50 p-2 rounded mt-1">
                            <span className="font-medium">Evolucao:</span> {sessao.evolucao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nova Sessão / Editar Sessão */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-gray-900">
                    {editingSessao ? `Editando Sessao #${editingSessao.numeroSessao}` : 'Registrar Nova Sessao'}
                  </h4>
                  {editingSessao && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar edicao
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={novaSessao.tipoSessao}
                      onChange={(e) => setNovaSessao((prev: any) => ({ ...prev, tipoSessao: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="individual">Individual</option>
                      <option value="grupo">Grupo</option>
                      <option value="familiar">Familiar</option>
                      <option value="avaliacao">Avaliacao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={novaSessao.status}
                      onChange={(e) => setNovaSessao((prev: any) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="concluida">Concluida</option>
                      <option value="nao_realizada">Nao Realizada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duracao (min)</label>
                    <input
                      type="number"
                      value={novaSessao.duracao}
                      onChange={(e) => setNovaSessao((prev: any) => ({ ...prev, duracao: parseInt(e.target.value) || 50 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="15"
                      max="180"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resumo da Sessão *</label>
                  <textarea
                    value={novaSessao.resumo}
                    onChange={(e) => setNovaSessao((prev: any) => ({ ...prev, resumo: e.target.value }))}
                    placeholder="Descreva o que foi trabalhado na sessão..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">{novaSessao.resumo.length}/1000 caracteres</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações Adicionais</label>
                  <textarea
                    value={novaSessao.observacoes}
                    onChange={(e) => setNovaSessao((prev: any) => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre evolução, próximos passos..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">{novaSessao.observacoes.length}/500 caracteres</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={editingSessao ? handleUpdateSessao : handleAddSessao}
                    disabled={isLoading || !novaSessao.resumo.trim()}
                    className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                      editingSessao
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? 'Salvando...' : editingSessao ? 'Salvar Alteracoes' : 'Registrar Sessao'}
                  </button>
                  {editingSessao && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
  );
};
