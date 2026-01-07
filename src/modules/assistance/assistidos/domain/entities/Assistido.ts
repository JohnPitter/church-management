// Domain Entity - Assistido
// Represents people assisted by the church with business rules

export interface Assistido {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento: Date;
  telefone: string;
  email?: string;
  endereco: EnderecoAssistido;
  situacaoFamiliar: SituacaoFamiliar;
  rendaFamiliar?: number;
  profissao?: string;
  escolaridade: Escolaridade;
  necessidades: NecessidadeAssistido[];
  // Novos campos de moradia e benefícios
  tipoMoradia: TipoMoradia;
  quantidadeComodos: number;
  possuiCadUnico: boolean;
  qualBeneficio?: string;
  observacoes?: string;
  status: StatusAssistido;
  dataInicioAtendimento: Date;
  dataUltimoAtendimento?: Date;
  responsavelAtendimento: string;
  familiares: FamiliarAssistido[];
  atendimentos: AtendimentoAssistido[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EnderecoAssistido {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface FamiliarAssistido {
  id: string;
  nome: string;
  parentesco: TipoParentesco;
  dataNascimento?: Date;
  cpf?: string;
  telefone?: string;
  profissao?: string;
  renda?: number;
}

export interface AtendimentoAssistido {
  id: string;
  data: Date;
  tipo: TipoAtendimento;
  descricao: string;
  itensDoados?: ItemDoacao[];
  valorDoacao?: number;
  proximoRetorno?: Date;
  responsavel: string;
  observacoes?: string;
}

export interface ItemDoacao {
  item: string;
  quantidade: number;
  unidade: string;
  valor?: number;
}

export enum StatusAssistido {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Suspenso = 'suspenso',
  Transferido = 'transferido'
}

export enum SituacaoFamiliar {
  Solteiro = 'solteiro',
  Casado = 'casado',
  Divorciado = 'divorciado',
  Viuvo = 'viuvo',
  UniaoEstavel = 'uniao_estavel'
}

export enum Escolaridade {
  Analfabeto = 'analfabeto',
  FundamentalIncompleto = 'fundamental_incompleto',
  FundamentalCompleto = 'fundamental_completo',
  MedioIncompleto = 'medio_incompleto',
  MedioCompleto = 'medio_completo',
  SuperiorIncompleto = 'superior_incompleto',
  SuperiorCompleto = 'superior_completo',
  PosGraduacao = 'pos_graduacao'
}

export enum NecessidadeAssistido {
  Alimentacao = 'alimentacao',
  Medicamento = 'medicamento',
  Vestuario = 'vestuario',
  Moradia = 'moradia',
  Emprego = 'emprego',
  Educacao = 'educacao',
  Saude = 'saude',
  Transporte = 'transporte',
  Documentacao = 'documentacao',
  Juridico = 'juridico',
  Psicologico = 'psicologico',
  Espiritual = 'espiritual',
  Outros = 'outros'
}

export enum TipoMoradia {
  Alugada = 'alugada',
  Propria = 'propria'
}

export enum TipoParentesco {
  Pai = 'pai',
  Mae = 'mae',
  Filho = 'filho',
  Filha = 'filha',
  Esposo = 'esposo',
  Esposa = 'esposa',
  Irmao = 'irmao',
  Irma = 'irma',
  Avo = 'avo',
  Avoa = 'avoa',
  Neto = 'neto',
  Neta = 'neta',
  Tio = 'tio',
  Tia = 'tia',
  Primo = 'primo',
  Prima = 'prima',
  Outro = 'outro'
}

export enum TipoAtendimento {
  CestaBasica = 'cesta_basica',
  Donativos = 'donativos',
  Medicamento = 'medicamento',
  Vestuario = 'vestuario',
  Orientacao = 'orientacao',
  EncaminhamentoMedico = 'encaminhamento_medico',
  EncaminhamentoJuridico = 'encaminhamento_juridico',
  AconselhamentoEspiritual = 'aconselhamento_espiritual',
  AuxilioFinanceiro = 'auxilio_financeiro',
  Documentacao = 'documentacao',
  Outro = 'outro'
}

// Business Rules
export class AssistidoEntity {
  static isAtivo(assistido: Assistido): boolean {
    return assistido.status === StatusAssistido.Ativo;
  }

  static podeReceberAtendimento(assistido: Assistido): boolean {
    return assistido.status === StatusAssistido.Ativo;
  }

  static calcularIdade(dataNascimento: Date): number {
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAniversario = hoje.getMonth() - dataNascimento.getMonth();
    
    if (mesAniversario < 0 || (mesAniversario === 0 && hoje.getDate() < dataNascimento.getDate())) {
      return idade - 1;
    }
    
    return idade;
  }

  static calcularRendaPerCapita(assistido: Assistido): number {
    if (!assistido.rendaFamiliar) return 0;
    
    const totalPessoas = assistido.familiares.length + 1; // +1 para o próprio assistido
    return assistido.rendaFamiliar / totalPessoas;
  }

  static temNecessidade(assistido: Assistido, necessidade: NecessidadeAssistido): boolean {
    return assistido.necessidades.includes(necessidade);
  }

  static diasDesdeUltimoAtendimento(assistido: Assistido): number | null {
    if (!assistido.dataUltimoAtendimento) return null;
    
    const hoje = new Date();
    const diferenca = hoje.getTime() - assistido.dataUltimoAtendimento.getTime();
    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  }

  static precisaRetorno(assistido: Assistido): boolean {
    const ultimoAtendimento = assistido.atendimentos
      .sort((a, b) => b.data.getTime() - a.data.getTime())[0];
    
    if (!ultimoAtendimento || !ultimoAtendimento.proximoRetorno) return false;
    
    return new Date() >= ultimoAtendimento.proximoRetorno;
  }

  static getStatusColor(status: StatusAssistido): string {
    const colors: Record<StatusAssistido, string> = {
      [StatusAssistido.Ativo]: 'green',
      [StatusAssistido.Inativo]: 'gray',
      [StatusAssistido.Suspenso]: 'yellow',
      [StatusAssistido.Transferido]: 'blue'
    };
    return colors[status];
  }

  static formatarNecessidades(necessidades: NecessidadeAssistido[]): string[] {
    const labels: Record<NecessidadeAssistido, string> = {
      [NecessidadeAssistido.Alimentacao]: 'Alimentação',
      [NecessidadeAssistido.Medicamento]: 'Medicamento',
      [NecessidadeAssistido.Vestuario]: 'Vestuário',
      [NecessidadeAssistido.Moradia]: 'Moradia',
      [NecessidadeAssistido.Emprego]: 'Emprego',
      [NecessidadeAssistido.Educacao]: 'Educação',
      [NecessidadeAssistido.Saude]: 'Saúde',
      [NecessidadeAssistido.Transporte]: 'Transporte',
      [NecessidadeAssistido.Documentacao]: 'Documentação',
      [NecessidadeAssistido.Juridico]: 'Jurídico',
      [NecessidadeAssistido.Psicologico]: 'Psicológico',
      [NecessidadeAssistido.Espiritual]: 'Espiritual',
      [NecessidadeAssistido.Outros]: 'Outros'
    };

    return necessidades.map(n => labels[n]);
  }

  static validarCPF(cpf: string): boolean {
    if (!cpf) return true; // CPF é opcional
    
    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  static validarTelefone(telefone: string): boolean {
    if (!telefone) return false;
    
    const cleanPhone = telefone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  static formatarTelefone(telefone: string): string {
    const clean = telefone.replace(/[^\d]/g, '');
    
    if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  }

  static formatarCPF(cpf: string): string {
    const clean = cpf.replace(/[^\d]/g, '');
    
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return cpf;
  }

  // Validações para novos campos
  static validarQuantidadeComodos(quantidade: number): boolean {
    return quantidade > 0 && quantidade <= 20 && Number.isInteger(quantidade);
  }

  static validarNome(nome: string): boolean {
    return !!(nome && nome.trim().length >= 2 && nome.trim().length <= 100);
  }

  static validarDataNascimento(data: Date): boolean {
    const hoje = new Date();
    const anoNascimento = data.getFullYear();
    const anoAtual = hoje.getFullYear();
    
    // Pessoa deve ter entre 0 e 150 anos
    return anoNascimento <= anoAtual && anoNascimento >= (anoAtual - 150);
  }

  static validarEndereco(endereco: EnderecoAssistido): string[] {
    const erros: string[] = [];
    
    if (!endereco.logradouro || endereco.logradouro.trim().length < 3) {
      erros.push('Logradouro deve ter pelo menos 3 caracteres');
    }
    
    if (!endereco.numero || endereco.numero.trim().length === 0) {
      erros.push('Número é obrigatório');
    }
    
    if (!endereco.bairro || endereco.bairro.trim().length < 2) {
      erros.push('Bairro deve ter pelo menos 2 caracteres');
    }
    
    if (!endereco.cidade || endereco.cidade.trim().length < 2) {
      erros.push('Cidade deve ter pelo menos 2 caracteres');
    }
    
    if (!endereco.estado || endereco.estado.trim().length !== 2) {
      erros.push('Estado deve ter 2 caracteres (ex: SP)');
    }
    
    if (!endereco.cep || !/^\d{5}-?\d{3}$/.test(endereco.cep.replace(/[^\d]/g, ''))) {
      erros.push('CEP deve ter o formato 00000-000');
    }
    
    return erros;
  }

  static validarEmail(email?: string): boolean {
    if (!email) return true; // Email é opcional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validarRendaFamiliar(renda?: number): boolean {
    if (renda === undefined || renda === null) return true; // Renda é opcional
    return renda >= 0 && renda <= 999999;
  }

  static validarAssistido(assistido: Partial<Assistido>): string[] {
    const erros: string[] = [];
    
    // Validações obrigatórias
    if (!assistido.nome || !this.validarNome(assistido.nome)) {
      erros.push('Nome é obrigatório e deve ter entre 2 e 100 caracteres');
    }
    
    if (!assistido.dataNascimento || !this.validarDataNascimento(assistido.dataNascimento)) {
      erros.push('Data de nascimento é obrigatória e deve ser válida');
    }
    
    if (!assistido.telefone || !this.validarTelefone(assistido.telefone)) {
      erros.push('Telefone é obrigatório e deve ter formato válido');
    }
    
    if (assistido.cpf && !this.validarCPF(assistido.cpf)) {
      erros.push('CPF deve ter formato válido');
    }
    
    if (assistido.email && !this.validarEmail(assistido.email)) {
      erros.push('Email deve ter formato válido');
    }
    
    if (assistido.endereco) {
      const errosEndereco = this.validarEndereco(assistido.endereco);
      erros.push(...errosEndereco);
    } else {
      erros.push('Endereço é obrigatório');
    }
    
    if (assistido.rendaFamiliar !== undefined && !this.validarRendaFamiliar(assistido.rendaFamiliar)) {
      erros.push('Renda familiar deve ser um valor válido');
    }
    
    if (!assistido.situacaoFamiliar) {
      erros.push('Situação familiar é obrigatória');
    }
    
    if (!assistido.escolaridade) {
      erros.push('Escolaridade é obrigatória');
    }
    
    // Validações dos novos campos
    if (!assistido.tipoMoradia) {
      erros.push('Tipo de moradia é obrigatório');
    }
    
    if (assistido.quantidadeComodos === undefined || !this.validarQuantidadeComodos(assistido.quantidadeComodos)) {
      erros.push('Quantidade de cômodos é obrigatória e deve ser um número entre 1 e 20');
    }
    
    if (assistido.possuiCadUnico === undefined || assistido.possuiCadUnico === null) {
      erros.push('Informação sobre CadÚnico é obrigatória');
    }
    
    if (!assistido.necessidades || assistido.necessidades.length === 0) {
      erros.push('Pelo menos uma necessidade deve ser selecionada');
    }
    
    if (!assistido.responsavelAtendimento) {
      erros.push('Responsável pelo atendimento é obrigatório');
    }
    
    return erros;
  }

  static formatarTipoMoradia(tipo: TipoMoradia): string {
    const labels: Record<TipoMoradia, string> = {
      [TipoMoradia.Alugada]: 'Alugada',
      [TipoMoradia.Propria]: 'Própria'
    };
    return labels[tipo];
  }
}
