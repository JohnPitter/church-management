import React from 'react';
import {
  FichaAcompanhamento,
  SessaoAcompanhamento,
} from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import { generateProntuarioPDF, generateProntuarioWord } from '../../../utils/prontuarioExport';

import type { FichaTabProps } from './types';

export const FichaDetalhesTab: React.FC<FichaTabProps> = (props) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Paciente</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nome:</span>
                      <span className="ml-2 text-gray-900">{ficha.pacienteNome}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className="ml-2 text-gray-900 capitalize">{ficha.tipoAssistencia}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Data Início:</span>
                      <span className="ml-2 text-gray-900">{new Date(ficha.dataInicio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        (ficha.status === 'em_tratamento' || (ficha.status as string) === 'ativo') ? 'bg-green-100 text-green-800' :
                        (ficha.status === 'alta' || (ficha.status as string) === 'concluido') ? 'bg-blue-100 text-blue-800' :
                        ficha.status === 'pausado' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {(ficha.status === 'em_tratamento' || (ficha.status as string) === 'ativo') ? 'Em Tratamento' :
                         (ficha.status === 'alta' || (ficha.status as string) === 'concluido') ? 'Alta' :
                         ficha.status === 'pausado' ? 'Pausado' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetivo & Diagnóstico</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700 block">Objetivo:</span>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded mt-1">{ficha.objetivo || 'Não informado'}</p>
                    </div>
                    {ficha.diagnosticoInicial && (
                      <div>
                        <span className="font-medium text-gray-700 block">Diagnóstico Inicial:</span>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded mt-1">{ficha.diagnosticoInicial}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {ficha.contatoEmergencia && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato de Emergência</h3>
                  <div className="bg-red-50 p-4 rounded">
                    <p><span className="font-medium">Nome:</span> {ficha.contatoEmergencia.nome}</p>
                    <p><span className="font-medium">Parentesco:</span> {ficha.contatoEmergencia.parentesco}</p>
                    <p><span className="font-medium">Telefone:</span> {ficha.contatoEmergencia.telefone}</p>
                  </div>
                </div>
              )}

            </div>
  );
};
