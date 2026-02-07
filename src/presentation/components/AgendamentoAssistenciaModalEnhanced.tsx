import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  AssistenciaEntity,
  ProfissionalAssistencia,
  AgendamentoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { ProfissionalAssistenciaService, AgendamentoAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface AgendamentoAssistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agendamento: AgendamentoAssistencia) => void;
  agendamento?: AgendamentoAssistencia | null;
  mode: 'create' | 'edit' | 'view';
}

// Extended form data with specialized fields
interface FormData {
  // Basic patient data
  pacienteNome: string;
  pacienteTelefone: string;
  pacienteEmail: string;
  pacienteCPF: string;
  pacienteDataNascimento: string;
  pacienteEndereco: string;
  
  // Appointment data
  tipoAssistencia: TipoAssistencia;
  profissionalId: string;
  dataAgendamento: string;
  horaAgendamento: string;
  modalidade: ModalidadeAtendimento;
  prioridade: PrioridadeAtendimento;
  motivo: string;
  observacoesPaciente: string;
  
  // Fisioterapia specific fields
  fisio_habitosVida: string;
  fisio_hma: string; // História Médica Atual
  fisio_hmp: string; // História Médica Pregressa
  fisio_antecedentesPessoais: string;
  fisio_antecedentesFamiliares: string;
  fisio_tratamentosRealizados: string;
  fisio_apresentacaoPaciente: string[];
  fisio_examesComplementares: string;
  fisio_medicamentos: string;
  fisio_cirurgias: string;
  fisio_inspecaoPalpacao: string[];
  fisio_semiologia: string;
  fisio_testesEspecificos: string;
  fisio_escalaDor: number;
  fisio_objetivosTratamento: string;
  fisio_recursosTerapeuticos: string;
  fisio_planoTratamento: string;
  
  // Nutrição specific fields
  nutri_peso: string;
  nutri_altura: string;
  nutri_imc: string;
  nutri_circunferenciaAbdominal: string;
  nutri_objetivos: string;
  nutri_restricoesAlimentares: string;
  nutri_alergias: string;
  nutri_preferenciasAlimentares: string;
  nutri_historicoFamiliar: string;
  nutri_atividadeFisica: string;
  nutri_consumoAgua: string;
  nutri_habitosAlimentares: string;
  nutri_suplementos: string;

  // Psicologia - Anamnese Completa fields
  // 1. IDENTIFICAÇÃO
  psico_nome: string;
  psico_nascimento: string;
  psico_sexo: '' | 'masculino' | 'feminino';
  psico_trabalha: boolean | null;
  psico_profissao: string;
  psico_religiao: string;
  psico_estadoCivil: string;
  psico_filhos: string;
  psico_contato1: string;
  psico_quemContato1: string;
  psico_contato2: string;
  psico_quemContato2: string;
  psico_contato3: string;
  psico_quemContato3: string;

  // 2. HISTÓRICO DO PACIENTE
  psico_historicoPessoal: string;

  // Histórico Familiar
  psico_maeViva: boolean | null;
  psico_maeIdadeMorte: string;
  psico_idadeQuandoMaeMorreu: string;
  psico_maeProfissao: string;
  psico_relacionamentoMae: string;

  psico_paiVivo: boolean | null;
  psico_paiIdadeMorte: string;
  psico_idadeQuandoPaiMorreu: string;
  psico_paiProfissao: string;
  psico_relacionamentoPai: string;

  psico_filhoUnico: boolean | null;
  psico_irmaosVivos: boolean | null;
  psico_quemMorreuIrmaos: string;
  psico_idadeMorteIrmaos: string;
  psico_idadeQuandoIrmasMorreram: string;
  psico_profissaoIrmaos: string;
  psico_relacionamentoIrmaos: string;

  psico_filhosVivos: boolean | null;
  psico_quemMorreuFilhos: string;
  psico_idadeMorteFilhos: string;
  psico_idadeQuandoFilhosMorreram: string;
  psico_profissaoFilhos: string;
  psico_idadeFilhos: string;
  psico_relacionamentoFilhos: string;

  psico_avosVivos: boolean | null;
  psico_quemMorreuAvos: string;
  psico_idadeMorteAvos: string;
  psico_idadeQuandoAvosMorreram: string;
  psico_profissaoAvos: string;
  psico_idadeAvo: string;
  psico_idadeAvó: string;
  psico_relacionamentoAvos: string;

  // Informações sobre o lar
  psico_comoCasa: string;
  psico_ruaViolencia: boolean | null;
  psico_detalhesViolencia: string;
  psico_apoioFamiliar: boolean | null;
  psico_detalhesApoio: string;
  psico_reacaoFamilia: string;

  // Histórico Escolar
  psico_formacaoAcademica: 'superior_incompleto' | 'superior_completo' | 'medio_incompleto' | 'medio_completo' | 'basico' | '';
  psico_gostavaEscola: boolean | null;
  psico_porqueEscola: string;
  psico_situacoesImportantesEscola: string;
  psico_situacaoEnvergonhosaEscola: string;
  psico_sentePerseguidoEscola: boolean | null;
  psico_relatoPerseguicaoEscola: string;
  psico_gostaAmbienteEscolar: boolean | null;
  psico_porqueAmbienteEscolar: string;
  psico_fatoIncomodoEscola: boolean | null;
  psico_detalheFatoEscola: string;

  // Trabalho
  psico_empresa: string;
  psico_gostaTrabalho: boolean | null;
  psico_porqueTrabalho: string;
  psico_situacoesImportantesTrabalho: string;
  psico_situacaoEnvergonhosaTrabalho: string;
  psico_sentePerseguidoTrabalho: boolean | null;
  psico_relatoPerseguicaoTrabalho: string;
  psico_gostaAmbienteTrabalho: boolean | null;
  psico_porqueAmbienteTrabalho: string;
  psico_algoIncomodaEmpresa: boolean | null;
  psico_detalheIncomodaEmpresa: string;

  // Relacionamento Interpessoal
  psico_dificuldadeRelacionamento: boolean | null;
  psico_quantosAmigos: string;
  psico_introvertidoExtrovertido: string;
  psico_cumprimentaPessoas: boolean | null;
  psico_pessoaSolicita: boolean | null;
  psico_detalheAmizades: string;

  // Relação com rua/bairro
  psico_tempoMorando: string;
  psico_gostaMorar: boolean | null;
  psico_porqueMorar: string;

  // Relação familiar após sintomas
  psico_rotinaFamiliaMudou: boolean | null;
  psico_mudancasRotina: string;

  // 3. HISTÓRICO CLÍNICO
  psico_usaMedicacao: boolean | null;
  psico_qualMedicacao: string;
  psico_fezCirurgia: boolean | null;
  psico_qualCirurgia: string;
  psico_quantoTempoCirurgia: string;
  psico_puerperio: boolean | null;
  psico_quantosDiasPuerperio: string;
  psico_relatosDoencaPsiquica: boolean | null;
  psico_detalhesDoencaPsiquica: string;
  psico_historicoSubstancias: boolean | null;
  psico_quaisSubstancias: string;

  // 4. HISTÓRICO PSÍQUICO
  psico_sentimentosMedo: boolean;
  psico_sentimentosRaiva: boolean;
  psico_sentimentosRevolta: boolean;
  psico_sentimentosCulpa: boolean;
  psico_sentimentosAnsiedade: boolean;
  psico_sentimentosSolidao: boolean;
  psico_sentimentosAngustia: boolean;
  psico_sentimentosImpotencia: boolean;
  psico_sentimentosAlivio: boolean;
  psico_sentimentosIndiferenca: boolean;
  psico_outrosSentimentos: string;

  psico_atendimentoAnterior: boolean | null;
  psico_motivoAtendimentoAnterior: string;
  psico_quantoTempoAtendimento: string;
  psico_usoPsicotropico: boolean | null;
  psico_qualPsicotropico: string;
  psico_usoSubstanciaPsicoativa: boolean | null;
  psico_qualSubstanciaPsicoativa: string;

  // 5. CONHECENDO A QUEIXA DO PACIENTE
  psico_queixaPrincipal: string;
  psico_queixaSecundaria: string;
  psico_expectativaSessoes: string;

  // 6. INFORMAÇÕES ADICIONAIS
  psico_informacoesAdicionais: string;

  // 7. CLASSIFICAÇÃO DO PACIENTE
  psico_classificacao: 'vermelho' | 'amarelo' | 'roxo' | 'verde' | '';

  // 8. DEMANDAS
  psico_demandas: string;

  // 9. JUSTIFICATIVA DA DEMANDA
  psico_justificativaDemanda: string;
}

const AgendamentoAssistenciaModalEnhanced: React.FC<AgendamentoAssistenciaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agendamento,
  mode
}) => {
  const { currentUser } = useAuth();
  const { settings: _settings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState<ProfissionalAssistencia[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<Date[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  const profissionalService = new ProfissionalAssistenciaService();
  const agendamentoService = new AgendamentoAssistenciaService();

  const [formData, setFormData] = useState<FormData>({
    // Basic patient data
    pacienteNome: '',
    pacienteTelefone: '',
    pacienteEmail: '',
    pacienteCPF: '',
    pacienteDataNascimento: '',
    pacienteEndereco: '',
    
    // Appointment data
    tipoAssistencia: TipoAssistencia.Psicologica,
    profissionalId: '',
    dataAgendamento: '',
    horaAgendamento: '',
    modalidade: ModalidadeAtendimento.Presencial,
    prioridade: PrioridadeAtendimento.Normal,
    motivo: '',
    observacoesPaciente: '',
    
    // Fisioterapia fields
    fisio_habitosVida: '',
    fisio_hma: '',
    fisio_hmp: '',
    fisio_antecedentesPessoais: '',
    fisio_antecedentesFamiliares: '',
    fisio_tratamentosRealizados: '',
    fisio_apresentacaoPaciente: [],
    fisio_examesComplementares: '',
    fisio_medicamentos: '',
    fisio_cirurgias: '',
    fisio_inspecaoPalpacao: [],
    fisio_semiologia: '',
    fisio_testesEspecificos: '',
    fisio_escalaDor: 0,
    fisio_objetivosTratamento: '',
    fisio_recursosTerapeuticos: '',
    fisio_planoTratamento: '',
    
    // Nutrição fields
    nutri_peso: '',
    nutri_altura: '',
    nutri_imc: '',
    nutri_circunferenciaAbdominal: '',
    nutri_objetivos: '',
    nutri_restricoesAlimentares: '',
    nutri_alergias: '',
    nutri_preferenciasAlimentares: '',
    nutri_historicoFamiliar: '',
    nutri_atividadeFisica: '',
    nutri_consumoAgua: '',
    nutri_habitosAlimentares: '',
    nutri_suplementos: '',

    // Psicologia - Anamnese Completa fields inicializações
    // 1. IDENTIFICAÇÃO
    psico_nome: '',
    psico_nascimento: '',
    psico_sexo: '',
    psico_trabalha: null,
    psico_profissao: '',
    psico_religiao: '',
    psico_estadoCivil: '',
    psico_filhos: '',
    psico_contato1: '',
    psico_quemContato1: '',
    psico_contato2: '',
    psico_quemContato2: '',
    psico_contato3: '',
    psico_quemContato3: '',

    // 2. HISTÓRICO DO PACIENTE
    psico_historicoPessoal: '',

    // Histórico Familiar
    psico_maeViva: null,
    psico_maeIdadeMorte: '',
    psico_idadeQuandoMaeMorreu: '',
    psico_maeProfissao: '',
    psico_relacionamentoMae: '',

    psico_paiVivo: null,
    psico_paiIdadeMorte: '',
    psico_idadeQuandoPaiMorreu: '',
    psico_paiProfissao: '',
    psico_relacionamentoPai: '',

    psico_filhoUnico: null,
    psico_irmaosVivos: null,
    psico_quemMorreuIrmaos: '',
    psico_idadeMorteIrmaos: '',
    psico_idadeQuandoIrmasMorreram: '',
    psico_profissaoIrmaos: '',
    psico_relacionamentoIrmaos: '',

    psico_filhosVivos: null,
    psico_quemMorreuFilhos: '',
    psico_idadeMorteFilhos: '',
    psico_idadeQuandoFilhosMorreram: '',
    psico_profissaoFilhos: '',
    psico_idadeFilhos: '',
    psico_relacionamentoFilhos: '',

    psico_avosVivos: null,
    psico_quemMorreuAvos: '',
    psico_idadeMorteAvos: '',
    psico_idadeQuandoAvosMorreram: '',
    psico_profissaoAvos: '',
    psico_idadeAvo: '',
    psico_idadeAvó: '',
    psico_relacionamentoAvos: '',

    // Informações sobre o lar
    psico_comoCasa: '',
    psico_ruaViolencia: null,
    psico_detalhesViolencia: '',
    psico_apoioFamiliar: null,
    psico_detalhesApoio: '',
    psico_reacaoFamilia: '',

    // Histórico Escolar
    psico_formacaoAcademica: '',
    psico_gostavaEscola: null,
    psico_porqueEscola: '',
    psico_situacoesImportantesEscola: '',
    psico_situacaoEnvergonhosaEscola: '',
    psico_sentePerseguidoEscola: null,
    psico_relatoPerseguicaoEscola: '',
    psico_gostaAmbienteEscolar: null,
    psico_porqueAmbienteEscolar: '',
    psico_fatoIncomodoEscola: null,
    psico_detalheFatoEscola: '',

    // Trabalho
    psico_empresa: '',
    psico_gostaTrabalho: null,
    psico_porqueTrabalho: '',
    psico_situacoesImportantesTrabalho: '',
    psico_situacaoEnvergonhosaTrabalho: '',
    psico_sentePerseguidoTrabalho: null,
    psico_relatoPerseguicaoTrabalho: '',
    psico_gostaAmbienteTrabalho: null,
    psico_porqueAmbienteTrabalho: '',
    psico_algoIncomodaEmpresa: null,
    psico_detalheIncomodaEmpresa: '',

    // Relacionamento Interpessoal
    psico_dificuldadeRelacionamento: null,
    psico_quantosAmigos: '',
    psico_introvertidoExtrovertido: '',
    psico_cumprimentaPessoas: null,
    psico_pessoaSolicita: null,
    psico_detalheAmizades: '',

    // Relação com rua/bairro
    psico_tempoMorando: '',
    psico_gostaMorar: null,
    psico_porqueMorar: '',

    // Relação familiar após sintomas
    psico_rotinaFamiliaMudou: null,
    psico_mudancasRotina: '',

    // 3. HISTÓRICO CLÍNICO
    psico_usaMedicacao: null,
    psico_qualMedicacao: '',
    psico_fezCirurgia: null,
    psico_qualCirurgia: '',
    psico_quantoTempoCirurgia: '',
    psico_puerperio: null,
    psico_quantosDiasPuerperio: '',
    psico_relatosDoencaPsiquica: null,
    psico_detalhesDoencaPsiquica: '',
    psico_historicoSubstancias: null,
    psico_quaisSubstancias: '',

    // 4. HISTÓRICO PSÍQUICO
    psico_sentimentosMedo: false,
    psico_sentimentosRaiva: false,
    psico_sentimentosRevolta: false,
    psico_sentimentosCulpa: false,
    psico_sentimentosAnsiedade: false,
    psico_sentimentosSolidao: false,
    psico_sentimentosAngustia: false,
    psico_sentimentosImpotencia: false,
    psico_sentimentosAlivio: false,
    psico_sentimentosIndiferenca: false,
    psico_outrosSentimentos: '',

    psico_atendimentoAnterior: null,
    psico_motivoAtendimentoAnterior: '',
    psico_quantoTempoAtendimento: '',
    psico_usoPsicotropico: null,
    psico_qualPsicotropico: '',
    psico_usoSubstanciaPsicoativa: null,
    psico_qualSubstanciaPsicoativa: '',

    // 5. CONHECENDO A QUEIXA DO PACIENTE
    psico_queixaPrincipal: '',
    psico_queixaSecundaria: '',
    psico_expectativaSessoes: '',

    // 6. INFORMAÇÕES ADICIONAIS
    psico_informacoesAdicionais: '',

    // 7. CLASSIFICAÇÃO DO PACIENTE
    psico_classificacao: '',

    // 8. DEMANDAS
    psico_demandas: '',

    // 9. JUSTIFICATIVA DA DEMANDA
    psico_justificativaDemanda: '',
  });

  const isReadOnly = mode === 'view';

  // Utility functions
  const applyPhoneMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const applyCPFMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const _applyEmailValidation = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const _applyNameValidation = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  };

  // Campos obrigatórios para anamnese psicológica
  const requiredPsychologyFields = [
    'psico_nome',
    'psico_sexo',
    'psico_contato1',
    'psico_queixaPrincipal',
    'psico_classificacao'
  ];

  // Validação de campos obrigatórios da anamnese psicológica
  const _validatePsychologyFields = (): { [key: string]: boolean } => {
    const errors: { [key: string]: boolean } = {};

    requiredPsychologyFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = true;
      }
    });

    return errors;
  };

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  // Função auxiliar para renderizar labels com asterisco
  const renderLabel = (text: string, fieldName: string, isRequired: boolean = false) => {
    const hasError = fieldErrors[fieldName];
    return (
      <label className={`block text-sm font-medium mb-2 ${hasError ? 'text-red-600' : 'text-gray-700'}`}>
        {text}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };

  // Função auxiliar para obter classes de input com validação
  const getInputClasses = (fieldName: string, baseClasses: string = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100") => {
    const hasError = fieldErrors[fieldName];
    if (hasError) {
      return baseClasses.replace('border-gray-300', 'border-red-300').replace('focus:ring-blue-500', 'focus:ring-red-500');
    }
    return baseClasses;
  };

  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const calculateIMC = () => {
    if (formData.nutri_peso && formData.nutri_altura) {
      const peso = parseFloat(formData.nutri_peso);
      const altura = parseFloat(formData.nutri_altura) / 100; // Convert cm to m
      if (peso > 0 && altura > 0) {
        const imc = peso / (altura * altura);
        setFormData(prev => ({ ...prev, nutri_imc: imc.toFixed(2) }));
      }
    }
  };

  // Dynamic tabs based on assistance type
  const getTabs = () => {
    // Apenas abas básicas - as análises específicas serão feitas pelos profissionais
    return [
      { id: 'dados', label: 'Dados do Paciente' },
      { id: 'agendamento', label: 'Agendamento' }
    ];
  };

  const tabs = getTabs();

  useEffect(() => {
    if (agendamento && (mode === 'edit' || mode === 'view')) {
      // Load existing data
      const dataHora = new Date(agendamento.dataHoraAgendamento);
      const dataStr = dataHora.toISOString().split('T')[0];
      const horaStr = dataHora.toTimeString().slice(0, 5);

      setFormData(prev => ({
        ...prev,
        pacienteNome: agendamento.pacienteNome || '',
        pacienteTelefone: agendamento.pacienteTelefone || '',
        pacienteEmail: agendamento.pacienteEmail || '',
        pacienteCPF: '',
        pacienteDataNascimento: '',
        pacienteEndereco: '',
        tipoAssistencia: agendamento.tipoAssistencia,
        profissionalId: agendamento.profissionalId || '',
        dataAgendamento: dataStr,
        horaAgendamento: horaStr,
        modalidade: agendamento.modalidade || ModalidadeAtendimento.Presencial,
        prioridade: agendamento.prioridade || PrioridadeAtendimento.Normal,
        motivo: agendamento.motivo || '',
        observacoesPaciente: agendamento.observacoesPaciente || ''
      }));
    }
    setActiveTab(0);
    setErrors({});
  }, [agendamento, mode, isOpen]);

  useEffect(() => {
    if (formData.tipoAssistencia && isOpen) {
      loadProfissionaisDisponiveis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoAssistencia, isOpen]);

  useEffect(() => {
    if (formData.profissionalId && formData.dataAgendamento) {
      loadHorariosDisponiveis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.profissionalId, formData.dataAgendamento]);

  // Valida o formulário em tempo real para habilitar/desabilitar o botão
  useEffect(() => {
    setIsFormValid(checkFormValid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const loadProfissionaisDisponiveis = async () => {
    try {
      const profissionais = await profissionalService.getProfissionaisByTipo(formData.tipoAssistencia);
      const profissionaisAtivos = profissionais.filter(p => p.status === StatusProfissional.Ativo);
      setProfissionaisDisponiveis(profissionaisAtivos);
    } catch (error) {
      console.error('Error loading profissionais:', error);
    }
  };

  const loadHorariosDisponiveis = async () => {
    try {
      const data = new Date(formData.dataAgendamento);
      const horarios = await agendamentoService.obterHorariosDisponiveis(formData.profissionalId, data);
      setHorariosDisponiveis(horarios);
    } catch (error) {
      console.error('Error loading horários:', error);
      setHorariosDisponiveis([]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    let processedValue = value;
    
    // Apply masks for specific fields
    if (field === 'pacienteTelefone') {
      processedValue = applyPhoneMask(value);
    } else if (field === 'pacienteCPF') {
      processedValue = applyCPFMask(value);
    } else if (field === 'pacienteNome') {
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for important fields
    const newErrors = { ...errors };
    
    if (field === 'pacienteNome' && processedValue) {
      if (!validateName(processedValue)) {
        newErrors[field] = 'Nome deve conter apenas letras e ter pelo menos 2 caracteres';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'pacienteEmail' && processedValue) {
      if (!validateEmail(processedValue)) {
        newErrors[field] = 'Email inválido';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'pacienteCPF' && processedValue) {
      if (!validateCPF(processedValue)) {
        newErrors[field] = 'CPF inválido';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'pacienteTelefone' && processedValue) {
      if (!validatePhone(processedValue)) {
        newErrors[field] = 'Telefone deve ter entre 10 e 11 dígitos';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'pacienteDataNascimento' && processedValue) {
      if (!validateDateOfBirth(processedValue)) {
        newErrors[field] = 'Data de nascimento inválida';
      } else {
        delete newErrors[field];
      }
    }
    
    // Validações específicas para nutrição
    if (field === 'nutri_peso' && processedValue) {
      const peso = parseFloat(processedValue);
      if (peso <= 0 || peso > 500) {
        newErrors[field] = 'Peso deve estar entre 1 e 500 kg';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'nutri_altura' && processedValue) {
      const altura = parseFloat(processedValue);
      if (altura <= 0 || altura > 250) {
        newErrors[field] = 'Altura deve estar entre 1 e 250 cm';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'nutri_circunferenciaAbdominal' && processedValue) {
      const circunferencia = parseFloat(processedValue);
      if (circunferencia <= 0 || circunferencia > 200) {
        newErrors[field] = 'Circunferência abdominal deve estar entre 1 e 200 cm';
      } else {
        delete newErrors[field];
      }
    } else if (field === 'nutri_consumoAgua' && processedValue) {
      const consumo = parseFloat(processedValue);
      if (consumo <= 0 || consumo > 10) {
        newErrors[field] = 'Consumo de água deve estar entre 0.1 e 10 litros';
      } else {
        delete newErrors[field];
      }
    }
    
    // Validações para fisioterapia
    if (field === 'fisio_escalaDor' && processedValue !== undefined) {
      const dor = parseInt(processedValue.toString());
      if (dor < 0 || dor > 10) {
        newErrors[field] = 'Escala de dor deve estar entre 0 e 10';
      } else {
        delete newErrors[field];
      }
    }

    // Validação para campos obrigatórios da anamnese psicológica
    if (requiredPsychologyFields.includes(field)) {
      if (!processedValue || (typeof processedValue === 'string' && processedValue.trim() === '')) {
        setFieldErrors(prev => ({ ...prev, [field]: true }));
      } else {
        setFieldErrors(prev => ({ ...prev, [field]: false }));
      }
    }

    setErrors(newErrors);
  };

  const handleArrayChange = (field: keyof FormData, value: string, checked: boolean) => {
    const currentArray = formData[field] as string[];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);

    setFormData(prev => ({ ...prev, [field]: newArray }));
  };


  const validateCPF = (cpf: string): boolean => {
    if (!cpf) return true; // CPF é opcional
    
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
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  };

  const validateDateOfBirth = (date: string): boolean => {
    if (!date) return true; // Data nascimento é opcional

    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Deve ter pelo menos 1 ano e no máximo 120 anos
    return age >= 1 && age <= 120;
  };

  // Verifica se todos os campos obrigatórios estão preenchidos (para habilitar/desabilitar o botão)
  const checkFormValid = (): boolean => {
    // Apenas campos básicos de agendamento - análises específicas serão feitas pelo profissional
    const hasBasicFields = !!(
      formData.pacienteNome.trim() &&
      formData.pacienteTelefone.trim() &&
      formData.profissionalId &&
      formData.dataAgendamento &&
      formData.horaAgendamento &&
      formData.motivo.trim() &&
      formData.motivo.trim().length >= 10
    );

    return hasBasicFields;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações básicas do paciente
    if (!formData.pacienteNome.trim()) {
      newErrors['pacienteNome'] = 'Nome do paciente é obrigatório';
    } else if (!validateName(formData.pacienteNome)) {
      newErrors['pacienteNome'] = 'Nome deve conter apenas letras e ter pelo menos 2 caracteres';
    }

    if (!formData.pacienteTelefone.trim()) {
      newErrors['pacienteTelefone'] = 'Telefone é obrigatório';
    } else if (!validatePhone(formData.pacienteTelefone)) {
      newErrors['pacienteTelefone'] = 'Telefone deve ter entre 10 e 11 dígitos';
    }

    if (formData.pacienteEmail && !validateEmail(formData.pacienteEmail)) {
      newErrors['pacienteEmail'] = 'Email inválido';
    }

    if (formData.pacienteCPF && formData.pacienteCPF.trim() && !validateCPF(formData.pacienteCPF)) {
      newErrors['pacienteCPF'] = 'CPF inválido';
    }

    if (formData.pacienteDataNascimento && !validateDateOfBirth(formData.pacienteDataNascimento)) {
      newErrors['pacienteDataNascimento'] = 'Data de nascimento inválida (idade deve estar entre 1 e 120 anos)';
    }

    if (formData.pacienteEndereco && formData.pacienteEndereco.trim() && formData.pacienteEndereco.trim().length < 10) {
      newErrors['pacienteEndereco'] = 'Endereço deve ter pelo menos 10 caracteres';
    }

    // Validações do agendamento
    if (!formData.profissionalId) {
      newErrors['profissionalId'] = 'Profissional é obrigatório';
    }

    if (!formData.dataAgendamento) {
      newErrors['dataAgendamento'] = 'Data é obrigatória';
    } else {
      const selectedDate = new Date(formData.dataAgendamento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors['dataAgendamento'] = 'Data deve ser hoje ou futura';
      }
    }

    if (!formData.horaAgendamento) {
      newErrors['horaAgendamento'] = 'Horário é obrigatório';
    }

    if (!formData.motivo.trim()) {
      newErrors['motivo'] = 'Motivo da consulta é obrigatório';
    } else if (formData.motivo.trim().length < 10) {
      newErrors['motivo'] = 'Motivo deve ter pelo menos 10 caracteres';
    } else if (formData.motivo.trim().length > 500) {
      newErrors['motivo'] = 'Motivo deve ter no máximo 500 caracteres';
    }

    if (formData.observacoesPaciente && formData.observacoesPaciente.trim().length > 1000) {
      newErrors['observacoesPaciente'] = 'Observações devem ter no máximo 1000 caracteres';
    }

    // Removido: Validações específicas agora são feitas pelo profissional após o agendamento
    // As análises detalhadas (fisioterapia, nutrição, psicologia) não são mais preenchidas no agendamento

    /*
    // Validações específicas por tipo de assistência (REMOVIDO)
    if (formData.tipoAssistencia === TipoAssistencia.Fisioterapia) {
      // Validações obrigatórias para fisioterapia
      if (!formData.fisio_habitosVida.trim()) {
        newErrors['fisio_habitosVida'] = 'Hábitos de vida são obrigatórios';
      }

      if (!formData.fisio_hma.trim()) {
        newErrors['fisio_hma'] = 'História Médica Atual é obrigatória';
      }

      if (formData.fisio_apresentacaoPaciente.length === 0) {
        newErrors['fisio_apresentacaoPaciente'] = 'Selecione pelo menos uma opção de apresentação do paciente';
      }

      if (formData.fisio_escalaDor < 0 || formData.fisio_escalaDor > 10) {
        newErrors['fisio_escalaDor'] = 'Escala de dor deve estar entre 0 e 10';
      }

      if (!formData.fisio_objetivosTratamento.trim()) {
        newErrors['fisio_objetivosTratamento'] = 'Objetivos do tratamento são obrigatórios';
      }

      // Validações de campos adicionais
      if (formData.fisio_hmp && formData.fisio_hmp.length > 1000) {
        newErrors['fisio_hmp'] = 'História Médica Pregressa deve ter no máximo 1000 caracteres';
      }

      if (formData.fisio_antecedentesPessoais && formData.fisio_antecedentesPessoais.length > 500) {
        newErrors['fisio_antecedentesPessoais'] = 'Antecedentes Pessoais deve ter no máximo 500 caracteres';
      }

      if (formData.fisio_antecedentesFamiliares && formData.fisio_antecedentesFamiliares.length > 500) {
        newErrors['fisio_antecedentesFamiliares'] = 'Antecedentes Familiares deve ter no máximo 500 caracteres';
      }

      if (formData.fisio_tratamentosRealizados && formData.fisio_tratamentosRealizados.length > 1000) {
        newErrors['fisio_tratamentosRealizados'] = 'Tratamentos Realizados deve ter no máximo 1000 caracteres';
      }

      if (formData.fisio_examesComplementares && formData.fisio_examesComplementares.length > 1000) {
        newErrors['fisio_examesComplementares'] = 'Exames Complementares deve ter no máximo 1000 caracteres';
      }

      if (formData.fisio_medicamentos && formData.fisio_medicamentos.length > 500) {
        newErrors['fisio_medicamentos'] = 'Medicamentos deve ter no máximo 500 caracteres';
      }

      if (formData.fisio_cirurgias && formData.fisio_cirurgias.length > 500) {
        newErrors['fisio_cirurgias'] = 'Cirurgias deve ter no máximo 500 caracteres';
      }

      // Validações de tamanho de campo
      if (formData.fisio_semiologia.length > 1000) {
        newErrors['fisio_semiologia'] = 'Semiologia deve ter no máximo 1000 caracteres';
      }

      if (formData.fisio_testesEspecificos.length > 1000) {
        newErrors['fisio_testesEspecificos'] = 'Testes específicos deve ter no máximo 1000 caracteres';
      }

      if (formData.fisio_objetivosTratamento.length > 500) {
        newErrors['fisio_objetivosTratamento'] = 'Objetivos do tratamento deve ter no máximo 500 caracteres';
      }

      if (formData.fisio_recursosTerapeuticos.length > 500) {
        newErrors['fisio_recursosTerapeuticos'] = 'Recursos terapêuticos deve ter no máximo 500 caracteres';
      }

      if (formData.fisio_planoTratamento.length > 1000) {
        newErrors['fisio_planoTratamento'] = 'Plano de tratamento deve ter no máximo 1000 caracteres';
      }
    }

    if (formData.tipoAssistencia === TipoAssistencia.Nutricao) {
      // Validações obrigatórias para nutrição
      if (!formData.nutri_peso.trim()) {
        newErrors['nutri_peso'] = 'Peso é obrigatório';
      } else {
        const peso = parseFloat(formData.nutri_peso);
        if (peso <= 0 || peso > 500) {
          newErrors['nutri_peso'] = 'Peso deve estar entre 1 e 500 kg';
        }
      }

      if (!formData.nutri_altura.trim()) {
        newErrors['nutri_altura'] = 'Altura é obrigatória';
      } else {
        const altura = parseFloat(formData.nutri_altura);
        if (altura <= 0 || altura > 250) {
          newErrors['nutri_altura'] = 'Altura deve estar entre 1 e 250 cm';
        }
      }

      if (!formData.nutri_objetivos.trim()) {
        newErrors['nutri_objetivos'] = 'Objetivos do tratamento são obrigatórios';
      }

      // Validações de valores numéricos
      if (formData.nutri_circunferenciaAbdominal) {
        const circunferencia = parseFloat(formData.nutri_circunferenciaAbdominal);
        if (circunferencia <= 0 || circunferencia > 200) {
          newErrors['nutri_circunferenciaAbdominal'] = 'Circunferência abdominal deve estar entre 1 e 200 cm';
        }
      }

      if (formData.nutri_consumoAgua) {
        const consumo = parseFloat(formData.nutri_consumoAgua);
        if (consumo <= 0 || consumo > 10) {
          newErrors['nutri_consumoAgua'] = 'Consumo de água deve estar entre 0.1 e 10 litros';
        }
      }

      // Validações de tamanho de campo
      if (formData.nutri_objetivos.length > 500) {
        newErrors['nutri_objetivos'] = 'Objetivos deve ter no máximo 500 caracteres';
      }

      if (formData.nutri_habitosAlimentares.length > 1000) {
        newErrors['nutri_habitosAlimentares'] = 'Hábitos alimentares deve ter no máximo 1000 caracteres';
      }

      if (formData.nutri_restricoesAlimentares.length > 500) {
        newErrors['nutri_restricoesAlimentares'] = 'Restrições alimentares deve ter no máximo 500 caracteres';
      }

      if (formData.nutri_alergias.length > 500) {
        newErrors['nutri_alergias'] = 'Alergias deve ter no máximo 500 caracteres';
      }

      if (formData.nutri_preferenciasAlimentares && formData.nutri_preferenciasAlimentares.length > 500) {
        newErrors['nutri_preferenciasAlimentares'] = 'Preferências alimentares deve ter no máximo 500 caracteres';
      }

      if (formData.nutri_historicoFamiliar && formData.nutri_historicoFamiliar.length > 1000) {
        newErrors['nutri_historicoFamiliar'] = 'Histórico familiar deve ter no máximo 1000 caracteres';
      }

      if (formData.nutri_suplementos && formData.nutri_suplementos.length > 500) {
        newErrors['nutri_suplementos'] = 'Suplementos deve ter no máximo 500 caracteres';
      }
    }

    if (formData.tipoAssistencia === TipoAssistencia.Psicologica) {
      // Validações obrigatórias para psicologia
      if (!formData.psico_nome.trim()) {
        newErrors['psico_nome'] = 'Nome do paciente é obrigatório';
      } else if (formData.psico_nome.trim().length < 3) {
        newErrors['psico_nome'] = 'Nome deve ter pelo menos 3 caracteres';
      }

      if (!formData.psico_queixaPrincipal.trim()) {
        newErrors['psico_queixaPrincipal'] = 'Queixa principal é obrigatória';
      } else if (formData.psico_queixaPrincipal.trim().length < 10) {
        newErrors['psico_queixaPrincipal'] = 'Queixa principal deve ter pelo menos 10 caracteres';
      }

      // Validações de tamanho de campos
      if (formData.psico_historicoPessoal && formData.psico_historicoPessoal.length > 2000) {
        newErrors['psico_historicoPessoal'] = 'Histórico pessoal deve ter no máximo 2000 caracteres';
      }

      if (formData.psico_queixaSecundaria && formData.psico_queixaSecundaria.length > 1000) {
        newErrors['psico_queixaSecundaria'] = 'Queixa secundária deve ter no máximo 1000 caracteres';
      }

      if (formData.psico_expectativaSessoes && formData.psico_expectativaSessoes.length > 500) {
        newErrors['psico_expectativaSessoes'] = 'Expectativa das sessões deve ter no máximo 500 caracteres';
      }

      if (formData.psico_informacoesAdicionais && formData.psico_informacoesAdicionais.length > 2000) {
        newErrors['psico_informacoesAdicionais'] = 'Informações adicionais deve ter no máximo 2000 caracteres';
      }

      if (formData.psico_demandas && formData.psico_demandas.length > 1000) {
        newErrors['psico_demandas'] = 'Demandas deve ter no máximo 1000 caracteres';
      }

      if (formData.psico_justificativaDemanda && formData.psico_justificativaDemanda.length > 1000) {
        newErrors['psico_justificativaDemanda'] = 'Justificativa da demanda deve ter no máximo 1000 caracteres';
      }

      // Validações de contatos
      if (formData.psico_contato1 && !validatePhone(formData.psico_contato1)) {
        newErrors['psico_contato1'] = 'Telefone inválido';
      }

      if (formData.psico_contato2 && !validatePhone(formData.psico_contato2)) {
        newErrors['psico_contato2'] = 'Telefone inválido';
      }

      if (formData.psico_contato3 && !validatePhone(formData.psico_contato3)) {
        newErrors['psico_contato3'] = 'Telefone inválido';
      }
    }
    */

    setErrors(newErrors);

    // Se houver erros, rolar para o primeiro campo com erro
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      console.log('🔴 Primeiro campo com erro:', firstErrorField, '- Erro:', newErrors[firstErrorField]);

      // Tentar rolar até o campo com erro
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
                            document.querySelector('.border-red-500');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('🔵 handleSave chamado');
    console.log('📋 Dados do formulário:', formData);

    const isValid = validateForm();
    console.log('✅ Formulário válido?', isValid);
    console.log('❌ Erros encontrados:', errors);

    if (!isValid) {
      console.log('⛔ Validação falhou, abortando salvamento');
      toast.error('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    console.log('✅ Validação passou, iniciando salvamento...');
    setIsLoading(true);
    try {
      const profissionalSelecionado = profissionaisDisponiveis.find(p => p.id === formData.profissionalId);
      if (!profissionalSelecionado) {
        throw new Error('Profissional não encontrado');
      }

      const [hora, minuto] = formData.horaAgendamento.split(':').map(Number);
      const dataHoraAgendamento = new Date(formData.dataAgendamento);
      dataHoraAgendamento.setHours(hora, minuto, 0, 0);

      const dataHoraFim = new Date(dataHoraAgendamento.getTime() + profissionalSelecionado.tempoConsulta * 60000);

      const agendamentoData: any = {
        pacienteId: 'temp_' + Date.now(),
        pacienteNome: formData.pacienteNome.trim(),
        pacienteTelefone: formatPhoneNumber(formData.pacienteTelefone),
        profissionalId: formData.profissionalId,
        profissionalNome: profissionalSelecionado.nome,
        tipoAssistencia: formData.tipoAssistencia,
        dataHoraAgendamento,
        dataHoraFim,
        modalidade: formData.modalidade,
        prioridade: formData.prioridade,
        status: StatusAgendamento.Agendado,
        motivo: formData.motivo,
        anexos: [],
        historico: [],
        createdBy: currentUser?.email || 'unknown',
        // Store specialized data based on type
        dadosEspecificos: {}
      };

      // Add specialized data based on assistance type
      if (formData.tipoAssistencia === TipoAssistencia.Fisioterapia) {
        agendamentoData.dadosEspecificos.fisioterapia = {
          habitosVida: formData.fisio_habitosVida,
          hma: formData.fisio_hma,
          hmp: formData.fisio_hmp,
          antecedentesPessoais: formData.fisio_antecedentesPessoais,
          antecedentesFamiliares: formData.fisio_antecedentesFamiliares,
          tratamentosRealizados: formData.fisio_tratamentosRealizados,
          apresentacaoPaciente: formData.fisio_apresentacaoPaciente,
          examesComplementares: formData.fisio_examesComplementares,
          medicamentos: formData.fisio_medicamentos,
          cirurgias: formData.fisio_cirurgias,
          inspecaoPalpacao: formData.fisio_inspecaoPalpacao,
          semiologia: formData.fisio_semiologia,
          testesEspecificos: formData.fisio_testesEspecificos,
          escalaDor: formData.fisio_escalaDor,
          objetivosTratamento: formData.fisio_objetivosTratamento,
          recursosTerapeuticos: formData.fisio_recursosTerapeuticos,
          planoTratamento: formData.fisio_planoTratamento
        };
      } else if (formData.tipoAssistencia === TipoAssistencia.Nutricao) {
        agendamentoData.dadosEspecificos.nutricao = {
          peso: formData.nutri_peso,
          altura: formData.nutri_altura,
          imc: formData.nutri_imc,
          circunferenciaAbdominal: formData.nutri_circunferenciaAbdominal,
          objetivos: formData.nutri_objetivos,
          restricoesAlimentares: formData.nutri_restricoesAlimentares,
          alergias: formData.nutri_alergias,
          preferenciasAlimentares: formData.nutri_preferenciasAlimentares,
          historicoFamiliar: formData.nutri_historicoFamiliar,
          atividadeFisica: formData.nutri_atividadeFisica,
          consumoAgua: formData.nutri_consumoAgua,
          habitosAlimentares: formData.nutri_habitosAlimentares,
          suplementos: formData.nutri_suplementos
        };
      } else if (formData.tipoAssistencia === TipoAssistencia.Psicologica) {
        // Para assistência psicológica, os dados estão nos campos da anamnese integrada
        agendamentoData.dadosEspecificos.psicologia = {
          // 1. IDENTIFICAÇÃO
          nome: formData.psico_nome,
          sexo: formData.psico_sexo,
          trabalha: formData.psico_trabalha,
          profissao: formData.psico_profissao,
          religiao: formData.psico_religiao,
          estadoCivil: formData.psico_estadoCivil,
          filhos: formData.psico_filhos,
          contato1: formData.psico_contato1,
          quemContato1: formData.psico_quemContato1,
          contato2: formData.psico_contato2,
          quemContato2: formData.psico_quemContato2,
          contato3: formData.psico_contato3,
          quemContato3: formData.psico_quemContato3,

          // 2. HISTÓRICO DO PACIENTE
          historicoPessoal: formData.psico_historicoPessoal,

          // Histórico Familiar - Mãe
          maeViva: formData.psico_maeViva,
          maeIdadeMorte: formData.psico_maeIdadeMorte,
          idadeQuandoMaeMorreu: formData.psico_idadeQuandoMaeMorreu,
          maeProfissao: formData.psico_maeProfissao,
          relacionamentoMae: formData.psico_relacionamentoMae,

          // Histórico Familiar - Pai
          paiVivo: formData.psico_paiVivo,
          paiIdadeMorte: formData.psico_paiIdadeMorte,
          idadeQuandoPaiMorreu: formData.psico_idadeQuandoPaiMorreu,
          paiProfissao: formData.psico_paiProfissao,
          relacionamentoPai: formData.psico_relacionamentoPai,

          // Histórico Familiar - Irmãos
          filhoUnico: formData.psico_filhoUnico,
          irmaosVivos: formData.psico_irmaosVivos,
          quemMorreuIrmaos: formData.psico_quemMorreuIrmaos,
          idadeMorteIrmaos: formData.psico_idadeMorteIrmaos,
          idadeQuandoIrmasMorreram: formData.psico_idadeQuandoIrmasMorreram,
          profissaoIrmaos: formData.psico_profissaoIrmaos,
          relacionamentoIrmaos: formData.psico_relacionamentoIrmaos,

          // Histórico Familiar - Filhos
          filhosVivos: formData.psico_filhosVivos,
          quemMorreuFilhos: formData.psico_quemMorreuFilhos,
          idadeMorteFilhos: formData.psico_idadeMorteFilhos,
          idadeQuandoFilhosMorreram: formData.psico_idadeQuandoFilhosMorreram,
          profissaoFilhos: formData.psico_profissaoFilhos,
          idadeFilhos: formData.psico_idadeFilhos,
          relacionamentoFilhos: formData.psico_relacionamentoFilhos,

          // Histórico Familiar - Avós
          avosVivos: formData.psico_avosVivos,
          quemMorreuAvos: formData.psico_quemMorreuAvos,
          idadeMorteAvos: formData.psico_idadeMorteAvos,
          idadeQuandoAvosMorreram: formData.psico_idadeQuandoAvosMorreram,
          profissaoAvos: formData.psico_profissaoAvos,
          idadeAvo: formData.psico_idadeAvo,
          idadeAvó: formData.psico_idadeAvó,
          relacionamentoAvos: formData.psico_relacionamentoAvos,

          // Histórico Familiar - Outros
          comoCasa: formData.psico_comoCasa,
          ruaViolencia: formData.psico_ruaViolencia,
          detalhesViolencia: formData.psico_detalhesViolencia,
          apoioFamiliar: formData.psico_apoioFamiliar,
          detalhesApoio: formData.psico_detalhesApoio,
          reacaoFamilia: formData.psico_reacaoFamilia,

          // Histórico Escolar
          formacaoAcademica: formData.psico_formacaoAcademica,
          gostavaEscola: formData.psico_gostavaEscola,
          porqueEscola: formData.psico_porqueEscola,
          situacoesImportantesEscola: formData.psico_situacoesImportantesEscola,
          situacaoEnvergonhosaEscola: formData.psico_situacaoEnvergonhosaEscola,
          sentePerseguidoEscola: formData.psico_sentePerseguidoEscola,
          relatoPerseguicaoEscola: formData.psico_relatoPerseguicaoEscola,
          gostaAmbienteEscolar: formData.psico_gostaAmbienteEscolar,
          porqueAmbienteEscolar: formData.psico_porqueAmbienteEscolar,
          fatoIncomodoEscola: formData.psico_fatoIncomodoEscola,
          detalheFatoEscola: formData.psico_detalheFatoEscola,

          // Histórico Profissional
          empresa: formData.psico_empresa,
          gostaTrabalho: formData.psico_gostaTrabalho,
          porqueTrabalho: formData.psico_porqueTrabalho,
          situacoesImportantesTrabalho: formData.psico_situacoesImportantesTrabalho,
          situacaoEnvergonhosaTrabalho: formData.psico_situacaoEnvergonhosaTrabalho,
          sentePerseguidoTrabalho: formData.psico_sentePerseguidoTrabalho,
          relatoPerseguicaoTrabalho: formData.psico_relatoPerseguicaoTrabalho,
          gostaAmbienteTrabalho: formData.psico_gostaAmbienteTrabalho,
          porqueAmbienteTrabalho: formData.psico_porqueAmbienteTrabalho,
          algoIncomodaEmpresa: formData.psico_algoIncomodaEmpresa,
          detalheIncomodaEmpresa: formData.psico_detalheIncomodaEmpresa,

          // Histórico Social
          dificuldadeRelacionamento: formData.psico_dificuldadeRelacionamento,
          quantosAmigos: formData.psico_quantosAmigos,
          introvertidoExtrovertido: formData.psico_introvertidoExtrovertido,
          cumprimentaPessoas: formData.psico_cumprimentaPessoas,
          pessoaSolicita: formData.psico_pessoaSolicita,
          detalheAmizades: formData.psico_detalheAmizades,

          // Histórico Residencial
          tempoMorando: formData.psico_tempoMorando,
          gostaMorar: formData.psico_gostaMorar,
          porqueMorar: formData.psico_porqueMorar,

          // Rotina Familiar
          rotinaFamiliaMudou: formData.psico_rotinaFamiliaMudou,
          mudancasRotina: formData.psico_mudancasRotina,

          // 3. HISTÓRICO CLÍNICO
          usaMedicacao: formData.psico_usaMedicacao,
          qualMedicacao: formData.psico_qualMedicacao,
          fezCirurgia: formData.psico_fezCirurgia,
          qualCirurgia: formData.psico_qualCirurgia,
          quantoTempoCirurgia: formData.psico_quantoTempoCirurgia,
          puerperio: formData.psico_puerperio,
          quantosDiasPuerperio: formData.psico_quantosDiasPuerperio,
          relatosDoencaPsiquica: formData.psico_relatosDoencaPsiquica,
          detalhesDoencaPsiquica: formData.psico_detalhesDoencaPsiquica,
          historicoSubstancias: formData.psico_historicoSubstancias,
          quaisSubstancias: formData.psico_quaisSubstancias,

          // 4. HISTÓRICO PSÍQUICO
          sentimentosMedo: formData.psico_sentimentosMedo,
          sentimentosRaiva: formData.psico_sentimentosRaiva,
          sentimentosRevolta: formData.psico_sentimentosRevolta,
          sentimentosCulpa: formData.psico_sentimentosCulpa,
          sentimentosAnsiedade: formData.psico_sentimentosAnsiedade,
          sentimentosSolidao: formData.psico_sentimentosSolidao,
          sentimentosAngustia: formData.psico_sentimentosAngustia,
          sentimentosImpotencia: formData.psico_sentimentosImpotencia,
          sentimentosAlivio: formData.psico_sentimentosAlivio,
          sentimentosIndiferenca: formData.psico_sentimentosIndiferenca,
          outrosSentimentos: formData.psico_outrosSentimentos,
          atendimentoAnterior: formData.psico_atendimentoAnterior,
          motivoAtendimentoAnterior: formData.psico_motivoAtendimentoAnterior,
          quantoTempoAtendimento: formData.psico_quantoTempoAtendimento,
          usoPsicotropico: formData.psico_usoPsicotropico,
          qualPsicotropico: formData.psico_qualPsicotropico,
          usoSubstanciaPsicoativa: formData.psico_usoSubstanciaPsicoativa,
          qualSubstanciaPsicoativa: formData.psico_qualSubstanciaPsicoativa,

          // 5. CONHECENDO A QUEIXA DO PACIENTE
          queixaPrincipal: formData.psico_queixaPrincipal,
          queixaSecundaria: formData.psico_queixaSecundaria,
          expectativaSessoes: formData.psico_expectativaSessoes,

          // 6. INFORMAÇÕES ADICIONAIS
          informacoesAdicionais: formData.psico_informacoesAdicionais,

          // 7. CLASSIFICAÇÃO DO PACIENTE
          classificacao: formData.psico_classificacao,

          // 8. DEMANDAS
          demandas: formData.psico_demandas,

          // 9. JUSTIFICATIVA DA DEMANDA
          justificativaDemanda: formData.psico_justificativaDemanda
        };
      }

      // Add optional fields
      if (formData.pacienteEmail && formData.pacienteEmail.trim()) {
        agendamentoData.pacienteEmail = formData.pacienteEmail;
      }
      if (formData.pacienteCPF) {
        agendamentoData.pacienteCPF = formData.pacienteCPF;
      }
      if (formData.pacienteDataNascimento) {
        agendamentoData.pacienteDataNascimento = formData.pacienteDataNascimento;
      }
      if (formData.pacienteEndereco) {
        agendamentoData.pacienteEndereco = formData.pacienteEndereco;
      }
      if (formData.observacoesPaciente && formData.observacoesPaciente.trim()) {
        agendamentoData.observacoesPaciente = formData.observacoesPaciente;
      }

      console.log('🔍 [AGENDAMENTO] Dados que serão salvos:', agendamentoData);
      console.log('🔍 [AGENDAMENTO] Dados específicos no agendamento:', agendamentoData.dadosEspecificos);
      console.log('🔍 [AGENDAMENTO] Tipo de assistência:', formData.tipoAssistencia);
      console.log('🔍 [AGENDAMENTO] Enum fisioterapia:', TipoAssistencia.Fisioterapia);

      if (mode === 'create') {
        const novoAgendamento = await agendamentoService.createAgendamento(agendamentoData);
        console.log('✅ [AGENDAMENTO] Agendamento criado:', novoAgendamento);
        onSave(novoAgendamento);
        toast.success(`Agendamento para ${formData.pacienteNome} foi criado com sucesso!`);
      } else if (mode === 'edit' && agendamento) {
        const agendamentoAtualizado = await agendamentoService.updateAgendamento(agendamento.id, agendamentoData);
        console.log('✅ [AGENDAMENTO] Agendamento atualizado:', agendamentoAtualizado);
        onSave(agendamentoAtualizado);
        toast.success(`Agendamento de ${formData.pacienteNome} foi atualizado com sucesso!`);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving agendamento:', error);
      toast.error(`Erro ao salvar agendamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' && '📅 Novo Agendamento'}
              {mode === 'edit' && '✏️ Editar Agendamento'}
              {mode === 'view' && '👁️ Visualizar Agendamento'}
            </h2>
            {mode !== 'view' && (
              <p className="text-xs text-gray-500 mt-1">
                Campos marcados com <span className="text-red-600 font-bold">*</span> são obrigatórios
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Tab 1: Dados do Paciente */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pacienteNome}
                    onChange={(e) => handleInputChange('pacienteNome', e.target.value)}
                    placeholder="Nome completo do paciente"
                    disabled={isReadOnly || isLoading}
                    maxLength={100}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pacienteNome ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.pacienteNome && <p className="text-red-500 text-sm mt-1">{errors.pacienteNome}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.pacienteCPF}
                    onChange={(e) => handleInputChange('pacienteCPF', e.target.value)}
                    placeholder="000.000.000-00"
                    disabled={isReadOnly || isLoading}
                    maxLength={14}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pacienteCPF ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.pacienteCPF && <p className="text-red-500 text-sm mt-1">{errors.pacienteCPF}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.pacienteDataNascimento}
                    onChange={(e) => handleInputChange('pacienteDataNascimento', e.target.value)}
                    disabled={isReadOnly || isLoading}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pacienteDataNascimento ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.pacienteDataNascimento && <p className="text-red-500 text-sm mt-1">{errors.pacienteDataNascimento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.pacienteTelefone}
                    onChange={(e) => handleInputChange('pacienteTelefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    disabled={isReadOnly || isLoading}
                    maxLength={15}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pacienteTelefone ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.pacienteTelefone && <p className="text-red-500 text-sm mt-1">{errors.pacienteTelefone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.pacienteEmail}
                    onChange={(e) => handleInputChange('pacienteEmail', e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={isReadOnly || isLoading}
                    maxLength={100}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pacienteEmail ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.pacienteEmail && <p className="text-red-500 text-sm mt-1">{errors.pacienteEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Assistência <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.tipoAssistencia}
                    onChange={(e) => handleInputChange('tipoAssistencia', e.target.value as TipoAssistencia)}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.tipoAssistencia ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  >
                    {Object.values(TipoAssistencia).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {AssistenciaEntity.formatarTipoAssistencia(tipo)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.pacienteEndereco}
                  onChange={(e) => handleInputChange('pacienteEndereco', e.target.value)}
                  placeholder="Endereço completo (Rua, número, bairro, cidade)"
                  disabled={isReadOnly || isLoading}
                  maxLength={200}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pacienteEndereco ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.pacienteEndereco && <p className="text-red-500 text-sm mt-1">{errors.pacienteEndereco}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Consulta <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                  placeholder="Descreva o motivo da consulta..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.motivo ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.motivo && <p className="text-red-500 text-sm">{errors.motivo}</p>}
                  <p className={`text-sm ml-auto ${
                    formData.motivo.length < 10
                      ? 'text-red-600 font-medium'
                      : formData.motivo.length > 450
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                  }`}>
                    {formData.motivo.length}/500 caracteres
                    {formData.motivo.length < 10 && (
                      <span className="ml-1">(mínimo 10)</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações do Paciente
                </label>
                <textarea
                  value={formData.observacoesPaciente}
                  onChange={(e) => handleInputChange('observacoesPaciente', e.target.value)}
                  placeholder="Informações adicionais..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  maxLength={1000}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Agendamento */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profissional <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.profissionalId}
                    onChange={(e) => handleInputChange('profissionalId', e.target.value)}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.profissionalId ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Selecione um profissional</option>
                    {profissionaisDisponiveis.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nome} - {prof.registroProfissional}
                      </option>
                    ))}
                  </select>
                  {errors.profissionalId && <p className="text-red-500 text-sm mt-1">{errors.profissionalId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidade <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => handleInputChange('modalidade', e.target.value as ModalidadeAtendimento)}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  >
                    {Object.values(ModalidadeAtendimento).map((modalidade) => (
                      <option key={modalidade} value={modalidade}>
                        {AssistenciaEntity.formatarModalidadeAtendimento(modalidade)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dataAgendamento}
                    onChange={(e) => handleInputChange('dataAgendamento', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dataAgendamento ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.dataAgendamento && <p className="text-red-500 text-sm mt-1">{errors.dataAgendamento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário <span className="text-red-600">*</span>
  </label>
                  <select
                    value={formData.horaAgendamento}
                    onChange={(e) => handleInputChange('horaAgendamento', e.target.value)}
                    disabled={isReadOnly || isLoading || horariosDisponiveis.length === 0}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.horaAgendamento ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Selecione um horário</option>
                    {horariosDisponiveis.map((horario, index) => (
                      <option key={index} value={horario.toTimeString().slice(0, 5)}>
                        {horario.toTimeString().slice(0, 5)}
                      </option>
                    ))}
                  </select>
                  {errors.horaAgendamento && <p className="text-red-500 text-sm mt-1">{errors.horaAgendamento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => handleInputChange('prioridade', e.target.value as PrioridadeAtendimento)}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  >
                    {Object.values(PrioridadeAtendimento).map((prioridade) => (
                      <option key={prioridade} value={prioridade}>
                        {AssistenciaEntity.formatarPrioridade(prioridade)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* REMOVIDO: Análises específicas agora são feitas pelo profissional após o agendamento
              As abas de Fisioterapia, Nutrição e Psicologia foram movidas para o painel do profissional
          */}

          {/* Tab 3: Fisioterapia - REMOVIDO */}
          {false && activeTab === 2 && formData.tipoAssistencia === TipoAssistencia.Fisioterapia && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliação Fisioterapêutica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hábitos de Vida <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={formData.fisio_habitosVida}
                    onChange={(e) => handleInputChange('fisio_habitosVida', e.target.value)}
                    placeholder="Descreva os hábitos de vida do paciente..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_habitosVida ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_habitosVida && <p className="text-red-500 text-sm mt-1">{errors.fisio_habitosVida}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HMA (História Médica Atual) <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={formData.fisio_hma}
                    onChange={(e) => handleInputChange('fisio_hma', e.target.value)}
                    placeholder="História médica atual..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_hma ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_hma && <p className="text-red-500 text-sm mt-1">{errors.fisio_hma}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HMP (História Médica Pregressa)
                  </label>
                  <textarea
                    value={formData.fisio_hmp}
                    onChange={(e) => handleInputChange('fisio_hmp', e.target.value)}
                    placeholder="História médica pregressa..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={1000}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_hmp ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_hmp && <p className="text-red-500 text-sm mt-1">{errors.fisio_hmp}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antecedentes Pessoais
                  </label>
                  <textarea
                    value={formData.fisio_antecedentesPessoais}
                    onChange={(e) => handleInputChange('fisio_antecedentesPessoais', e.target.value)}
                    placeholder="Antecedentes pessoais..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_antecedentesPessoais ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_antecedentesPessoais && <p className="text-red-500 text-sm mt-1">{errors.fisio_antecedentesPessoais}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antecedentes Familiares
                  </label>
                  <textarea
                    value={formData.fisio_antecedentesFamiliares}
                    onChange={(e) => handleInputChange('fisio_antecedentesFamiliares', e.target.value)}
                    placeholder="Antecedentes familiares..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_antecedentesFamiliares ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_antecedentesFamiliares && <p className="text-red-500 text-sm mt-1">{errors.fisio_antecedentesFamiliares}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamentos Realizados
                  </label>
                  <textarea
                    value={formData.fisio_tratamentosRealizados}
                    onChange={(e) => handleInputChange('fisio_tratamentosRealizados', e.target.value)}
                    placeholder="Tratamentos já realizados..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={1000}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_tratamentosRealizados ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_tratamentosRealizados && <p className="text-red-500 text-sm mt-1">{errors.fisio_tratamentosRealizados}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apresentação do Paciente *
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md ${
                  errors.fisio_apresentacaoPaciente ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}>
                  {['Deambulando', 'Deambulando com apoio/auxílio', 'Cadeira de rodas', 'Internado', 'Orientado'].map((opcao) => (
                    <label key={opcao} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.fisio_apresentacaoPaciente.includes(opcao)}
                        onChange={(e) => handleArrayChange('fisio_apresentacaoPaciente', opcao, e.target.checked)}
                        disabled={isReadOnly || isLoading}
                        className="mr-2"
                      />
                      <span className="text-sm">{opcao}</span>
                    </label>
                  ))}
                </div>
                {errors.fisio_apresentacaoPaciente && <p className="text-red-500 text-sm mt-1">{errors.fisio_apresentacaoPaciente}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exames Complementares
                  </label>
                  <textarea
                    value={formData.fisio_examesComplementares}
                    onChange={(e) => handleInputChange('fisio_examesComplementares', e.target.value)}
                    placeholder="Exames realizados..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={1000}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_examesComplementares ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_examesComplementares && <p className="text-red-500 text-sm mt-1">{errors.fisio_examesComplementares}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicamentos em Uso
                  </label>
                  <textarea
                    value={formData.fisio_medicamentos}
                    onChange={(e) => handleInputChange('fisio_medicamentos', e.target.value)}
                    placeholder="Medicamentos em uso..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_medicamentos ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_medicamentos && <p className="text-red-500 text-sm mt-1">{errors.fisio_medicamentos}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cirurgias Realizadas
                  </label>
                  <textarea
                    value={formData.fisio_cirurgias}
                    onChange={(e) => handleInputChange('fisio_cirurgias', e.target.value)}
                    placeholder="Cirurgias realizadas..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fisio_cirurgias ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fisio_cirurgias && <p className="text-red-500 text-sm mt-1">{errors.fisio_cirurgias}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escala de Dor (EVA) - 0 a 10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.fisio_escalaDor}
                    onChange={(e) => handleInputChange('fisio_escalaDor', parseInt(e.target.value))}
                    disabled={isReadOnly || isLoading}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Sem dor</span>
                    <span className="font-bold text-lg">{formData.fisio_escalaDor}</span>
                    <span>Dor máxima</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspeção/Palpação
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Normal', 'Edema', 'Cicatrização incompleta', 'Eritemas', 'Outros'].map((opcao) => (
                    <label key={opcao} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.fisio_inspecaoPalpacao.includes(opcao)}
                        onChange={(e) => handleArrayChange('fisio_inspecaoPalpacao', opcao, e.target.checked)}
                        disabled={isReadOnly || isLoading}
                        className="mr-2"
                      />
                      <span className="text-sm">{opcao}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semiologia
                  </label>
                  <textarea
                    value={formData.fisio_semiologia}
                    onChange={(e) => handleInputChange('fisio_semiologia', e.target.value)}
                    placeholder="Observações semiológicas..."
                    disabled={isReadOnly || isLoading}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testes Específicos
                  </label>
                  <textarea
                    value={formData.fisio_testesEspecificos}
                    onChange={(e) => handleInputChange('fisio_testesEspecificos', e.target.value)}
                    placeholder="Testes específicos realizados..."
                    disabled={isReadOnly || isLoading}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivos do Tratamento <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.fisio_objetivosTratamento}
                  onChange={(e) => handleInputChange('fisio_objetivosTratamento', e.target.value)}
                  placeholder="Descreva os objetivos do tratamento fisioterapêutico..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fisio_objetivosTratamento ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.fisio_objetivosTratamento && <p className="text-red-500 text-sm mt-1">{errors.fisio_objetivosTratamento}</p>}
                <p className="text-gray-500 text-xs mt-1">{formData.fisio_objetivosTratamento.length}/500 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recursos Terapêuticos
                </label>
                <textarea
                  value={formData.fisio_recursosTerapeuticos}
                  onChange={(e) => handleInputChange('fisio_recursosTerapeuticos', e.target.value)}
                  placeholder="Recursos terapêuticos a serem utilizados..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano de Tratamento
                </label>
                <textarea
                  value={formData.fisio_planoTratamento}
                  onChange={(e) => handleInputChange('fisio_planoTratamento', e.target.value)}
                  placeholder="Plano de tratamento detalhado..."
                  disabled={isReadOnly || isLoading}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Nutrição - REMOVIDO */}
          {false && activeTab === 2 && formData.tipoAssistencia === TipoAssistencia.Nutricao && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliação Nutricional</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={formData.nutri_peso}
                    onChange={(e) => {
                      handleInputChange('nutri_peso', e.target.value);
                      calculateIMC();
                    }}
                    placeholder="Ex: 70.5"
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nutri_peso ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.nutri_peso && <p className="text-red-500 text-sm mt-1">{errors.nutri_peso}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={formData.nutri_altura}
                    onChange={(e) => {
                      handleInputChange('nutri_altura', e.target.value);
                      calculateIMC();
                    }}
                    placeholder="Ex: 170"
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nutri_altura ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.nutri_altura && <p className="text-red-500 text-sm mt-1">{errors.nutri_altura}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMC
                  </label>
                  <input
                    type="text"
                    value={formData.nutri_imc}
                    readOnly
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Circunferência Abdominal (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.nutri_circunferenciaAbdominal}
                    onChange={(e) => handleInputChange('nutri_circunferenciaAbdominal', e.target.value)}
                    placeholder="Ex: 85"
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumo de Água (L/dia)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.nutri_consumoAgua}
                    onChange={(e) => handleInputChange('nutri_consumoAgua', e.target.value)}
                    placeholder="Ex: 2.0"
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atividade Física
                  </label>
                  <select
                    value={formData.nutri_atividadeFisica}
                    onChange={(e) => handleInputChange('nutri_atividadeFisica', e.target.value)}
                    disabled={isReadOnly || isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  >
                    <option value="">Selecione...</option>
                    <option value="sedentario">Sedentário</option>
                    <option value="leve">Atividade Leve</option>
                    <option value="moderada">Atividade Moderada</option>
                    <option value="intensa">Atividade Intensa</option>
                    <option value="muito_intensa">Atividade Muito Intensa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivos do Tratamento <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.nutri_objetivos}
                  onChange={(e) => handleInputChange('nutri_objetivos', e.target.value)}
                  placeholder="Ex: Perda de peso, ganho de massa muscular, controle de diabetes..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nutri_objetivos ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.nutri_objetivos && <p className="text-red-500 text-sm mt-1">{errors.nutri_objetivos}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrições Alimentares
                  </label>
                  <textarea
                    value={formData.nutri_restricoesAlimentares}
                    onChange={(e) => handleInputChange('nutri_restricoesAlimentares', e.target.value)}
                    placeholder="Ex: Lactose, glúten, vegetariano..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias Alimentares
                  </label>
                  <textarea
                    value={formData.nutri_alergias}
                    onChange={(e) => handleInputChange('nutri_alergias', e.target.value)}
                    placeholder="Ex: Amendoim, frutos do mar..."
                    disabled={isReadOnly || isLoading}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferências Alimentares
                </label>
                <textarea
                  value={formData.nutri_preferenciasAlimentares}
                  onChange={(e) => handleInputChange('nutri_preferenciasAlimentares', e.target.value)}
                  placeholder="Alimentos preferidos..."
                  disabled={isReadOnly || isLoading}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hábitos Alimentares
                </label>
                <textarea
                  value={formData.nutri_habitosAlimentares}
                  onChange={(e) => handleInputChange('nutri_habitosAlimentares', e.target.value)}
                  placeholder="Descreva os hábitos alimentares atuais, horários de refeições, frequência..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Histórico Familiar
                </label>
                <textarea
                  value={formData.nutri_historicoFamiliar}
                  onChange={(e) => handleInputChange('nutri_historicoFamiliar', e.target.value)}
                  placeholder="Histórico de doenças na família (diabetes, hipertensão, obesidade...)"
                  disabled={isReadOnly || isLoading}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suplementos em Uso
                </label>
                <textarea
                  value={formData.nutri_suplementos}
                  onChange={(e) => handleInputChange('nutri_suplementos', e.target.value)}
                  placeholder="Vitaminas, minerais, proteínas, etc..."
                  disabled={isReadOnly || isLoading}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Psicologia - Anamnese Completa - REMOVIDO */}
          {false && activeTab === 2 && formData.tipoAssistencia === TipoAssistencia.Psicologica && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Anamnese Psicológica</h3>

              {/* 1. IDENTIFICAÇÃO */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">1. IDENTIFICAÇÃO</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {renderLabel('Nome', 'psico_nome', true)}
                    <input
                      type="text"
                      value={formData.psico_nome}
                      onChange={(e) => handleInputChange('psico_nome', e.target.value)}
                      disabled={isReadOnly}
                      className={getInputClasses('psico_nome')}
                    />
                  </div>

                  <div>
                    {renderLabel('Sexo', 'psico_sexo', true)}
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_sexo"
                          checked={formData.psico_sexo === 'masculino'}
                          onChange={() => handleInputChange('psico_sexo', 'masculino')}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        <span className="text-sm">masc.</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_sexo"
                          checked={formData.psico_sexo === 'feminino'}
                          onChange={() => handleInputChange('psico_sexo', 'feminino')}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        <span className="text-sm">fem.</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trabalha
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_trabalha"
                          checked={formData.psico_trabalha === true}
                          onChange={() => handleInputChange('psico_trabalha', true)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        <span className="text-sm">sim</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_trabalha"
                          checked={formData.psico_trabalha === false}
                          onChange={() => handleInputChange('psico_trabalha', false)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        <span className="text-sm">não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={formData.psico_profissao}
                      onChange={(e) => handleInputChange('psico_profissao', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Religião
                    </label>
                    <input
                      type="text"
                      value={formData.psico_religiao}
                      onChange={(e) => handleInputChange('psico_religiao', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado civil
                    </label>
                    <input
                      type="text"
                      value={formData.psico_estadoCivil}
                      onChange={(e) => handleInputChange('psico_estadoCivil', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filhos
                    </label>
                    <input
                      type="text"
                      value={formData.psico_filhos}
                      onChange={(e) => handleInputChange('psico_filhos', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  {renderLabel('Contatos', 'psico_contato1', true)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={formData.psico_contato1}
                        onChange={(e) => handleInputChange('psico_contato1', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Contato 1"
                        className={getInputClasses('psico_contato1')}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formData.psico_quemContato1}
                        onChange={(e) => handleInputChange('psico_quemContato1', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="quem?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. HISTÓRICO DO PACIENTE */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">2. HISTÓRICO DO PACIENTE</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histórico pessoal
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    (desenvolvimento, puberdade, histórico sexual, hábitos, sintoma neurótico, lembranças significativas, qual seu local de nascimento?)
                  </p>
                  <textarea
                    value={formData.psico_historicoPessoal}
                    onChange={(e) => handleInputChange('psico_historicoPessoal', e.target.value)}
                    disabled={isReadOnly}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-3">Histórico familiar</h5>

                  {/* Mãe */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h6 className="text-sm font-medium text-gray-800 mb-3">Detalhes sobre sua mãe</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Esta viva</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="psico_maeViva"
                              checked={formData.psico_maeViva === true}
                              onChange={() => handleInputChange('psico_maeViva', true)}
                              disabled={isReadOnly}
                              className="mr-2"
                            />
                            <span className="text-sm">sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="psico_maeViva"
                              checked={formData.psico_maeViva === false}
                              onChange={() => handleInputChange('psico_maeViva', false)}
                              disabled={isReadOnly}
                              className="mr-2"
                            />
                            <span className="text-sm">não</span>
                          </label>
                        </div>
                      </div>

                      {formData.psico_maeViva === false && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Com que idade morreu</label>
                            <input
                              type="text"
                              value={formData.psico_maeIdadeMorte}
                              onChange={(e) => handleInputChange('psico_maeIdadeMorte', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sua idade quando isto aconteceu</label>
                            <input
                              type="text"
                              value={formData.psico_idadeQuandoMaeMorreu}
                              onChange={(e) => handleInputChange('psico_idadeQuandoMaeMorreu', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profissão</label>
                        <input
                          type="text"
                          value={formData.psico_maeProfissao}
                          onChange={(e) => handleInputChange('psico_maeProfissao', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relacionamento com ela</label>
                      <textarea
                        value={formData.psico_relacionamentoMae}
                        onChange={(e) => handleInputChange('psico_relacionamentoMae', e.target.value)}
                        disabled={isReadOnly}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Pai */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h6 className="text-sm font-medium text-gray-800 mb-3">Detalhes sobre seu pai</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Esta vivo</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="psico_paiVivo"
                              checked={formData.psico_paiVivo === true}
                              onChange={() => handleInputChange('psico_paiVivo', true)}
                              disabled={isReadOnly}
                              className="mr-2"
                            />
                            <span className="text-sm">sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="psico_paiVivo"
                              checked={formData.psico_paiVivo === false}
                              onChange={() => handleInputChange('psico_paiVivo', false)}
                              disabled={isReadOnly}
                              className="mr-2"
                            />
                            <span className="text-sm">não</span>
                          </label>
                        </div>
                      </div>

                      {formData.psico_paiVivo === false && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Com que idade morreu</label>
                            <input
                              type="text"
                              value={formData.psico_paiIdadeMorte}
                              onChange={(e) => handleInputChange('psico_paiIdadeMorte', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sua idade quando isto aconteceu</label>
                            <input
                              type="text"
                              value={formData.psico_idadeQuandoPaiMorreu}
                              onChange={(e) => handleInputChange('psico_idadeQuandoPaiMorreu', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profissão</label>
                        <input
                          type="text"
                          value={formData.psico_paiProfissao}
                          onChange={(e) => handleInputChange('psico_paiProfissao', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relacionamento com ele</label>
                      <textarea
                        value={formData.psico_relacionamentoPai}
                        onChange={(e) => handleInputChange('psico_relacionamentoPai', e.target.value)}
                        disabled={isReadOnly}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. HISTÓRICO CLÍNICO */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">3. HISTÓRICO CLÍNICO</h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Faz uso de medicação:</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_usaMedicacao"
                            checked={formData.psico_usaMedicacao === true}
                            onChange={() => handleInputChange('psico_usaMedicacao', true)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_usaMedicacao"
                            checked={formData.psico_usaMedicacao === false}
                            onChange={() => handleInputChange('psico_usaMedicacao', false)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          não
                        </label>
                      </div>
                      {formData.psico_usaMedicacao === true && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">qual:</label>
                          <textarea
                            value={formData.psico_qualMedicacao}
                            onChange={(e) => handleInputChange('psico_qualMedicacao', e.target.value)}
                            disabled={isReadOnly}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Já fez alguma cirurgia?:</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_fezCirurgia"
                            checked={formData.psico_fezCirurgia === true}
                            onChange={() => handleInputChange('psico_fezCirurgia', true)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_fezCirurgia"
                            checked={formData.psico_fezCirurgia === false}
                            onChange={() => handleInputChange('psico_fezCirurgia', false)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          não
                        </label>
                      </div>
                      {formData.psico_fezCirurgia === true && (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">qual:</label>
                            <input
                              type="text"
                              value={formData.psico_qualCirurgia}
                              onChange={(e) => handleInputChange('psico_qualCirurgia', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">A quanto tempo?:</label>
                            <input
                              type="text"
                              value={formData.psico_quantoTempoCirurgia}
                              onChange={(e) => handleInputChange('psico_quantoTempoCirurgia', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">A relatos de parentes com históricos de doença psíquicas?</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_relatosDoencaPsiquica"
                          checked={formData.psico_relatosDoencaPsiquica === true}
                          onChange={() => handleInputChange('psico_relatosDoencaPsiquica', true)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_relatosDoencaPsiquica"
                          checked={formData.psico_relatosDoencaPsiquica === false}
                          onChange={() => handleInputChange('psico_relatosDoencaPsiquica', false)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        não
                      </label>
                    </div>
                    {formData.psico_relatosDoencaPsiquica === true && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Caso seja sim relatar quem, grau de parentesco e como isto foi tratado?</label>
                        <textarea
                          value={formData.psico_detalhesDoencaPsiquica}
                          onChange={(e) => handleInputChange('psico_detalhesDoencaPsiquica', e.target.value)}
                          disabled={isReadOnly}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Há históricos de seus pais ou avós usarem substância psicoativas ou psicotrópicas?</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_historicoSubstancias"
                          checked={formData.psico_historicoSubstancias === true}
                          onChange={() => handleInputChange('psico_historicoSubstancias', true)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_historicoSubstancias"
                          checked={formData.psico_historicoSubstancias === false}
                          onChange={() => handleInputChange('psico_historicoSubstancias', false)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        não
                      </label>
                    </div>
                    {formData.psico_historicoSubstancias === true && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">qual?</label>
                        <input
                          type="text"
                          value={formData.psico_quaisSubstancias}
                          onChange={(e) => handleInputChange('psico_quaisSubstancias', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. HISTÓRICO PSÍQUICO */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">4. HISTÓRICO PSÍQUICO</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sentimento manifestado:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: 'psico_sentimentosMedo', label: 'medo' },
                        { key: 'psico_sentimentosRaiva', label: 'raiva' },
                        { key: 'psico_sentimentosRevolta', label: 'revolta' },
                        { key: 'psico_sentimentosCulpa', label: 'culpa/castigo' },
                        { key: 'psico_sentimentosAnsiedade', label: 'ansiedade' },
                        { key: 'psico_sentimentosSolidao', label: 'solidão/isolamento' },
                        { key: 'psico_sentimentosAngustia', label: 'angústia' },
                        { key: 'psico_sentimentosImpotencia', label: 'impotência' },
                        { key: 'psico_sentimentosAlivio', label: 'alívio' },
                        { key: 'psico_sentimentosIndiferenca', label: 'indiferença' }
                      ].map((sentimento) => (
                        <label key={sentimento.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData[sentimento.key as keyof typeof formData] as boolean}
                            onChange={(e) => handleInputChange(sentimento.key as keyof typeof formData, e.target.checked)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          <span className="text-sm">{sentimento.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">outro:</label>
                      <input
                        type="text"
                        value={formData.psico_outrosSentimentos}
                        onChange={(e) => handleInputChange('psico_outrosSentimentos', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Atendimento psicológico ou psiquiátrico anterior:</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_atendimentoAnterior"
                            checked={formData.psico_atendimentoAnterior === true}
                            onChange={() => handleInputChange('psico_atendimentoAnterior', true)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_atendimentoAnterior"
                            checked={formData.psico_atendimentoAnterior === false}
                            onChange={() => handleInputChange('psico_atendimentoAnterior', false)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          não
                        </label>
                      </div>
                      {formData.psico_atendimentoAnterior === true && (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">motivo:</label>
                            <textarea
                              value={formData.psico_motivoAtendimentoAnterior}
                              onChange={(e) => handleInputChange('psico_motivoAtendimentoAnterior', e.target.value)}
                              disabled={isReadOnly}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">A quanto tempo:</label>
                            <input
                              type="text"
                              value={formData.psico_quantoTempoAtendimento}
                              onChange={(e) => handleInputChange('psico_quantoTempoAtendimento', e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Uso de psicotrópico:</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_usoPsicotropico"
                            checked={formData.psico_usoPsicotropico === true}
                            onChange={() => handleInputChange('psico_usoPsicotropico', true)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="psico_usoPsicotropico"
                            checked={formData.psico_usoPsicotropico === false}
                            onChange={() => handleInputChange('psico_usoPsicotropico', false)}
                            disabled={isReadOnly}
                            className="mr-2"
                          />
                          não
                        </label>
                      </div>
                      {formData.psico_usoPsicotropico === true && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">qual?</label>
                          <input
                            type="text"
                            value={formData.psico_qualPsicotropico}
                            onChange={(e) => handleInputChange('psico_qualPsicotropico', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uso de substância psicoativas:</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_usoSubstanciaPsicoativa"
                          checked={formData.psico_usoSubstanciaPsicoativa === true}
                          onChange={() => handleInputChange('psico_usoSubstanciaPsicoativa', true)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="psico_usoSubstanciaPsicoativa"
                          checked={formData.psico_usoSubstanciaPsicoativa === false}
                          onChange={() => handleInputChange('psico_usoSubstanciaPsicoativa', false)}
                          disabled={isReadOnly}
                          className="mr-2"
                        />
                        não
                      </label>
                    </div>
                    {formData.psico_usoSubstanciaPsicoativa === true && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">qual:</label>
                        <input
                          type="text"
                          value={formData.psico_qualSubstanciaPsicoativa}
                          onChange={(e) => handleInputChange('psico_qualSubstanciaPsicoativa', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. CONHECENDO A QUEIXA DO PACIENTE */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">5. CONHECENDO A QUEIXA DO PACIENTE</h4>

                <div className="space-y-4">
                  <div>
                    {renderLabel('Principal queixa (O que está lhe incomodando?)', 'psico_queixaPrincipal', true)}
                    <textarea
                      value={formData.psico_queixaPrincipal}
                      onChange={(e) => handleInputChange('psico_queixaPrincipal', e.target.value)}
                      disabled={isReadOnly}
                      rows={4}
                      className={getInputClasses('psico_queixaPrincipal')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Queixa secundária (O que lhe incomoda?)</label>
                    <textarea
                      value={formData.psico_queixaSecundaria}
                      onChange={(e) => handleInputChange('psico_queixaSecundaria', e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">O que você espera como resultado das sessões?</label>
                    <textarea
                      value={formData.psico_expectativaSessoes}
                      onChange={(e) => handleInputChange('psico_expectativaSessoes', e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* 6. INFORMAÇÕES ADICIONAIS */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">6. INFORMAÇÕES ADICIONAIS</h4>
                <textarea
                  value={formData.psico_informacoesAdicionais}
                  onChange={(e) => handleInputChange('psico_informacoesAdicionais', e.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* 7. QUAL A CLASSIFICAÇÃO DO PACIENTE */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">7. QUAL A CLASSIFICAÇÃO DO PACIENTE</h4>
                <div className="max-w-md">
                  {renderLabel('Selecione a classificação do paciente', 'psico_classificacao', true)}
                  <select
                    value={formData.psico_classificacao}
                    onChange={(e) => handleInputChange('psico_classificacao', e.target.value)}
                    disabled={isReadOnly}
                    className={`${getInputClasses('psico_classificacao')} ${
                      formData.psico_classificacao === 'vermelho' ? 'text-red-600 font-medium' :
                      formData.psico_classificacao === 'amarelo' ? 'text-yellow-600 font-medium' :
                      formData.psico_classificacao === 'roxo' ? 'text-purple-600 font-medium' :
                      formData.psico_classificacao === 'verde' ? 'text-green-600 font-medium' :
                      'text-gray-700'
                    }`}
                  >
                    <option value="" className="text-gray-700">Selecione uma classificação...</option>
                    <option value="vermelho" className="text-red-600 font-medium">🔴 VERMELHO - Atenção Crítica</option>
                    <option value="amarelo" className="text-yellow-600 font-medium">🟡 AMARELO - Estado de Atenção</option>
                    <option value="roxo" className="text-purple-600 font-medium">🟣 ROXO - Baixa Complexidade</option>
                    <option value="verde" className="text-green-600 font-medium">🟢 VERDE - Estado de Equilíbrio</option>
                  </select>

                  {formData.psico_classificacao && (
                    <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                      formData.psico_classificacao === 'vermelho' ? 'bg-red-50 border-red-400' :
                      formData.psico_classificacao === 'amarelo' ? 'bg-yellow-50 border-yellow-400' :
                      formData.psico_classificacao === 'roxo' ? 'bg-purple-50 border-purple-400' :
                      formData.psico_classificacao === 'verde' ? 'bg-green-50 border-green-400' :
                      'bg-gray-50 border-gray-400'
                    }`}>
                      <div className={`text-sm font-medium ${
                        formData.psico_classificacao === 'vermelho' ? 'text-red-800' :
                        formData.psico_classificacao === 'amarelo' ? 'text-yellow-800' :
                        formData.psico_classificacao === 'roxo' ? 'text-purple-800' :
                        formData.psico_classificacao === 'verde' ? 'text-green-800' :
                        'text-gray-800'
                      }`}>
                        {formData.psico_classificacao === 'vermelho' && '🔴 VERMELHO - Atenção Crítica'}
                        {formData.psico_classificacao === 'amarelo' && '🟡 AMARELO - Estado de Atenção'}
                        {formData.psico_classificacao === 'roxo' && '🟣 ROXO - Baixa Complexidade'}
                        {formData.psico_classificacao === 'verde' && '🟢 VERDE - Estado de Equilíbrio'}
                      </div>
                      <div className={`text-xs mt-1 ${
                        formData.psico_classificacao === 'vermelho' ? 'text-red-600' :
                        formData.psico_classificacao === 'amarelo' ? 'text-yellow-600' :
                        formData.psico_classificacao === 'roxo' ? 'text-purple-600' :
                        formData.psico_classificacao === 'verde' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {formData.psico_classificacao === 'vermelho' && 'Paciente requer atenção imediata e acompanhamento intensivo'}
                        {formData.psico_classificacao === 'amarelo' && 'Paciente requer atenção especial e monitoramento regular'}
                        {formData.psico_classificacao === 'roxo' && 'Paciente com demandas de baixa complexidade'}
                        {formData.psico_classificacao === 'verde' && 'Paciente em estado de equilíbrio emocional'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. QUAIS DEMANDA */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">8. QUAIS DEMANDAS</h4>
                <textarea
                  value={formData.psico_demandas}
                  onChange={(e) => handleInputChange('psico_demandas', e.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* 9. JUSTIFICATIVA DA DEMANDA */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-800 border-b border-gray-200 pb-2">9. JUSTIFICATIVA DA DEMANDA</h4>
                <textarea
                  value={formData.psico_justificativaDemanda}
                  onChange={(e) => handleInputChange('psico_justificativaDemanda', e.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {/* Mensagem de validação */}
          {mode !== 'view' && !isFormValid && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Preencha todos os campos obrigatórios (marcados com <span className="text-red-600 font-bold">*</span>) para habilitar o agendamento.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {mode === 'view' ? 'Fechar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button
                onClick={handleSave}
                disabled={isLoading || !isFormValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isFormValid ? 'Preencha todos os campos obrigatórios' : ''}
              >
                {isLoading ? '⏳ Salvando...' : (mode === 'edit' ? '✅ Atualizar' : '📅 Agendar')}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AgendamentoAssistenciaModalEnhanced;
