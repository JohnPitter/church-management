// Domain Entity - Assistência (Assistance Services)
// Comprehensive assistance system for church social services

export enum TipoAssistencia {
  Psicologica = 'psicologica',
  Social = 'social',
  Juridica = 'juridica',
  Medica = 'medica',
  Fisioterapia = 'fisioterapia',
  Nutricao = 'nutricao'
}

export enum StatusAgendamento {
  Agendado = 'agendado',
  Confirmado = 'confirmado',
  EmAndamento = 'em_andamento',
  Concluido = 'concluido',
  Cancelado = 'cancelado',
  Remarcado = 'remarcado',
  Faltou = 'faltou'
}

export enum StatusProfissional {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Licença = 'licenca',
  Suspenso = 'suspenso'
}

export enum ModalidadeAtendimento {
  Presencial = 'presencial',
  Online = 'online',
  Domiciliar = 'domiciliar',
  Telefonico = 'telefonico'
}

export enum PrioridadeAtendimento {
  Baixa = 'baixa',
  Normal = 'normal',
  Alta = 'alta',
  Urgente = 'urgente',
  Emergencial = 'emergencial'
}

export interface EnderecoConsultorio {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  referencia?: string;
}

export interface HorarioFuncionamento {
  diaSemana: number; // 0-6 (domingo a sábado)
  horaInicio: string; // HH:MM
  horaFim: string; // HH:MM
  intervalos?: Array<{
    inicio: string;
    fim: string;
  }>;
}

export interface ProfissionalAssistencia {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  telefone: string;
  email: string;
  endereco: EnderecoConsultorio;
  especialidade: TipoAssistencia;
  subespecialidades?: string[];
  registroProfissional: string; // CRP, CRAS, OAB, CRM
  status: StatusProfissional;
  dataCadastro: Date;
  dataInativacao?: Date;
  motivoInativacao?: string;
  horariosFuncionamento: HorarioFuncionamento[];
  valorConsulta?: number;
  tempoConsulta: number; // em minutos
  observacoes?: string;
  modalidadesAtendimento: ModalidadeAtendimento[];
  linkConsultaOnline?: string;
  documentos: DocumentoProfissional[];
  avaliacoes: AvaliacaoServico[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  userId?: string; // Firebase Auth user ID when professional has account
}

export interface DocumentoProfissional {
  id: string;
  tipo: 'diploma' | 'registro_profissional' | 'especializacao' | 'outros';
  nome: string;
  numeroDocumento?: string;
  dataEmissao?: Date;
  dataVencimento?: Date;
  orgaoEmissor?: string;
  arquivoUrl?: string;
  verificado: boolean;
  dataVerificacao?: Date;
  verificadoPor?: string;
}

export interface AgendamentoAssistencia {
  id: string;
  pacienteId: string; // Referência ao membro ou assistido
  pacienteNome: string;
  pacienteTelefone: string;
  pacienteEmail?: string;
  profissionalId: string;
  profissionalNome: string;
  tipoAssistencia: TipoAssistencia;
  dataHoraAgendamento: Date;
  dataHoraFim: Date;
  modalidade: ModalidadeAtendimento;
  prioridade: PrioridadeAtendimento;
  status: StatusAgendamento;
  motivo: string;
  observacoesPaciente?: string;
  observacoesProfissional?: string;
  diagnosticoInicial?: string;
  encaminhamento?: string;
  proximoRetorno?: Date;
  valor?: number;
  desconto?: number;
  valorFinal?: number;
  formaPagamento?: string;
  linkConsulta?: string; // Para atendimentos online
  enderecoAtendimento?: EnderecoConsultorio; // Para atendimentos domiciliares
  anexos: AnexoConsulta[];
  historico: HistoricoAgendamento[];
  avaliacaoServico?: AvaliacaoServico;
  dadosEspecificos?: Record<string, any>; // Dados específicos por tipo de assistência
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AnexoConsulta {
  id: string;
  nome: string;
  tipo: 'receita' | 'exame' | 'laudo' | 'relatorio' | 'documento' | 'outros';
  arquivoUrl: string;
  tamanhoArquivo: number;
  dataUpload: Date;
  uploadedBy: string;
  descricao?: string;
}

export interface HistoricoAgendamento {
  id: string;
  dataHora: Date;
  acao: 'criado' | 'confirmado' | 'remarcado' | 'cancelado' | 'iniciado' | 'concluido';
  statusAnterior?: StatusAgendamento;
  statusNovo: StatusAgendamento;
  observacoes?: string;
  responsavel: string;
}

export interface AvaliacaoServico {
  id: string;
  nota: number; // 1-5
  comentario?: string;
  aspectos: {
    pontualidade: number;
    atendimento: number;
    profissionalismo: number;
    efetividade: number;
    instalacoes?: number;
  };
  dataAvaliacao: Date;
  avaliadoPor: string;
  recomendaria: boolean;
}

export interface RelatorioAssistencia {
  id: string;
  agendamentoId: string;
  tipoRelatorio: 'consulta' | 'sessao' | 'orientacao' | 'encaminhamento';
  conteudo: string;
  conclusoes?: string;
  recomendacoes?: string;
  proximosPassos?: string;
  anexos: string[];
  assinaturaProfissional: string;
  dataRelatorio: Date;
  createdBy: string;
}

export interface EstatisticasAssistencia {
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosSemana: number;
  agendamentosMes: number;
  porTipo: Record<TipoAssistencia, number>;
  porStatus: Record<StatusAgendamento, number>;
  porProfissional: Record<string, number>;
  porModalidade: Record<ModalidadeAtendimento, number>;
  taxaConclusao: number;
  tempoMedioConsulta: number;
  avaliacaoMedia: number;
  crescimentoMensal: Array<{
    mes: string;
    total: number;
    tipo: Record<TipoAssistencia, number>;
  }>;
}

// Business Logic Entity
export class AssistenciaEntity {
  static formatarTipoAssistencia(tipo: TipoAssistencia): string {
    const tipos: Record<TipoAssistencia, string> = {
      [TipoAssistencia.Psicologica]: 'Assistência Psicológica',
      [TipoAssistencia.Social]: 'Assistência Social',
      [TipoAssistencia.Juridica]: 'Assistência Jurídica',
      [TipoAssistencia.Medica]: 'Assistência Médica',
      [TipoAssistencia.Fisioterapia]: 'Assistência Fisioterapêutica',
      [TipoAssistencia.Nutricao]: 'Assistência Nutricional'
    };
    return tipos[tipo];
  }

  static formatarStatusAgendamento(status: StatusAgendamento): string {
    const statuses: Record<StatusAgendamento, string> = {
      [StatusAgendamento.Agendado]: 'Agendado',
      [StatusAgendamento.Confirmado]: 'Confirmado',
      [StatusAgendamento.EmAndamento]: 'Em Andamento',
      [StatusAgendamento.Concluido]: 'Concluído',
      [StatusAgendamento.Cancelado]: 'Cancelado',
      [StatusAgendamento.Remarcado]: 'Remarcado',
      [StatusAgendamento.Faltou]: 'Paciente Faltou'
    };
    return statuses[status];
  }

  static formatarModalidadeAtendimento(modalidade: ModalidadeAtendimento): string {
    const modalidades: Record<ModalidadeAtendimento, string> = {
      [ModalidadeAtendimento.Presencial]: 'Presencial',
      [ModalidadeAtendimento.Online]: 'Online',
      [ModalidadeAtendimento.Domiciliar]: 'Domiciliar',
      [ModalidadeAtendimento.Telefonico]: 'Telefônico'
    };
    return modalidades[modalidade];
  }

  static formatarPrioridade(prioridade: PrioridadeAtendimento): string {
    const prioridades: Record<PrioridadeAtendimento, string> = {
      [PrioridadeAtendimento.Baixa]: 'Baixa',
      [PrioridadeAtendimento.Normal]: 'Normal',
      [PrioridadeAtendimento.Alta]: 'Alta',
      [PrioridadeAtendimento.Urgente]: 'Urgente',
      [PrioridadeAtendimento.Emergencial]: 'Emergencial'
    };
    return prioridades[prioridade];
  }

  static calcularIdadePaciente(dataNascimento: Date): number {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = dataNascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  static calcularDuracaoConsulta(inicio: Date, fim: Date): number {
    return Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60)); // em minutos
  }

  static formatarTelefone(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    return telefone;
  }

  static formatarCPF(cpf: string): string {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
    }
    return cpf;
  }

  static formatarCEP(cep: string): string {
    const numeros = cep.replace(/\D/g, '');
    if (numeros.length === 8) {
      return `${numeros.substring(0, 5)}-${numeros.substring(5)}`;
    }
    return cep;
  }

  static validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validarTelefone(telefone: string): boolean {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 11;
  }

  static validarCPF(cpf: string): boolean {
    const numeros = cpf.replace(/\D/g, '');
    
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numeros.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto < 2 ? 0 : resto;
    
    if (parseInt(numeros.charAt(9)) !== digito1) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numeros.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto < 2 ? 0 : resto;
    
    return parseInt(numeros.charAt(10)) === digito2;
  }

  static obterProximosHorariosDisponiveis(
    profissional: ProfissionalAssistencia, 
    dataInicio: Date, 
    dataFim: Date,
    agendamentosExistentes: AgendamentoAssistencia[]
  ): Date[] {
    const horariosDisponiveis: Date[] = [];
    const duracaoConsulta = profissional.tempoConsulta;
    
    if (!duracaoConsulta || duracaoConsulta <= 0) {
      console.warn('Professional has invalid consultation duration:', duracaoConsulta);
      return [];
    }
    
    const dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      const diaSemana = dataAtual.getDay();
      
      const horariosDia = profissional.horariosFuncionamento.filter(h => h.diaSemana === diaSemana);
      
      for (const horario of horariosDia) {
        const [horaInicio, minutoInicio] = horario.horaInicio.split(':').map(Number);
        const [horaFim, minutoFim] = horario.horaFim.split(':').map(Number);
        
        const inicioAtendimento = new Date(dataAtual);
        inicioAtendimento.setHours(horaInicio, minutoInicio, 0, 0);
        
        const fimAtendimento = new Date(dataAtual);
        fimAtendimento.setHours(horaFim, minutoFim, 0, 0);
        
        let horaConsulta = new Date(inicioAtendimento);
        while (horaConsulta < fimAtendimento) {
          const fimConsulta = new Date(horaConsulta.getTime() + duracaoConsulta * 60000);

          // Captura o valor atual para evitar referência unsafe no closure
          const horaConsultaAtual = new Date(horaConsulta);

          // Verificar se não há conflito com agendamentos existentes
          const temConflito = agendamentosExistentes.some(agendamento => {
            const inicioExistente = new Date(agendamento.dataHoraAgendamento);
            const fimExistente = new Date(agendamento.dataHoraFim);

            return (horaConsultaAtual < fimExistente && fimConsulta > inicioExistente);
          });
          
          if (!temConflito && fimConsulta <= fimAtendimento) {
            horariosDisponiveis.push(new Date(horaConsulta));
          }
          
          horaConsulta = new Date(horaConsulta.getTime() + duracaoConsulta * 60000);
        }
      }
      
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    return horariosDisponiveis;
  }

  static calcularValorFinalConsulta(valor: number, desconto: number = 0): number {
    return valor - desconto;
  }

  static gerarCodigoAgendamento(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `ASS-${timestamp.slice(-6)}-${random.toUpperCase()}`;
  }
}