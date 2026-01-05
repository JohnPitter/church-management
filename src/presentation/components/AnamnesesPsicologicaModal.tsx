import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface AnamnesesPsicologicaData {
  id?: string;
  // 1. IDENTIFICAÇÃO
  nome: string;
  nascimento: string;
  sexo: 'masculino' | 'feminino' | '';
  trabalha: boolean | null;
  profissao: string;
  religiao: string;
  estadoCivil: string;
  filhos: string;
  contato1: string;
  quemContato1: string;
  contato2: string;
  quemContato2: string;
  contato3: string;
  quemContato3: string;

  // 2. HISTÓRICO DO PACIENTE
  historicoPessoal: string;

  // Histórico Familiar
  maeViva: boolean | null;
  maeIdadeMorte: string;
  idadeQuandoMaeMorreu: string;
  maeProfissao: string;
  relacionamentoMae: string;

  paiVivo: boolean | null;
  paiIdadeMorte: string;
  idadeQuandoPaiMorreu: string;
  paiProfissao: string;
  relacionamentoPai: string;

  filhoUnico: boolean | null;
  irmaosVivos: boolean | null;
  quemMorreuIrmaos: string;
  idadeMorteIrmaos: string;
  idadeQuandoIrmasMorreram: string;
  profissaoIrmaos: string;
  relacionamentoIrmaos: string;

  filhosVivos: boolean | null;
  quemMorreuFilhos: string;
  idadeMorteFilhos: string;
  idadeQuandoFilhosMorreram: string;
  profissaoFilhos: string;
  idadeFilhos: string;
  relacionamentoFilhos: string;

  avosVivos: boolean | null;
  quemMorreuAvos: string;
  idadeMorteAvos: string;
  idadeQuandoAvosMorreram: string;
  profissaoAvos: string;
  idadeAvo: string;
  idadeAvó: string;
  relacionamentoAvos: string;

  // Informações sobre o lar
  comoCasa: string;
  ruaViolencia: boolean | null;
  detalhesViolencia: string;
  apoioFamiliar: boolean | null;
  detalhesApoio: string;
  reacaoFamilia: string;

  // Histórico Escolar
  formacaoAcademica: 'superior_incompleto' | 'superior_completo' | 'medio_incompleto' | 'medio_completo' | 'basico' | '';
  gostavaEscola: boolean | null;
  porqueEscola: string;
  situacoesImportantesEscola: string;
  situacaoEnvergonhosaEscola: string;
  sentePerseguidoEscola: boolean | null;
  relatoPerseguicaoEscola: string;
  gostaAmbienteEscolar: boolean | null;
  porqueAmbienteEscolar: string;
  fatoIncomodoEscola: boolean | null;
  detalheFatoEscola: string;

  // Trabalho
  empresa: string;
  gostaTrabalho: boolean | null;
  porqueTrabalho: string;
  situacoesImportantesTrabalho: string;
  situacaoEnvergonhosaTrabalho: string;
  sentePerseguidoTrabalho: boolean | null;
  relatoPerseguicaoTrabalho: string;
  gostaAmbienteTrabalho: boolean | null;
  porqueAmbienteTrabalho: string;
  algoIncomodaEmpresa: boolean | null;
  detalheIncomodaEmpresa: string;

  // Relacionamento Interpessoal
  dificuldadeRelacionamento: boolean | null;
  quantosAmigos: string;
  introvertidoExtrovertido: string;
  cumprimentaPessoas: boolean | null;
  pessoaSolicita: boolean | null;
  detalheAmizades: string;

  // Relação com rua/bairro
  tempoMorando: string;
  gostaMorar: boolean | null;
  porqueMorar: string;

  // Relação familiar após sintomas
  rotinaFamiliaMudou: boolean | null;
  mudancasRotina: string;

  // 3. HISTÓRICO CLÍNICO
  usaMedicacao: boolean | null;
  qualMedicacao: string;
  fezCirurgia: boolean | null;
  qualCirurgia: string;
  quantoTempoCirurgia: string;
  puerperio: boolean | null;
  quantosDiasPuerperio: string;
  relatosDoencaPsiquica: boolean | null;
  detalhesDoencaPsiquica: string;
  historicoSubstancias: boolean | null;
  quaisSubstancias: string;

  // 4. HISTÓRICO PSÍQUICO
  sentimentosMedo: boolean;
  sentimentosRaiva: boolean;
  sentimentosRevolta: boolean;
  sentimentosCulpa: boolean;
  sentimentosAnsiedade: boolean;
  sentimentosSolidao: boolean;
  sentimentosAngustia: boolean;
  sentimentosImpotencia: boolean;
  sentimentosAlivio: boolean;
  sentimentosIndiferenca: boolean;
  outrosSentimentos: string;

  atendimentoAnterior: boolean | null;
  motivoAtendimentoAnterior: string;
  quantoTempoAtendimento: string;
  usoPsicotropico: boolean | null;
  qualPsicotropico: string;
  usoSubstanciaPsicoativa: boolean | null;
  qualSubstanciaPsicoativa: string;

  // 5. CONHECENDO A QUEIXA DO PACIENTE
  queixaPrincipal: string;
  queixaSecundaria: string;
  expectativaSessoes: string;

  // 6. INFORMAÇÕES ADICIONAIS
  informacoesAdicionais: string;

  // 7. CLASSIFICAÇÃO DO PACIENTE
  classificacao: 'vermelho' | 'amarelo' | 'roxo' | 'verde' | '';

  // 8. DEMANDAS
  demandas: string;

  // 9. JUSTIFICATIVA DA DEMANDA
  justificativaDemanda: string;

  // Metadados
  profissionalId?: string;
  profissionalNome?: string;
  assistidoId?: string;
  dataPreenchimento?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AnamnesesPsicologicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AnamnesesPsicologicaData) => void;
  anamnese?: AnamnesesPsicologicaData | null;
  mode: 'create' | 'edit' | 'view';
  assistidoId?: string;
  assistidoNome?: string;
}

const AnamnesesPsicologicaModal: React.FC<AnamnesesPsicologicaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  anamnese,
  mode,
  assistidoId,
  assistidoNome
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<AnamnesesPsicologicaData>({
    nome: '',
    nascimento: '',
    sexo: '',
    trabalha: null,
    profissao: '',
    religiao: '',
    estadoCivil: '',
    filhos: '',
    contato1: '',
    quemContato1: '',
    contato2: '',
    quemContato2: '',
    contato3: '',
    quemContato3: '',
    historicoPessoal: '',
    maeViva: null,
    maeIdadeMorte: '',
    idadeQuandoMaeMorreu: '',
    maeProfissao: '',
    relacionamentoMae: '',
    paiVivo: null,
    paiIdadeMorte: '',
    idadeQuandoPaiMorreu: '',
    paiProfissao: '',
    relacionamentoPai: '',
    filhoUnico: null,
    irmaosVivos: null,
    quemMorreuIrmaos: '',
    idadeMorteIrmaos: '',
    idadeQuandoIrmasMorreram: '',
    profissaoIrmaos: '',
    relacionamentoIrmaos: '',
    filhosVivos: null,
    quemMorreuFilhos: '',
    idadeMorteFilhos: '',
    idadeQuandoFilhosMorreram: '',
    profissaoFilhos: '',
    idadeFilhos: '',
    relacionamentoFilhos: '',
    avosVivos: null,
    quemMorreuAvos: '',
    idadeMorteAvos: '',
    idadeQuandoAvosMorreram: '',
    profissaoAvos: '',
    idadeAvo: '',
    idadeAvó: '',
    relacionamentoAvos: '',
    comoCasa: '',
    ruaViolencia: null,
    detalhesViolencia: '',
    apoioFamiliar: null,
    detalhesApoio: '',
    reacaoFamilia: '',
    formacaoAcademica: '',
    gostavaEscola: null,
    porqueEscola: '',
    situacoesImportantesEscola: '',
    situacaoEnvergonhosaEscola: '',
    sentePerseguidoEscola: null,
    relatoPerseguicaoEscola: '',
    gostaAmbienteEscolar: null,
    porqueAmbienteEscolar: '',
    fatoIncomodoEscola: null,
    detalheFatoEscola: '',
    empresa: '',
    gostaTrabalho: null,
    porqueTrabalho: '',
    situacoesImportantesTrabalho: '',
    situacaoEnvergonhosaTrabalho: '',
    sentePerseguidoTrabalho: null,
    relatoPerseguicaoTrabalho: '',
    gostaAmbienteTrabalho: null,
    porqueAmbienteTrabalho: '',
    algoIncomodaEmpresa: null,
    detalheIncomodaEmpresa: '',
    dificuldadeRelacionamento: null,
    quantosAmigos: '',
    introvertidoExtrovertido: '',
    cumprimentaPessoas: null,
    pessoaSolicita: null,
    detalheAmizades: '',
    tempoMorando: '',
    gostaMorar: null,
    porqueMorar: '',
    rotinaFamiliaMudou: null,
    mudancasRotina: '',
    usaMedicacao: null,
    qualMedicacao: '',
    fezCirurgia: null,
    qualCirurgia: '',
    quantoTempoCirurgia: '',
    puerperio: null,
    quantosDiasPuerperio: '',
    relatosDoencaPsiquica: null,
    detalhesDoencaPsiquica: '',
    historicoSubstancias: null,
    quaisSubstancias: '',
    sentimentosMedo: false,
    sentimentosRaiva: false,
    sentimentosRevolta: false,
    sentimentosCulpa: false,
    sentimentosAnsiedade: false,
    sentimentosSolidao: false,
    sentimentosAngustia: false,
    sentimentosImpotencia: false,
    sentimentosAlivio: false,
    sentimentosIndiferenca: false,
    outrosSentimentos: '',
    atendimentoAnterior: null,
    motivoAtendimentoAnterior: '',
    quantoTempoAtendimento: '',
    usoPsicotropico: null,
    qualPsicotropico: '',
    usoSubstanciaPsicoativa: null,
    qualSubstanciaPsicoativa: '',
    queixaPrincipal: '',
    queixaSecundaria: '',
    expectativaSessoes: '',
    informacoesAdicionais: '',
    classificacao: '',
    demandas: '',
    justificativaDemanda: '',
    assistidoId: assistidoId || '',
    profissionalId: currentUser?.id || '',
    profissionalNome: currentUser?.email || '',
    dataPreenchimento: new Date()
  });

  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (anamnese) {
      setFormData(anamnese);
    } else if (assistidoNome) {
      setFormData(prev => ({
        ...prev,
        nome: assistidoNome,
        assistidoId: assistidoId || ''
      }));
    }
  }, [anamnese, assistidoNome, assistidoId]);

  const handleInputChange = (field: keyof AnamnesesPsicologicaData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooleanChange = (field: keyof AnamnesesPsicologicaData, value: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof AnamnesesPsicologicaData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave: AnamnesesPsicologicaData = {
      ...formData,
      id: anamnese?.id || `anamnese_${Date.now()}`,
      dataPreenchimento: new Date(),
      updatedAt: new Date(),
      createdAt: anamnese?.createdAt || new Date()
    };

    onSave(dataToSave);
    onClose();
  };

  const isViewMode = mode === 'view';

  const sections = [
    { id: 'identificacao', title: '1. IDENTIFICAÇÃO', icon: '👤' },
    { id: 'historico', title: '2. HISTÓRICO DO PACIENTE', icon: '📋' },
    { id: 'clinico', title: '3. HISTÓRICO CLÍNICO', icon: '🏥' },
    { id: 'psiquico', title: '4. HISTÓRICO PSÍQUICO', icon: '🧠' },
    { id: 'queixa', title: '5. QUEIXA DO PACIENTE', icon: '💬' },
    { id: 'adicional', title: '6. INFORMAÇÕES ADICIONAIS', icon: '📝' },
    { id: 'classificacao', title: '7. CLASSIFICAÇÃO', icon: '🎯' },
    { id: 'demandas', title: '8. DEMANDAS', icon: '📊' },
    { id: 'justificativa', title: '9. JUSTIFICATIVA', icon: '✍️' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🧠 Anamnese Psicológica
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create' ? 'Nova anamnese' : mode === 'edit' ? 'Editando anamnese' : 'Visualizando anamnese'}
              {formData.nome && ` - ${formData.nome}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  activeSection === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span>{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[60vh] p-6">
            {/* Seção 1: Identificação */}
            {activeSection === 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">1. IDENTIFICAÇÃO</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome:
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nascimento:
                    </label>
                    <input
                      type="date"
                      value={formData.nascimento}
                      onChange={(e) => handleInputChange('nascimento', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sexo:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sexo"
                          value="masculino"
                          checked={formData.sexo === 'masculino'}
                          onChange={(e) => handleInputChange('sexo', e.target.value)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Masculino
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sexo"
                          value="feminino"
                          checked={formData.sexo === 'feminino'}
                          onChange={(e) => handleInputChange('sexo', e.target.value)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Feminino
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trabalha:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="trabalha"
                          checked={formData.trabalha === true}
                          onChange={() => handleBooleanChange('trabalha', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="trabalha"
                          checked={formData.trabalha === false}
                          onChange={() => handleBooleanChange('trabalha', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissão:
                    </label>
                    <input
                      type="text"
                      value={formData.profissao}
                      onChange={(e) => handleInputChange('profissao', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Religião:
                    </label>
                    <input
                      type="text"
                      value={formData.religiao}
                      onChange={(e) => handleInputChange('religiao', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado Civil:
                    </label>
                    <input
                      type="text"
                      value={formData.estadoCivil}
                      onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filhos:
                    </label>
                    <input
                      type="text"
                      value={formData.filhos}
                      onChange={(e) => handleInputChange('filhos', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Contatos</h4>

                  {[1, 2, 3].map((num) => (
                    <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contato {num}:
                        </label>
                        <input
                          type="text"
                          value={formData[`contato${num}` as keyof AnamnesesPsicologicaData] as string}
                          onChange={(e) => handleInputChange(`contato${num}` as keyof AnamnesesPsicologicaData, e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quem:
                        </label>
                        <input
                          type="text"
                          value={formData[`quemContato${num}` as keyof AnamnesesPsicologicaData] as string}
                          onChange={(e) => handleInputChange(`quemContato${num}` as keyof AnamnesesPsicologicaData, e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção 2: Histórico do Paciente */}
            {activeSection === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">2. HISTÓRICO DO PACIENTE</h3>

                {/* Histórico Pessoal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histórico pessoal: (desenvolvimento, puberdade, histórico sexual, hábitos, sintoma neurótico, lembranças significativas, qual seu local de nascimento?)
                  </label>
                  <textarea
                    value={formData.historicoPessoal}
                    onChange={(e) => handleInputChange('historicoPessoal', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Histórico Familiar - Mãe */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações sobre a Mãe</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Está viva:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="maeViva"
                            checked={formData.maeViva === true}
                            onChange={() => handleBooleanChange('maeViva', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="maeViva"
                            checked={formData.maeViva === false}
                            onChange={() => handleBooleanChange('maeViva', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.maeViva === false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Com que idade morreu:
                          </label>
                          <input
                            type="text"
                            value={formData.maeIdadeMorte}
                            onChange={(e) => handleInputChange('maeIdadeMorte', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Qual era sua idade quando isto aconteceu:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeQuandoMaeMorreu}
                            onChange={(e) => handleInputChange('idadeQuandoMaeMorreu', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trabalha ou trabalhava com que:
                      </label>
                      <input
                        type="text"
                        value={formData.maeProfissao}
                        onChange={(e) => handleInputChange('maeProfissao', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale o que você se lembra do relacionamento com ela:
                      </label>
                      <textarea
                        value={formData.relacionamentoMae}
                        onChange={(e) => handleInputChange('relacionamentoMae', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico Familiar - Pai */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações sobre o Pai</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Está vivo:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paiVivo"
                            checked={formData.paiVivo === true}
                            onChange={() => handleBooleanChange('paiVivo', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paiVivo"
                            checked={formData.paiVivo === false}
                            onChange={() => handleBooleanChange('paiVivo', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.paiVivo === false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Com que idade morreu:
                          </label>
                          <input
                            type="text"
                            value={formData.paiIdadeMorte}
                            onChange={(e) => handleInputChange('paiIdadeMorte', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Qual era sua idade quando isto aconteceu:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeQuandoPaiMorreu}
                            onChange={(e) => handleInputChange('idadeQuandoPaiMorreu', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trabalha ou trabalhava com que:
                      </label>
                      <input
                        type="text"
                        value={formData.paiProfissao}
                        onChange={(e) => handleInputChange('paiProfissao', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale o que você se lembra do relacionamento com ele:
                      </label>
                      <textarea
                        value={formData.relacionamentoPai}
                        onChange={(e) => handleInputChange('relacionamentoPai', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico Familiar - Irmãos */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações sobre os Irmãos</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filho único:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="filhoUnico"
                            checked={formData.filhoUnico === true}
                            onChange={() => handleBooleanChange('filhoUnico', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="filhoUnico"
                            checked={formData.filhoUnico === false}
                            onChange={() => handleBooleanChange('filhoUnico', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.filhoUnico === false && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Irmãos estão vivos:
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="irmaosVivos"
                                checked={formData.irmaosVivos === true}
                                onChange={() => handleBooleanChange('irmaosVivos', true)}
                                disabled={isViewMode}
                                className="mr-2"
                              />
                              Sim
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="irmaosVivos"
                                checked={formData.irmaosVivos === false}
                                onChange={() => handleBooleanChange('irmaosVivos', false)}
                                disabled={isViewMode}
                                className="mr-2"
                              />
                              Não
                            </label>
                          </div>
                        </div>

                        {formData.irmaosVivos === false && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quem morreu:
                              </label>
                              <input
                                type="text"
                                value={formData.quemMorreuIrmaos}
                                onChange={(e) => handleInputChange('quemMorreuIrmaos', e.target.value)}
                                disabled={isViewMode}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Com que idade morreram:
                              </label>
                              <input
                                type="text"
                                value={formData.idadeMorteIrmaos}
                                onChange={(e) => handleInputChange('idadeMorteIrmaos', e.target.value)}
                                disabled={isViewMode}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Qual era sua idade quando aconteceu:
                              </label>
                              <input
                                type="text"
                                value={formData.idadeQuandoIrmasMorreram}
                                onChange={(e) => handleInputChange('idadeQuandoIrmasMorreram', e.target.value)}
                                disabled={isViewMode}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trabalham ou trabalhavam com que:
                          </label>
                          <input
                            type="text"
                            value={formData.profissaoIrmaos}
                            onChange={(e) => handleInputChange('profissaoIrmaos', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fale o que você se lembra do relacionamento com eles:
                          </label>
                          <textarea
                            value={formData.relacionamentoIrmaos}
                            onChange={(e) => handleInputChange('relacionamentoIrmaos', e.target.value)}
                            disabled={isViewMode}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Histórico Familiar - Filhos */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações sobre os Filhos</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filhos estão vivos:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="filhosVivos"
                            checked={formData.filhosVivos === true}
                            onChange={() => handleBooleanChange('filhosVivos', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="filhosVivos"
                            checked={formData.filhosVivos === false}
                            onChange={() => handleBooleanChange('filhosVivos', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.filhosVivos === false && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quem morreu:
                          </label>
                          <input
                            type="text"
                            value={formData.quemMorreuFilhos}
                            onChange={(e) => handleInputChange('quemMorreuFilhos', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Com que idade morreram:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeMorteFilhos}
                            onChange={(e) => handleInputChange('idadeMorteFilhos', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Qual era sua idade quando aconteceu:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeQuandoFilhosMorreram}
                            onChange={(e) => handleInputChange('idadeQuandoFilhosMorreram', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trabalham ou trabalhavam com que:
                      </label>
                      <input
                        type="text"
                        value={formData.profissaoFilhos}
                        onChange={(e) => handleInputChange('profissaoFilhos', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qual a idade deles:
                      </label>
                      <input
                        type="text"
                        value={formData.idadeFilhos}
                        onChange={(e) => handleInputChange('idadeFilhos', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale o que você se lembra do relacionamento com eles:
                      </label>
                      <textarea
                        value={formData.relacionamentoFilhos}
                        onChange={(e) => handleInputChange('relacionamentoFilhos', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico Familiar - Avós */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações sobre os Avós</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avós estão vivos:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="avosVivos"
                            checked={formData.avosVivos === true}
                            onChange={() => handleBooleanChange('avosVivos', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="avosVivos"
                            checked={formData.avosVivos === false}
                            onChange={() => handleBooleanChange('avosVivos', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.avosVivos === false && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quem morreu:
                          </label>
                          <input
                            type="text"
                            value={formData.quemMorreuAvos}
                            onChange={(e) => handleInputChange('quemMorreuAvos', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Com que idade morreram:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeMorteAvos}
                            onChange={(e) => handleInputChange('idadeMorteAvos', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Qual era sua idade quando aconteceu:
                          </label>
                          <input
                            type="text"
                            value={formData.idadeQuandoAvosMorreram}
                            onChange={(e) => handleInputChange('idadeQuandoAvosMorreram', e.target.value)}
                            disabled={isViewMode}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trabalham ou trabalhavam com que:
                      </label>
                      <input
                        type="text"
                        value={formData.profissaoAvos}
                        onChange={(e) => handleInputChange('profissaoAvos', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qual a idade da avó:
                        </label>
                        <input
                          type="text"
                          value={formData.idadeAvó}
                          onChange={(e) => handleInputChange('idadeAvó', e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qual a idade do avô:
                        </label>
                        <input
                          type="text"
                          value={formData.idadeAvo}
                          onChange={(e) => handleInputChange('idadeAvo', e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale o que você se lembra do relacionamento com eles:
                      </label>
                      <textarea
                        value={formData.relacionamentoAvos}
                        onChange={(e) => handleInputChange('relacionamentoAvos', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações sobre o Lar */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Fale um pouco sobre seu lar</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Como é a casa:
                      </label>
                      <textarea
                        value={formData.comoCasa}
                        onChange={(e) => handleInputChange('comoCasa', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        A rua tem muita história de violência:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="ruaViolencia"
                            checked={formData.ruaViolencia === true}
                            onChange={() => handleBooleanChange('ruaViolencia', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="ruaViolencia"
                            checked={formData.ruaViolencia === false}
                            onChange={() => handleBooleanChange('ruaViolencia', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.ruaViolencia === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Se sim, fale um pouco sobre:
                        </label>
                        <textarea
                          value={formData.detalhesViolencia}
                          onChange={(e) => handleInputChange('detalhesViolencia', e.target.value)}
                          disabled={isViewMode}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Apoio Familiar */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Apoio Familiar</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sua família lhe apoia:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="apoioFamiliar"
                            checked={formData.apoioFamiliar === true}
                            onChange={() => handleBooleanChange('apoioFamiliar', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="apoioFamiliar"
                            checked={formData.apoioFamiliar === false}
                            onChange={() => handleBooleanChange('apoioFamiliar', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Como é este apoio ou não apoio, relate:
                      </label>
                      <textarea
                        value={formData.detalhesApoio}
                        onChange={(e) => handleInputChange('detalhesApoio', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Como sua família está reagindo com você neste período que está vivendo:
                      </label>
                      <textarea
                        value={formData.reacaoFamilia}
                        onChange={(e) => handleInputChange('reacaoFamilia', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico Escolar */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico Escolar</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formação Acadêmica:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="formacaoAcademica"
                            value="superior_incompleto"
                            checked={formData.formacaoAcademica === 'superior_incompleto'}
                            onChange={(e) => handleInputChange('formacaoAcademica', e.target.value)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Superior incompleto
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="formacaoAcademica"
                            value="superior_completo"
                            checked={formData.formacaoAcademica === 'superior_completo'}
                            onChange={(e) => handleInputChange('formacaoAcademica', e.target.value)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Superior completo
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="formacaoAcademica"
                            value="medio_incompleto"
                            checked={formData.formacaoAcademica === 'medio_incompleto'}
                            onChange={(e) => handleInputChange('formacaoAcademica', e.target.value)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Ensino médio incompleto
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="formacaoAcademica"
                            value="medio_completo"
                            checked={formData.formacaoAcademica === 'medio_completo'}
                            onChange={(e) => handleInputChange('formacaoAcademica', e.target.value)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Ensino médio completo
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="formacaoAcademica"
                            value="basico"
                            checked={formData.formacaoAcademica === 'basico'}
                            onChange={(e) => handleInputChange('formacaoAcademica', e.target.value)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Educação básica
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você gostava da escola:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostavaEscola"
                            checked={formData.gostavaEscola === true}
                            onChange={() => handleBooleanChange('gostavaEscola', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostavaEscola"
                            checked={formData.gostavaEscola === false}
                            onChange={() => handleBooleanChange('gostavaEscola', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Por quê:
                      </label>
                      <textarea
                        value={formData.porqueEscola}
                        onChange={(e) => handleInputChange('porqueEscola', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quais situações mais importantes que você viveu na escola:
                      </label>
                      <textarea
                        value={formData.situacoesImportantesEscola}
                        onChange={(e) => handleInputChange('situacoesImportantesEscola', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tem ou houve alguma situação que tenha lhe deixado envergonhado(a) e lhe marcado(a):
                      </label>
                      <textarea
                        value={formData.situacaoEnvergonhosaEscola}
                        onChange={(e) => handleInputChange('situacaoEnvergonhosaEscola', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você se sente perseguido:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sentePerseguidoEscola"
                            checked={formData.sentePerseguidoEscola === true}
                            onChange={() => handleBooleanChange('sentePerseguidoEscola', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sentePerseguidoEscola"
                            checked={formData.sentePerseguidoEscola === false}
                            onChange={() => handleBooleanChange('sentePerseguidoEscola', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.sentePerseguidoEscola === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pode relatar:
                        </label>
                        <textarea
                          value={formData.relatoPerseguicaoEscola}
                          onChange={(e) => handleInputChange('relatoPerseguicaoEscola', e.target.value)}
                          disabled={isViewMode}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gosta do ambiente escolar:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaAmbienteEscolar"
                            checked={formData.gostaAmbienteEscolar === true}
                            onChange={() => handleBooleanChange('gostaAmbienteEscolar', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaAmbienteEscolar"
                            checked={formData.gostaAmbienteEscolar === false}
                            onChange={() => handleBooleanChange('gostaAmbienteEscolar', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Por que:
                      </label>
                      <textarea
                        value={formData.porqueAmbienteEscolar}
                        onChange={(e) => handleInputChange('porqueAmbienteEscolar', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Há algum fato que tenha acontecido no ambiente escolar que lhe incomode:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="fatoIncomodoEscola"
                            checked={formData.fatoIncomodoEscola === true}
                            onChange={() => handleBooleanChange('fatoIncomodoEscola', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="fatoIncomodoEscola"
                            checked={formData.fatoIncomodoEscola === false}
                            onChange={() => handleBooleanChange('fatoIncomodoEscola', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.fatoIncomodoEscola === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Por quê:
                        </label>
                        <textarea
                          value={formData.detalheFatoEscola}
                          onChange={(e) => handleInputChange('detalheFatoEscola', e.target.value)}
                          disabled={isViewMode}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Trabalho */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Trabalho</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qual empresa você trabalha:
                      </label>
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => handleInputChange('empresa', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você gosta:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaTrabalho"
                            checked={formData.gostaTrabalho === true}
                            onChange={() => handleBooleanChange('gostaTrabalho', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaTrabalho"
                            checked={formData.gostaTrabalho === false}
                            onChange={() => handleBooleanChange('gostaTrabalho', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Por quê:
                      </label>
                      <textarea
                        value={formData.porqueTrabalho}
                        onChange={(e) => handleInputChange('porqueTrabalho', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quais situações foram ou foi mais importante que você viveu na empresa:
                      </label>
                      <textarea
                        value={formData.situacoesImportantesTrabalho}
                        onChange={(e) => handleInputChange('situacoesImportantesTrabalho', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tem ou houve alguma situação que tenha lhe deixado envergonhado(a) e lhe marcado(a):
                      </label>
                      <textarea
                        value={formData.situacaoEnvergonhosaTrabalho}
                        onChange={(e) => handleInputChange('situacaoEnvergonhosaTrabalho', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você se sente perseguido:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sentePerseguidoTrabalho"
                            checked={formData.sentePerseguidoTrabalho === true}
                            onChange={() => handleBooleanChange('sentePerseguidoTrabalho', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sentePerseguidoTrabalho"
                            checked={formData.sentePerseguidoTrabalho === false}
                            onChange={() => handleBooleanChange('sentePerseguidoTrabalho', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.sentePerseguidoTrabalho === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pode relatar:
                        </label>
                        <textarea
                          value={formData.relatoPerseguicaoTrabalho}
                          onChange={(e) => handleInputChange('relatoPerseguicaoTrabalho', e.target.value)}
                          disabled={isViewMode}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gosta do ambiente:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaAmbienteTrabalho"
                            checked={formData.gostaAmbienteTrabalho === true}
                            onChange={() => handleBooleanChange('gostaAmbienteTrabalho', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaAmbienteTrabalho"
                            checked={formData.gostaAmbienteTrabalho === false}
                            onChange={() => handleBooleanChange('gostaAmbienteTrabalho', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Por que:
                      </label>
                      <textarea
                        value={formData.porqueAmbienteTrabalho}
                        onChange={(e) => handleInputChange('porqueAmbienteTrabalho', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tem algo que lhe incomoda na empresa:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="algoIncomodaEmpresa"
                            checked={formData.algoIncomodaEmpresa === true}
                            onChange={() => handleBooleanChange('algoIncomodaEmpresa', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="algoIncomodaEmpresa"
                            checked={formData.algoIncomodaEmpresa === false}
                            onChange={() => handleBooleanChange('algoIncomodaEmpresa', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    {formData.algoIncomodaEmpresa === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          O quê:
                        </label>
                        <textarea
                          value={formData.detalheIncomodaEmpresa}
                          onChange={(e) => handleInputChange('detalheIncomodaEmpresa', e.target.value)}
                          disabled={isViewMode}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Histórico de Relacionamento Interpessoal */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico de Relacionamento Interpessoal</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dificuldade em se relacionar com pessoas:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="dificuldadeRelacionamento"
                            checked={formData.dificuldadeRelacionamento === true}
                            onChange={() => handleBooleanChange('dificuldadeRelacionamento', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="dificuldadeRelacionamento"
                            checked={formData.dificuldadeRelacionamento === false}
                            onChange={() => handleBooleanChange('dificuldadeRelacionamento', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantos amigos você tem:
                      </label>
                      <input
                        type="text"
                        value={formData.quantosAmigos}
                        onChange={(e) => handleInputChange('quantosAmigos', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você se considera uma pessoa introvertida ou extrovertida:
                      </label>
                      <input
                        type="text"
                        value={formData.introvertidoExtrovertido}
                        onChange={(e) => handleInputChange('introvertidoExtrovertido', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ao chegar nos ambientes você cumprimenta as pessoas:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cumprimentaPessoas"
                            checked={formData.cumprimentaPessoas === true}
                            onChange={() => handleBooleanChange('cumprimentaPessoas', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cumprimentaPessoas"
                            checked={formData.cumprimentaPessoas === false}
                            onChange={() => handleBooleanChange('cumprimentaPessoas', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você é uma pessoa solícita:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pessoaSolicita"
                            checked={formData.pessoaSolicita === true}
                            onChange={() => handleBooleanChange('pessoaSolicita', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pessoaSolicita"
                            checked={formData.pessoaSolicita === false}
                            onChange={() => handleBooleanChange('pessoaSolicita', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale um pouco das amizades:
                      </label>
                      <textarea
                        value={formData.detalheAmizades}
                        onChange={(e) => handleInputChange('detalheAmizades', e.target.value)}
                        disabled={isViewMode}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico da relação com a rua ou bairro */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico da relação com a rua ou bairro que mora</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        A quanto tempo você mora:
                      </label>
                      <input
                        type="text"
                        value={formData.tempoMorando}
                        onChange={(e) => handleInputChange('tempoMorando', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gosta de morar:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaMorar"
                            checked={formData.gostaMorar === true}
                            onChange={() => handleBooleanChange('gostaMorar', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gostaMorar"
                            checked={formData.gostaMorar === false}
                            onChange={() => handleBooleanChange('gostaMorar', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Por que:
                      </label>
                      <textarea
                        value={formData.porqueMorar}
                        onChange={(e) => handleInputChange('porqueMorar', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Histórico da relação com a família após apresentação dos sintomas */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico da relação com a família após apresentação dos sintomas</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Você acha que a rotina da família mudou, após os sintomas:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="rotinaFamiliaMudou"
                            checked={formData.rotinaFamiliaMudou === true}
                            onChange={() => handleBooleanChange('rotinaFamiliaMudou', true)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Sim
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="rotinaFamiliaMudou"
                            checked={formData.rotinaFamiliaMudou === false}
                            onChange={() => handleBooleanChange('rotinaFamiliaMudou', false)}
                            disabled={isViewMode}
                            className="mr-2"
                          />
                          Não
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fale um pouco quais foram as mudanças:
                      </label>
                      <textarea
                        value={formData.mudancasRotina}
                        onChange={(e) => handleInputChange('mudancasRotina', e.target.value)}
                        disabled={isViewMode}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seção 3: Histórico Clínico */}
            {activeSection === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">3. HISTÓRICO CLÍNICO</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Faz uso de medicação:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="usaMedicacao"
                          checked={formData.usaMedicacao === true}
                          onChange={() => handleBooleanChange('usaMedicacao', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="usaMedicacao"
                          checked={formData.usaMedicacao === false}
                          onChange={() => handleBooleanChange('usaMedicacao', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {formData.usaMedicacao === true && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qual medicação:
                      </label>
                      <textarea
                        value={formData.qualMedicacao}
                        onChange={(e) => handleInputChange('qualMedicacao', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Já fez alguma cirurgia:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fezCirurgia"
                          checked={formData.fezCirurgia === true}
                          onChange={() => handleBooleanChange('fezCirurgia', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fezCirurgia"
                          checked={formData.fezCirurgia === false}
                          onChange={() => handleBooleanChange('fezCirurgia', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {formData.fezCirurgia === true && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qual cirurgia:
                        </label>
                        <input
                          type="text"
                          value={formData.qualCirurgia}
                          onChange={(e) => handleInputChange('qualCirurgia', e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          A quanto tempo:
                        </label>
                        <input
                          type="text"
                          value={formData.quantoTempoCirurgia}
                          onChange={(e) => handleInputChange('quantoTempoCirurgia', e.target.value)}
                          disabled={isViewMode}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puerpério:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="puerperio"
                          checked={formData.puerperio === true}
                          onChange={() => handleBooleanChange('puerperio', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="puerperio"
                          checked={formData.puerperio === false}
                          onChange={() => handleBooleanChange('puerperio', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {formData.puerperio === true && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantos dias:
                      </label>
                      <input
                        type="text"
                        value={formData.quantosDiasPuerperio}
                        onChange={(e) => handleInputChange('quantosDiasPuerperio', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Há relatos de parentes com histórico de doenças psíquicas:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="relatosDoencaPsiquica"
                          checked={formData.relatosDoencaPsiquica === true}
                          onChange={() => handleBooleanChange('relatosDoencaPsiquica', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="relatosDoencaPsiquica"
                          checked={formData.relatosDoencaPsiquica === false}
                          onChange={() => handleBooleanChange('relatosDoencaPsiquica', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {formData.relatosDoencaPsiquica === true && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relatar quem, grau de parentesco e como isto foi tratado:
                      </label>
                      <textarea
                        value={formData.detalhesDoencaPsiquica}
                        onChange={(e) => handleInputChange('detalhesDoencaPsiquica', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Há histórico de seus pais ou avós usarem substâncias psicoativas ou psicotrópicas:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="historicoSubstancias"
                          checked={formData.historicoSubstancias === true}
                          onChange={() => handleBooleanChange('historicoSubstancias', true)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Sim
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="historicoSubstancias"
                          checked={formData.historicoSubstancias === false}
                          onChange={() => handleBooleanChange('historicoSubstancias', false)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {formData.historicoSubstancias === true && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quais substâncias:
                      </label>
                      <input
                        type="text"
                        value={formData.quaisSubstancias}
                        onChange={(e) => handleInputChange('quaisSubstancias', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seção 4: Histórico Psíquico */}
            {activeSection === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">4. HISTÓRICO PSÍQUICO</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Sentimentos manifestados:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'sentimentosMedo', label: 'Medo' },
                      { key: 'sentimentosRaiva', label: 'Raiva' },
                      { key: 'sentimentosRevolta', label: 'Revolta' },
                      { key: 'sentimentosCulpa', label: 'Culpa/Castigo' },
                      { key: 'sentimentosAnsiedade', label: 'Ansiedade' },
                      { key: 'sentimentosSolidao', label: 'Solidão/Isolamento' },
                      { key: 'sentimentosAngustia', label: 'Angústia' },
                      { key: 'sentimentosImpotencia', label: 'Impotência' },
                      { key: 'sentimentosAlivio', label: 'Alívio' },
                      { key: 'sentimentosIndiferenca', label: 'Indiferença' }
                    ].map((sentiment) => (
                      <label key={sentiment.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData[sentiment.key as keyof AnamnesesPsicologicaData] as boolean}
                          onChange={() => handleCheckboxChange(sentiment.key as keyof AnamnesesPsicologicaData)}
                          disabled={isViewMode}
                          className="mr-2"
                        />
                        {sentiment.label}
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outros sentimentos:
                    </label>
                    <input
                      type="text"
                      value={formData.outrosSentimentos}
                      onChange={(e) => handleInputChange('outrosSentimentos', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atendimento psicológico ou psiquiátrico anterior:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atendimentoAnterior"
                        checked={formData.atendimentoAnterior === true}
                        onChange={() => handleBooleanChange('atendimentoAnterior', true)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Sim
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atendimentoAnterior"
                        checked={formData.atendimentoAnterior === false}
                        onChange={() => handleBooleanChange('atendimentoAnterior', false)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Não
                    </label>
                  </div>
                </div>

                {formData.atendimentoAnterior === true && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo:
                      </label>
                      <textarea
                        value={formData.motivoAtendimentoAnterior}
                        onChange={(e) => handleInputChange('motivoAtendimentoAnterior', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        A quanto tempo:
                      </label>
                      <input
                        type="text"
                        value={formData.quantoTempoAtendimento}
                        onChange={(e) => handleInputChange('quantoTempoAtendimento', e.target.value)}
                        disabled={isViewMode}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uso de psicotrópico:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="usoPsicotropico"
                        checked={formData.usoPsicotropico === true}
                        onChange={() => handleBooleanChange('usoPsicotropico', true)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Sim
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="usoPsicotropico"
                        checked={formData.usoPsicotropico === false}
                        onChange={() => handleBooleanChange('usoPsicotropico', false)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Não
                    </label>
                  </div>
                </div>

                {formData.usoPsicotropico === true && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qual:
                    </label>
                    <input
                      type="text"
                      value={formData.qualPsicotropico}
                      onChange={(e) => handleInputChange('qualPsicotropico', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uso de substância psicoativa:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="usoSubstanciaPsicoativa"
                        checked={formData.usoSubstanciaPsicoativa === true}
                        onChange={() => handleBooleanChange('usoSubstanciaPsicoativa', true)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Sim
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="usoSubstanciaPsicoativa"
                        checked={formData.usoSubstanciaPsicoativa === false}
                        onChange={() => handleBooleanChange('usoSubstanciaPsicoativa', false)}
                        disabled={isViewMode}
                        className="mr-2"
                      />
                      Não
                    </label>
                  </div>
                </div>

                {formData.usoSubstanciaPsicoativa === true && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qual:
                    </label>
                    <input
                      type="text"
                      value={formData.qualSubstanciaPsicoativa}
                      onChange={(e) => handleInputChange('qualSubstanciaPsicoativa', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Seção 5: Conhecendo a Queixa do Paciente */}
            {activeSection === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">5. CONHECENDO A QUEIXA DO PACIENTE</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal queixa - O que está lhe incomodando?
                  </label>
                  <textarea
                    value={formData.queixaPrincipal}
                    onChange={(e) => handleInputChange('queixaPrincipal', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Queixa secundária - O que lhe incomoda?
                  </label>
                  <textarea
                    value={formData.queixaSecundaria}
                    onChange={(e) => handleInputChange('queixaSecundaria', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O que você espera como resultado das sessões?
                  </label>
                  <textarea
                    value={formData.expectativaSessoes}
                    onChange={(e) => handleInputChange('expectativaSessoes', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {/* Seção 6: Informações Adicionais */}
            {activeSection === 5 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">6. INFORMAÇÕES ADICIONAIS</h3>

                <div>
                  <textarea
                    value={formData.informacoesAdicionais}
                    onChange={(e) => handleInputChange('informacoesAdicionais', e.target.value)}
                    disabled={isViewMode}
                    rows={6}
                    placeholder="Digite aqui qualquer informação adicional relevante..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {/* Seção 7: Classificação do Paciente */}
            {activeSection === 6 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">7. QUAL A CLASSIFICAÇÃO DO PACIENTE</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Selecione a classificação:
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="classificacao"
                        value="vermelho"
                        checked={formData.classificacao === 'vermelho'}
                        onChange={(e) => handleInputChange('classificacao', e.target.value)}
                        disabled={isViewMode}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                        <span className="font-medium">VERMELHO - Atenção Crítica</span>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="classificacao"
                        value="amarelo"
                        checked={formData.classificacao === 'amarelo'}
                        onChange={(e) => handleInputChange('classificacao', e.target.value)}
                        disabled={isViewMode}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="font-medium">AMARELO - Estado Atenção</span>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="classificacao"
                        value="roxo"
                        checked={formData.classificacao === 'roxo'}
                        onChange={(e) => handleInputChange('classificacao', e.target.value)}
                        disabled={isViewMode}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                        <span className="font-medium">ROXO - Baixa Complexidade</span>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="classificacao"
                        value="verde"
                        checked={formData.classificacao === 'verde'}
                        onChange={(e) => handleInputChange('classificacao', e.target.value)}
                        disabled={isViewMode}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">VERDE - Estado de Equilíbrio</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Seção 8: Demandas */}
            {activeSection === 7 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">8. QUAIS DEMANDAS</h3>

                <div>
                  <textarea
                    value={formData.demandas}
                    onChange={(e) => handleInputChange('demandas', e.target.value)}
                    disabled={isViewMode}
                    rows={6}
                    placeholder="Descreva as demandas identificadas..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {/* Seção 9: Justificativa da Demanda */}
            {activeSection === 8 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">9. JUSTIFICATIVA DA DEMANDA</h3>

                <div>
                  <textarea
                    value={formData.justificativaDemanda}
                    onChange={(e) => handleInputChange('justificativaDemanda', e.target.value)}
                    disabled={isViewMode}
                    rows={6}
                    placeholder="Justifique as demandas identificadas..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                disabled={activeSection === sections.length - 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo →
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {mode === 'create' ? 'Salvar Anamnese' : 'Atualizar Anamnese'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnamnesesPsicologicaModal;