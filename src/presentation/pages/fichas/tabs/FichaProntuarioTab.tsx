import React from 'react';
import { generateProntuarioPDF, generateProntuarioWord } from '../../../utils/prontuarioExport';
import type { FichaTabProps } from './types';
export const FichaProntuarioTab: React.FC<FichaTabProps> = (props) => {
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
              {/* Botões de Download */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => generateProntuarioPDF(ficha)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                >
                  <span>📄</span> Baixar PDF
                </button>
                <button
                  onClick={() => generateProntuarioWord(ficha)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <span>📝</span> Baixar Word
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registro do Prontuário</h3>
                {ficha.observacoes ? (
                  <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{ficha.observacoes}</pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum registro no prontuário ainda.</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Adicionar Registro ao Prontuário</h4>
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Registre suas observações sobre o acompanhamento do paciente..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{novoComentario.length}/1000 caracteres</p>
                  <button
                    onClick={handleAddComentario}
                    disabled={isLoading || !novoComentario.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Adicionar ao Prontuário'}
                  </button>
                </div>
              </div>
            </div>
  );
};
