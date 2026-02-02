// Domain Entity - Leader
// Represents a church leader or pastoral team member

export enum LeaderRole {
  Pastor = 'pastor',
  Auxiliar = 'auxiliar',
  Diacono = 'diacono',
  Lider = 'lider',
  Coordenador = 'coordenador',
  Missionario = 'missionario',
  Evangelista = 'evangelista',
  Outro = 'outro'
}

export enum LeaderStatus {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Afastado = 'afastado'
}

export interface Leader {
  id: string;
  nome: string;
  cargo: LeaderRole;
  cargoPersonalizado?: string;
  ministerio?: string;
  bio?: string;
  foto?: string;
  email?: string;
  telefone?: string;
  ordem: number;
  status: LeaderStatus;
  dataCadastro: Date;
  dataAtualizacao: Date;
  criadoPor: string;
}

export const LEADER_ROLE_LABELS: Record<LeaderRole, string> = {
  [LeaderRole.Pastor]: 'Pastor',
  [LeaderRole.Auxiliar]: 'Pastor Auxiliar',
  [LeaderRole.Diacono]: 'Diácono',
  [LeaderRole.Lider]: 'Líder',
  [LeaderRole.Coordenador]: 'Coordenador',
  [LeaderRole.Missionario]: 'Missionário',
  [LeaderRole.Evangelista]: 'Evangelista',
  [LeaderRole.Outro]: 'Outro'
};

export const LEADER_STATUS_LABELS: Record<LeaderStatus, string> = {
  [LeaderStatus.Ativo]: 'Ativo',
  [LeaderStatus.Inativo]: 'Inativo',
  [LeaderStatus.Afastado]: 'Afastado'
};
