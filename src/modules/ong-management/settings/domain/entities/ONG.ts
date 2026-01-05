// Domain Entity - ONG (Non-Governmental Organization)

export interface ONGInfo {
  id: string;
  nome: string;
  descricao: string;
  logo?: string;
  missao?: string;
  visao?: string;
  valores?: string[];
  endereco: EnderecoONG;
  contato: ContatoONG;
  redesSociais?: RedesSociais;
  dataCriacao: Date;
  cnpj?: string;
  registroONG?: string;
  areasAtuacao: string[];
  updatedAt: Date;
  updatedBy: string;
}

export interface EnderecoONG {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
}

export interface ContatoONG {
  telefone: string;
  telefone2?: string;
  email: string;
  emailContato?: string;
  website?: string;
}

export interface RedesSociais {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
}

// Volunteer Management
export interface Voluntario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: Date;
  endereco: EnderecoVoluntario;
  habilidades: string[];
  areasInteresse: string[];
  disponibilidade: DisponibilidadeVoluntario[];
  horasSemanaisDisponivel: number;
  status: StatusVoluntario;
  dataInicio: Date;
  dataFim?: Date;
  observacoes?: string;
  documentos?: DocumentoVoluntario[];
  emergencia: ContatoEmergencia;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EnderecoVoluntario {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface DisponibilidadeVoluntario {
  diaSemana: number; // 0-6 (domingo-sábado)
  horaInicio: string; // "09:00"
  horaFim: string; // "12:00"
}

export interface DocumentoVoluntario {
  tipo: TipoDocumento;
  numero?: string;
  arquivo?: string;
  dataEmissao?: Date;
  dataValidade?: Date;
}

export enum TipoDocumento {
  RG = 'rg',
  CPF = 'cpf',
  ComprovanteResidencia = 'comprovante_residencia',
  AtestadoMedico = 'atestado_medico',
  CertidaoNascimento = 'certidao_nascimento',
  Outro = 'outro'
}

export interface ContatoEmergencia {
  nome: string;
  parentesco: string;
  telefone: string;
  telefone2?: string;
}

export enum StatusVoluntario {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Afastado = 'afastado',
  Desligado = 'desligado',
  Pendente = 'pendente'
}

// Activity Management
export interface AtividadeONG {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoAtividade;
  dataInicio: Date;
  dataFim: Date;
  horaInicio: string;
  horaFim: string;
  local: string;
  responsavel: string;
  voluntariosNecessarios: number;
  voluntariosConfirmados: string[]; // IDs dos voluntários
  beneficiarios: number;
  status: StatusAtividade;
  recursos?: RecursoAtividade[];
  observacoes?: string;
  fotos?: string[];
  relatorio?: RelatorioAtividade;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum TipoAtividade {
  Educacional = 'educacional',
  Saude = 'saude',
  Alimentacao = 'alimentacao',
  Cultura = 'cultura',
  Esporte = 'esporte',
  MeioAmbiente = 'meio_ambiente',
  AssistenciaSocial = 'assistencia_social',
  Administrativo = 'administrativo',
  Arrecadacao = 'arrecadacao',
  Evento = 'evento',
  Outro = 'outro'
}

export enum StatusAtividade {
  Planejada = 'planejada',
  EmAndamento = 'em_andamento',
  Concluida = 'concluida',
  Cancelada = 'cancelada',
  Adiada = 'adiada'
}

export interface RecursoAtividade {
  tipo: string;
  descricao: string;
  quantidade: number;
  valor?: number;
  doador?: string;
}

export interface RelatorioAtividade {
  voluntariosPresentes: string[];
  horasRealizadas: number;
  beneficiariosAtendidos: number;
  resultados: string;
  desafios?: string;
  proximosPassos?: string;
  gastosRealizados?: number;
  fotoRelatorio?: string[];
}

// Donation Management
export interface DoacaoONG {
  id: string;
  tipo: TipoDoacao;
  doador: DoadorInfo;
  valor?: number;
  descricao?: string;
  itens?: ItemDoacao[];
  dataDoacao: Date;
  dataRecebimento?: Date;
  formaPagamento?: FormaPagamento;
  comprovante?: string;
  destinacao?: string;
  projeto?: string;
  status: StatusDoacao;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum TipoDoacao {
  Dinheiro = 'dinheiro',
  Alimentos = 'alimentos',
  Roupas = 'roupas',
  Brinquedos = 'brinquedos',
  MaterialEscolar = 'material_escolar',
  MaterialLimpeza = 'material_limpeza',
  Medicamentos = 'medicamentos',
  Equipamentos = 'equipamentos',
  Servicos = 'servicos',
  Outro = 'outro'
}

export interface DoadorInfo {
  tipo: TipoDoador;
  nome: string;
  documento?: string; // CPF ou CNPJ
  email?: string;
  telefone?: string;
  endereco?: string;
  isAnonimo: boolean;
  isRecorrente?: boolean;
}

export enum TipoDoador {
  PessoaFisica = 'pessoa_fisica',
  PessoaJuridica = 'pessoa_juridica',
  Anonimo = 'anonimo'
}

export interface ItemDoacao {
  descricao: string;
  quantidade: number;
  unidade: string;
  valorEstimado?: number;
}

export enum FormaPagamento {
  Dinheiro = 'dinheiro',
  Pix = 'pix',
  Transferencia = 'transferencia',
  Boleto = 'boleto',
  Cartao = 'cartao',
  Cheque = 'cheque',
  Outro = 'outro'
}

export enum StatusDoacao {
  Prometida = 'prometida',
  Recebida = 'recebida',
  Utilizada = 'utilizada',
  Cancelada = 'cancelada'
}

// Report Types
export interface RelatorioVoluntarios {
  periodo: PeriodoRelatorio;
  totalVoluntarios: number;
  voluntariosAtivos: number;
  voluntariosInativos: number;
  novasAdesoes: number;
  desligamentos: number;
  horasTotais: number;
  horasMediaPorVoluntario: number;
  topVoluntarios: VoluntarioHoras[];
  distribuicaoPorArea: { area: string; quantidade: number }[];
  distribuicaoPorIdade: { faixa: string; quantidade: number }[];
}

export interface VoluntarioHoras {
  voluntarioId: string;
  nome: string;
  horasTrabalhadas: number;
  atividadesParticipadas: number;
}

export interface RelatorioAtividades {
  periodo: PeriodoRelatorio;
  totalAtividades: number;
  atividadesConcluidas: number;
  atividadesCanceladas: number;
  beneficiariosAtendidos: number;
  voluntariosEnvolvidos: number;
  horasTotaisVoluntariado: number;
  distribuicaoPorTipo: { tipo: string; quantidade: number }[];
  atividadesMaisParticipadas: AtividadeResumo[];
}

export interface AtividadeResumo {
  atividadeId: string;
  nome: string;
  tipo: string;
  participantes: number;
  beneficiarios: number;
  horasRealizadas: number;
}

export interface RelatorioFinanceiro {
  periodo: PeriodoRelatorio;
  totalArrecadado: number;
  totalDoacoesDinheiro: number;
  totalDoacoesBens: number;
  numeroDoadores: number;
  ticketMedio: number;
  distribuicaoPorTipo: { tipo: string; valor: number }[];
  maioresDoadores: { nome: string; valor: number }[];
  evolucaoMensal: { mes: string; valor: number }[];
}

export interface PeriodoRelatorio {
  dataInicio: Date;
  dataFim: Date;
  tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'customizado';
}

// Utility functions
export class ONGEntity {
  static calcularHorasVoluntario(
    voluntarioId: string,
    atividades: AtividadeONG[],
    periodo: PeriodoRelatorio
  ): number {
    return atividades
      .filter(a => 
        a.voluntariosConfirmados.includes(voluntarioId) &&
        a.dataInicio >= periodo.dataInicio &&
        a.dataFim <= periodo.dataFim &&
        a.status === StatusAtividade.Concluida
      )
      .reduce((total, atividade) => {
        const horas = this.calcularDuracaoAtividade(atividade);
        return total + horas;
      }, 0);
  }

  static calcularDuracaoAtividade(atividade: AtividadeONG): number {
    const [horaInicio, minutoInicio] = atividade.horaInicio.split(':').map(Number);
    const [horaFim, minutoFim] = atividade.horaFim.split(':').map(Number);
    
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;
    
    return (minutosFim - minutosInicio) / 60;
  }

  static calcularHorasMensais(
    atividades: AtividadeONG[],
    mes: number,
    ano: number
  ): number {
    return atividades
      .filter(a => {
        const data = new Date(a.dataInicio);
        return data.getMonth() === mes && 
               data.getFullYear() === ano &&
               a.status === StatusAtividade.Concluida;
      })
      .reduce((total, atividade) => {
        const horas = this.calcularDuracaoAtividade(atividade);
        const voluntarios = atividade.relatorio?.voluntariosPresentes.length || 0;
        return total + (horas * voluntarios);
      }, 0);
  }

  static validarCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Validação básica de CPF
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  }

  static validarCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;
    
    // Validação básica de CNPJ
    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  }

  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  static formatarTelefone(telefone: string): string {
    const clean = telefone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return telefone;
  }

  static formatarCPF(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return cpf;
  }

  static formatarCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
    }
    return cnpj;
  }
}
