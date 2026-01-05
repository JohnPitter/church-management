// Domain Entity - Patient Record (Ficha de Acompanhamento)
// Represents a patient record for professional assistance tracking

export interface FichaAcompanhamento {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  tipoAssistencia: 'psicologica' | 'social' | 'juridica' | 'medica' | 'fisioterapia' | 'nutricao';
  dataInicio: Date;
  status: 'ativo' | 'concluido' | 'pausado' | 'cancelado';
  objetivo: string;
  diagnosticoInicial?: string;
  observacoes?: string;
  informacoesMedicas?: string;
  medicamentos?: string;
  alergias?: string;
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    parentesco: string;
  };
  // Dados especializados transferidos do agendamento
  dadosEspecializados?: {
    fisioterapia?: {
      // 1.0 Avaliação
      habitosVida?: string;
      hma?: string; // História Médica Atual
      hmp?: string; // História Médica Pregressa
      antecedentesPessoais?: string;
      antecedentesFamiliares?: string;
      tratamentosRealizados?: string;
      // 2.1 Apresentação do Paciente
      apresentacaoPaciente?: string[]; // ["Deambulando", "Com apoio/auxílio", "Cadeirante", "Acamado", "Orientado"]
      // 3.2-3.4 Exames, Medicamentos, Cirurgias
      examesComplementares?: string;
      medicamentos?: string;
      cirurgias?: string;
      // 3.5 Inspeção/Palpação
      inspecaoPalpacao?: string[]; // ["Normal", "Edema", "Cicatriz incompleta", "Eritema", "Outros"]
      // 3.6-3.8 Avaliação Física
      semiologia?: string;
      testesEspecificos?: string;
      escalaDor?: number; // 0-10 (EVA)
      // 4.0 Plano Terapêutico
      objetivosTratamento?: string;
      recursosTerapeuticos?: string;
      planoTratamento?: string;
    };
    psicologia?: {
      // Seção 1: Identificação
      profissao?: string;
      religiao?: string;
      estadoCivil?: string;
      filhos?: string;
      contatoTelefone?: string;
      contatoEmail?: string;
      contatoEndereco?: string;

      // Seção 2: História do Paciente
      desenvolvimentoPessoal?: string;
      puberdade?: string;
      historiaSexual?: string;
      habitos?: string;
      sintomasNeuroticos?: string;
      memoriasSignificativas?: string;
      naturalidade?: string;

      // História Familiar Detalhada
      historicoFamiliar?: string;
      maeDados?: string; // Dados completos da mãe
      paiDados?: string; // Dados completos do pai
      irmaosDados?: string; // Dados dos irmãos
      filhosDados?: string; // Dados dos filhos
      avosDados?: string; // Dados dos avós

      // Ambiente Familiar
      residenciaBairro?: string;
      historicoViolencia?: string;
      apoioFamiliar?: string;
      reacaoFamiliarSintomas?: string;

      // Seção 2: História Escolar
      formacaoAcademica?: string;
      experienciasEscolares?: string;
      situacoesConstrangedorasEscola?: string;
      perseguicaoEscola?: string;
      ambienteEscolar?: string;

      // História Profissional
      empresaAtual?: string;
      satisfacaoTrabalho?: string;
      situacoesImportantesTrabalho?: string;
      situacoesConstrangedorasTrabalho?: string;
      perseguicaoTrabalho?: string;
      ambienteTrabalho?: string;
      problemasTrabalho?: string;

      // Relacionamentos Interpessoais
      dificuldadeRelacionar?: string;
      numeroAmigos?: string;
      tipoPersonalidade?: string; // Introvertido/Extrovertido
      comportamentoSocial?: string;
      amizades?: string;

      // Relacionamento com Vizinhança
      tempoResidencia?: string;
      satisfacaoVizinhanca?: string;
      relacionamentoFamiliarAposSintomas?: string;

      // Seção 3: História Clínica
      medicamentosUso?: string;
      cirurgiasRealizadas?: string;
      puerperio?: string;
      doencaMentalFamiliar?: string;
      usoSubstanciasPaisMaes?: string;

      // Seção 4: História Psicológica
      sentimentos?: string[]; // Medo, Raiva, Revolta, Culpa, Ansiedade, Solidão, Angústia, Impotência, Alívio, Indiferença
      tratamentoPsicologicoAnterior?: string;
      tratamentoPsiquiatricoAnterior?: string;
      usoMedicamentosPsicotropicos?: string;
      usoSubstanciasPsicoativas?: string;

      // Seção 5: Queixas do Paciente
      queixaPrincipal?: string;
      queixaSecundaria?: string;
      expectativasSessao?: string;

      // Seção 6: Informações Complementares
      informacoesComplementares?: string;

      // Seção 7: Classificação do Paciente
      classificacao?: string; // VERMELHO (atenção crítica), AMARELO (estado de atenção), ROXO (baixa complexidade), VERDE (estado de equilíbrio)

      // Seção 8 e 9: Demandas
      demanda?: string;
      justificativaDemanda?: string;

      // Campos anteriores mantidos para compatibilidade
      historiaDoencaAtual?: string;
      historicoPsiquiatrico?: string;
      aspectosComportamentais?: string;
      relacionamentosInterpessoais?: string;
      aspectosCognitivos?: string;
      expectativasTratamento?: string;
    };
    nutricao?: {
      // Antropometria
      peso?: string;
      altura?: string;
      imc?: string;
      circunferenciaAbdominal?: string;
      circunferenciaCintura?: string;
      circunferenciaQuadril?: string;
      relacaoCinturaQuadril?: string;
      composicaoCorporal?: string;
      percentualGordura?: string;
      massaMuscular?: string;

      // História Alimentar
      habitosAlimentares?: string;
      frequenciaRefeicoes?: string;
      horarioRefeicoes?: string;
      preferenciasAlimentares?: string;
      aversoes?: string;
      restricoesAlimentares?: string;
      alergias?: string;
      intolerancias?: string;
      consumoAgua?: string;

      // História Clínica
      doencasPreexistentes?: string;
      medicamentosUso?: string;
      suplementacao?: string;
      cirurgiasRealizadas?: string;
      historicoFamiliarDoencas?: string;

      // Estilo de Vida
      atividadeFisica?: string;
      frequenciaExercicios?: string;
      qualidadeSono?: string;
      nivelEstresse?: string;
      tabagismo?: string;
      consumoAlcool?: string;

      // Dados Bioquímicos
      examesLaboratoriais?: string;
      glicemia?: string;
      colesterolTotal?: string;
      hdl?: string;
      ldl?: string;
      triglicerideos?: string;
      hemoglobina?: string;
      outrosExames?: string;

      // Avaliação Nutricional
      diagnosticoNutricional?: string;
      necessidadesEnergeticas?: string;
      necessidadesProteicas?: string;
      objetivos?: string;

      // Plano Alimentar
      orientacoesNutricionais?: string;
      planoAlimentar?: string;
      metasNutricionais?: string;
      acompanhamento?: string;

      // Campos anteriores mantidos para compatibilidade
      historicoAlimentar?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SessaoAcompanhamento {
  id: string;
  fichaId: string;
  numeroSessao: number;
  data: Date;
  duracao: number; // em minutos
  tipoSessao: 'individual' | 'grupo' | 'familiar' | 'avaliacao';
  resumo: string;
  observacoes?: string;
  evolucao?: string;
  proximasSessoes?: string;
  anexos?: string[]; // URLs dos arquivos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class FichaAcompanhamentoEntity {
  static create(data: Omit<FichaAcompanhamento, 'id' | 'createdAt' | 'updatedAt'>): FichaAcompanhamento {
    const now = new Date();
    return {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
  }

  static createSessao(data: Omit<SessaoAcompanhamento, 'id' | 'createdAt' | 'updatedAt'>): SessaoAcompanhamento {
    const now = new Date();
    return {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
  }

  static update(ficha: FichaAcompanhamento, updates: Partial<FichaAcompanhamento>): FichaAcompanhamento {
    return {
      ...ficha,
      ...updates,
      updatedAt: new Date()
    };
  }

  static updateSessao(sessao: SessaoAcompanhamento, updates: Partial<SessaoAcompanhamento>): SessaoAcompanhamento {
    return {
      ...sessao,
      ...updates,
      updatedAt: new Date()
    };
  }

  private static generateId(): string {
    return 'ficha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  static formatarTipoAssistencia(tipo: string): string {
    const tipos = {
      'psicologica': 'Psicológica',
      'social': 'Social',
      'juridica': 'Jurídica',
      'medica': 'Médica',
      'fisioterapia': 'Fisioterapêutica',
      'nutricao': 'Nutricional'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }

  static formatarStatus(status: string): string {
    const statusMap = {
      'ativo': 'Ativo',
      'concluido': 'Concluído',
      'pausado': 'Pausado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  static formatarTipoSessao(tipo: string): string {
    const tipos = {
      'individual': 'Individual',
      'grupo': 'Grupo',
      'familiar': 'Familiar',
      'avaliacao': 'Avaliação'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }
}
