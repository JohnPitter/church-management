import type { Dispatch, SetStateAction } from 'react';
import type {
  FichaAcompanhamento,
  SessaoAcompanhamento,
} from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';

export type FichaTabProps = {
  ficha: FichaAcompanhamento;
  sessoes: SessaoAcompanhamento[];
  novaSessao: {
    tipoSessao: 'individual' | string;
    status: 'concluida' | 'nao_realizada';
    duracao: number;
    resumo: string;
    observacoes: string;
    evolucao: string;
  };
  setNovaSessao: Dispatch<SetStateAction<any>>;
  editingSessao: SessaoAcompanhamento | null;
  isLoading: boolean;
  novoComentario: string;
  setNovoComentario: (v: string) => void;
  editandoDadosEspecializados: boolean;
  setEditandoDadosEspecializados: (v: boolean) => void;
  dadosEspecializadosForm: any;
  setDadosEspecializadosForm: Dispatch<SetStateAction<any>>;
  validationErrors: Record<string, string>;
  isFormValid: boolean;
  handleAddComentario: () => void | Promise<void>;
  handleAddSessao: () => void | Promise<void>;
  handleEditSessao: (s: SessaoAcompanhamento) => void;
  handleCancelEdit: () => void;
  handleSaveDadosEspecializados: () => void | Promise<void>;
  handleCancelEditDadosEspecializados: () => void;
  handleFieldChange: (type: string, field: string, value: any) => void;
  handleUpdateSessao: () => void | Promise<void>;
  hasError: (fieldPath: string) => boolean;
  getInputClassName: (fieldPath: string, baseClassName?: string) => string;
  [key: string]: any;
};
