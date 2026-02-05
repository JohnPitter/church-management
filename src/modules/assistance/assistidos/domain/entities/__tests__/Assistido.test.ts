// Unit Tests - Assistido Entity
// Comprehensive tests for assisted individuals management

import {
  Assistido,
  EnderecoAssistido,
  FamiliarAssistido,
  AtendimentoAssistido,
  ItemDoacao,
  StatusAssistido,
  SituacaoFamiliar,
  Escolaridade,
  NecessidadeAssistido,
  TipoMoradia,
  TipoParentesco,
  TipoAtendimento,
  AssistidoEntity
} from '../Assistido';

// Helper function to create a valid Assistido object for testing
const createMockAssistido = (overrides: Partial<Assistido> = {}): Assistido => ({
  id: 'assistido-1',
  nome: 'João da Silva',
  cpf: '529.982.247-25',
  rg: '12.345.678-9',
  dataNascimento: new Date(1985, 5, 15),
  telefone: '11999999999',
  email: 'joao@example.com',
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100'
  },
  situacaoFamiliar: SituacaoFamiliar.Casado,
  rendaFamiliar: 2000,
  profissao: 'Pedreiro',
  escolaridade: Escolaridade.MedioCompleto,
  necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Medicamento],
  tipoMoradia: TipoMoradia.Alugada,
  quantidadeComodos: 4,
  possuiCadUnico: true,
  qualBeneficio: 'Bolsa Família',
  observacoes: 'Família em situação de vulnerabilidade',
  status: StatusAssistido.Ativo,
  dataInicioAtendimento: new Date(2024, 0, 1),
  dataUltimoAtendimento: new Date(2024, 11, 15),
  responsavelAtendimento: 'Maria Assistente Social',
  familiares: [],
  atendimentos: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
  ...overrides
});

const createMockFamiliar = (overrides: Partial<FamiliarAssistido> = {}): FamiliarAssistido => ({
  id: 'familiar-1',
  nome: 'Ana da Silva',
  parentesco: TipoParentesco.Esposa,
  dataNascimento: new Date(1987, 3, 20),
  cpf: '987.654.321-00',
  telefone: '11988888888',
  profissao: 'Diarista',
  renda: 800,
  ...overrides
});

const createMockAtendimento = (overrides: Partial<AtendimentoAssistido> = {}): AtendimentoAssistido => ({
  id: 'atendimento-1',
  data: new Date(2024, 11, 15),
  tipo: TipoAtendimento.CestaBasica,
  descricao: 'Entrega de cesta básica mensal',
  itensDoados: [
    { item: 'Arroz', quantidade: 2, unidade: 'kg', valor: 15 },
    { item: 'Feijão', quantidade: 1, unidade: 'kg', valor: 10 }
  ],
  valorDoacao: 150,
  proximoRetorno: new Date(2025, 0, 15),
  responsavel: 'Maria Assistente Social',
  observacoes: 'Família muito grata',
  ...overrides
});

describe('Enums', () => {
  describe('StatusAssistido', () => {
    it('should have all expected values', () => {
      expect(StatusAssistido.Ativo).toBe('ativo');
      expect(StatusAssistido.Inativo).toBe('inativo');
      expect(StatusAssistido.Suspenso).toBe('suspenso');
      expect(StatusAssistido.Transferido).toBe('transferido');
    });

    it('should have exactly 4 status values', () => {
      const statusValues = Object.values(StatusAssistido);
      expect(statusValues).toHaveLength(4);
    });
  });

  describe('SituacaoFamiliar', () => {
    it('should have all expected values', () => {
      expect(SituacaoFamiliar.Solteiro).toBe('solteiro');
      expect(SituacaoFamiliar.Casado).toBe('casado');
      expect(SituacaoFamiliar.Divorciado).toBe('divorciado');
      expect(SituacaoFamiliar.Viuvo).toBe('viuvo');
      expect(SituacaoFamiliar.UniaoEstavel).toBe('uniao_estavel');
    });

    it('should have exactly 5 situation values', () => {
      const situacaoValues = Object.values(SituacaoFamiliar);
      expect(situacaoValues).toHaveLength(5);
    });
  });

  describe('Escolaridade', () => {
    it('should have all expected values', () => {
      expect(Escolaridade.Analfabeto).toBe('analfabeto');
      expect(Escolaridade.FundamentalIncompleto).toBe('fundamental_incompleto');
      expect(Escolaridade.FundamentalCompleto).toBe('fundamental_completo');
      expect(Escolaridade.MedioIncompleto).toBe('medio_incompleto');
      expect(Escolaridade.MedioCompleto).toBe('medio_completo');
      expect(Escolaridade.SuperiorIncompleto).toBe('superior_incompleto');
      expect(Escolaridade.SuperiorCompleto).toBe('superior_completo');
      expect(Escolaridade.PosGraduacao).toBe('pos_graduacao');
    });

    it('should have exactly 8 education levels', () => {
      const escolaridadeValues = Object.values(Escolaridade);
      expect(escolaridadeValues).toHaveLength(8);
    });
  });

  describe('NecessidadeAssistido', () => {
    it('should have all expected values', () => {
      expect(NecessidadeAssistido.Alimentacao).toBe('alimentacao');
      expect(NecessidadeAssistido.Medicamento).toBe('medicamento');
      expect(NecessidadeAssistido.Vestuario).toBe('vestuario');
      expect(NecessidadeAssistido.Moradia).toBe('moradia');
      expect(NecessidadeAssistido.Emprego).toBe('emprego');
      expect(NecessidadeAssistido.Educacao).toBe('educacao');
      expect(NecessidadeAssistido.Saude).toBe('saude');
      expect(NecessidadeAssistido.Transporte).toBe('transporte');
      expect(NecessidadeAssistido.Documentacao).toBe('documentacao');
      expect(NecessidadeAssistido.Juridico).toBe('juridico');
      expect(NecessidadeAssistido.Psicologico).toBe('psicologico');
      expect(NecessidadeAssistido.Espiritual).toBe('espiritual');
      expect(NecessidadeAssistido.Outros).toBe('outros');
    });

    it('should have exactly 13 need types', () => {
      const necessidadeValues = Object.values(NecessidadeAssistido);
      expect(necessidadeValues).toHaveLength(13);
    });
  });

  describe('TipoMoradia', () => {
    it('should have all expected values', () => {
      expect(TipoMoradia.Alugada).toBe('alugada');
      expect(TipoMoradia.Propria).toBe('propria');
    });

    it('should have exactly 2 housing types', () => {
      const tipoMoradiaValues = Object.values(TipoMoradia);
      expect(tipoMoradiaValues).toHaveLength(2);
    });
  });

  describe('TipoParentesco', () => {
    it('should have all expected values', () => {
      expect(TipoParentesco.Pai).toBe('pai');
      expect(TipoParentesco.Mae).toBe('mae');
      expect(TipoParentesco.Filho).toBe('filho');
      expect(TipoParentesco.Filha).toBe('filha');
      expect(TipoParentesco.Esposo).toBe('esposo');
      expect(TipoParentesco.Esposa).toBe('esposa');
      expect(TipoParentesco.Irmao).toBe('irmao');
      expect(TipoParentesco.Irma).toBe('irma');
      expect(TipoParentesco.Avo).toBe('avo');
      expect(TipoParentesco.Avoa).toBe('avoa');
      expect(TipoParentesco.Neto).toBe('neto');
      expect(TipoParentesco.Neta).toBe('neta');
      expect(TipoParentesco.Tio).toBe('tio');
      expect(TipoParentesco.Tia).toBe('tia');
      expect(TipoParentesco.Primo).toBe('primo');
      expect(TipoParentesco.Prima).toBe('prima');
      expect(TipoParentesco.Outro).toBe('outro');
    });

    it('should have exactly 17 relationship types', () => {
      const tipoParentescoValues = Object.values(TipoParentesco);
      expect(tipoParentescoValues).toHaveLength(17);
    });
  });

  describe('TipoAtendimento', () => {
    it('should have all expected values', () => {
      expect(TipoAtendimento.CestaBasica).toBe('cesta_basica');
      expect(TipoAtendimento.Donativos).toBe('donativos');
      expect(TipoAtendimento.Medicamento).toBe('medicamento');
      expect(TipoAtendimento.Vestuario).toBe('vestuario');
      expect(TipoAtendimento.Orientacao).toBe('orientacao');
      expect(TipoAtendimento.EncaminhamentoMedico).toBe('encaminhamento_medico');
      expect(TipoAtendimento.EncaminhamentoJuridico).toBe('encaminhamento_juridico');
      expect(TipoAtendimento.AconselhamentoEspiritual).toBe('aconselhamento_espiritual');
      expect(TipoAtendimento.AuxilioFinanceiro).toBe('auxilio_financeiro');
      expect(TipoAtendimento.Documentacao).toBe('documentacao');
      expect(TipoAtendimento.Outro).toBe('outro');
    });

    it('should have exactly 11 service types', () => {
      const tipoAtendimentoValues = Object.values(TipoAtendimento);
      expect(tipoAtendimentoValues).toHaveLength(11);
    });
  });
});

describe('AssistidoEntity', () => {
  describe('Status Methods', () => {
    describe('isAtivo', () => {
      it('should return true for active assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Ativo });
        expect(AssistidoEntity.isAtivo(assistido)).toBe(true);
      });

      it('should return false for inactive assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Inativo });
        expect(AssistidoEntity.isAtivo(assistido)).toBe(false);
      });

      it('should return false for suspended assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Suspenso });
        expect(AssistidoEntity.isAtivo(assistido)).toBe(false);
      });

      it('should return false for transferred assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Transferido });
        expect(AssistidoEntity.isAtivo(assistido)).toBe(false);
      });
    });

    describe('podeReceberAtendimento', () => {
      it('should return true for active assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Ativo });
        expect(AssistidoEntity.podeReceberAtendimento(assistido)).toBe(true);
      });

      it('should return false for inactive assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Inativo });
        expect(AssistidoEntity.podeReceberAtendimento(assistido)).toBe(false);
      });

      it('should return false for suspended assistido', () => {
        const assistido = createMockAssistido({ status: StatusAssistido.Suspenso });
        expect(AssistidoEntity.podeReceberAtendimento(assistido)).toBe(false);
      });
    });

    describe('getStatusColor', () => {
      it('should return green for active status', () => {
        expect(AssistidoEntity.getStatusColor(StatusAssistido.Ativo)).toBe('green');
      });

      it('should return gray for inactive status', () => {
        expect(AssistidoEntity.getStatusColor(StatusAssistido.Inativo)).toBe('gray');
      });

      it('should return yellow for suspended status', () => {
        expect(AssistidoEntity.getStatusColor(StatusAssistido.Suspenso)).toBe('yellow');
      });

      it('should return blue for transferred status', () => {
        expect(AssistidoEntity.getStatusColor(StatusAssistido.Transferido)).toBe('blue');
      });
    });
  });

  describe('Age Calculation', () => {
    describe('calcularIdade', () => {
      it('should calculate age correctly for past birthdays this year', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() - 1, today.getDate());
        expect(AssistidoEntity.calcularIdade(birthDate)).toBe(30);
      });

      it('should calculate age correctly for future birthdays this year', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());
        expect(AssistidoEntity.calcularIdade(birthDate)).toBe(29);
      });

      it('should handle birthday today', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
        expect(AssistidoEntity.calcularIdade(birthDate)).toBe(25);
      });

      it('should handle birthday tomorrow (same month)', () => {
        const today = new Date();
        if (today.getDate() > 1) {
          const birthDate = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate() + 1);
          expect(AssistidoEntity.calcularIdade(birthDate)).toBe(39);
        }
      });

      it('should calculate age for newborn (0 years)', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        expect(AssistidoEntity.calcularIdade(birthDate)).toBe(0);
      });

      it('should calculate age for elderly person', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 90, today.getMonth() - 1, 1);
        expect(AssistidoEntity.calcularIdade(birthDate)).toBe(90);
      });
    });
  });

  describe('Income Calculations', () => {
    describe('calcularRendaPerCapita', () => {
      it('should calculate per capita income for single person', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: 1000,
          familiares: []
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(1000);
      });

      it('should calculate per capita income for family of 2', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: 2000,
          familiares: [createMockFamiliar()]
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(1000);
      });

      it('should calculate per capita income for family of 5', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: 5000,
          familiares: [
            createMockFamiliar({ id: 'f1' }),
            createMockFamiliar({ id: 'f2' }),
            createMockFamiliar({ id: 'f3' }),
            createMockFamiliar({ id: 'f4' })
          ]
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(1000);
      });

      it('should return 0 when rendaFamiliar is undefined', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: undefined,
          familiares: [createMockFamiliar()]
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(0);
      });

      it('should return 0 when rendaFamiliar is 0', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: 0,
          familiares: [createMockFamiliar()]
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(0);
      });

      it('should handle decimal per capita values', () => {
        const assistido = createMockAssistido({
          rendaFamiliar: 1000,
          familiares: [
            createMockFamiliar({ id: 'f1' }),
            createMockFamiliar({ id: 'f2' })
          ]
        });
        expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBeCloseTo(333.33, 2);
      });
    });
  });

  describe('Needs Management', () => {
    describe('temNecessidade', () => {
      it('should return true when assistido has the specified need', () => {
        const assistido = createMockAssistido({
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Medicamento]
        });
        expect(AssistidoEntity.temNecessidade(assistido, NecessidadeAssistido.Alimentacao)).toBe(true);
      });

      it('should return false when assistido does not have the specified need', () => {
        const assistido = createMockAssistido({
          necessidades: [NecessidadeAssistido.Alimentacao]
        });
        expect(AssistidoEntity.temNecessidade(assistido, NecessidadeAssistido.Moradia)).toBe(false);
      });

      it('should return false for empty needs array', () => {
        const assistido = createMockAssistido({
          necessidades: []
        });
        expect(AssistidoEntity.temNecessidade(assistido, NecessidadeAssistido.Alimentacao)).toBe(false);
      });
    });

    describe('formatarNecessidades', () => {
      it('should format all needs correctly', () => {
        const necessidades = [
          NecessidadeAssistido.Alimentacao,
          NecessidadeAssistido.Medicamento,
          NecessidadeAssistido.Vestuario
        ];
        const formatted = AssistidoEntity.formatarNecessidades(necessidades);
        expect(formatted).toEqual(['Alimentação', 'Medicamento', 'Vestuário']);
      });

      it('should return empty array for empty input', () => {
        const formatted = AssistidoEntity.formatarNecessidades([]);
        expect(formatted).toEqual([]);
      });

      it('should format single need', () => {
        const formatted = AssistidoEntity.formatarNecessidades([NecessidadeAssistido.Psicologico]);
        expect(formatted).toEqual(['Psicológico']);
      });

      it('should format all possible needs', () => {
        const allNeeds = Object.values(NecessidadeAssistido);
        const formatted = AssistidoEntity.formatarNecessidades(allNeeds);
        expect(formatted).toHaveLength(13);
        expect(formatted).toContain('Alimentação');
        expect(formatted).toContain('Saúde');
        expect(formatted).toContain('Espiritual');
        expect(formatted).toContain('Outros');
      });
    });
  });

  describe('Attendance Tracking', () => {
    describe('diasDesdeUltimoAtendimento', () => {
      it('should return null when dataUltimoAtendimento is undefined', () => {
        const assistido = createMockAssistido({
          dataUltimoAtendimento: undefined
        });
        expect(AssistidoEntity.diasDesdeUltimoAtendimento(assistido)).toBeNull();
      });

      it('should return 0 for attendance today', () => {
        const assistido = createMockAssistido({
          dataUltimoAtendimento: new Date()
        });
        expect(AssistidoEntity.diasDesdeUltimoAtendimento(assistido)).toBe(0);
      });

      it('should calculate days correctly for past attendance', () => {
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);

        const assistido = createMockAssistido({
          dataUltimoAtendimento: tenDaysAgo
        });
        expect(AssistidoEntity.diasDesdeUltimoAtendimento(assistido)).toBe(10);
      });

      it('should handle attendance from previous year', () => {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const assistido = createMockAssistido({
          dataUltimoAtendimento: oneYearAgo
        });
        const days = AssistidoEntity.diasDesdeUltimoAtendimento(assistido);
        expect(days).toBeGreaterThanOrEqual(365);
        expect(days).toBeLessThanOrEqual(366);
      });
    });

    describe('precisaRetorno', () => {
      it('should return false when there are no attendances', () => {
        const assistido = createMockAssistido({
          atendimentos: []
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(false);
      });

      it('should return false when last attendance has no return date', () => {
        const atendimento = createMockAtendimento({
          proximoRetorno: undefined
        });
        const assistido = createMockAssistido({
          atendimentos: [atendimento]
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(false);
      });

      it('should return true when return date has passed', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const atendimento = createMockAtendimento({
          data: new Date(2024, 10, 1),
          proximoRetorno: yesterday
        });
        const assistido = createMockAssistido({
          atendimentos: [atendimento]
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(true);
      });

      it('should return true when return date is today', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const atendimento = createMockAtendimento({
          data: new Date(2024, 10, 1),
          proximoRetorno: today
        });
        const assistido = createMockAssistido({
          atendimentos: [atendimento]
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(true);
      });

      it('should return false when return date is in the future', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const atendimento = createMockAtendimento({
          data: new Date(),
          proximoRetorno: tomorrow
        });
        const assistido = createMockAssistido({
          atendimentos: [atendimento]
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(false);
      });

      it('should use the most recent attendance for return check', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const olderAtendimento = createMockAtendimento({
          id: 'old',
          data: new Date(2024, 9, 1),
          proximoRetorno: yesterday
        });
        const newerAtendimento = createMockAtendimento({
          id: 'new',
          data: new Date(2024, 11, 1),
          proximoRetorno: nextWeek
        });

        const assistido = createMockAssistido({
          atendimentos: [olderAtendimento, newerAtendimento]
        });
        expect(AssistidoEntity.precisaRetorno(assistido)).toBe(false);
      });
    });
  });

  describe('Personal Data Validation', () => {
    describe('validarCPF', () => {
      it('should return true for empty CPF (optional field)', () => {
        expect(AssistidoEntity.validarCPF('')).toBe(true);
      });

      it('should return true for undefined CPF (optional field)', () => {
        expect(AssistidoEntity.validarCPF(undefined as unknown as string)).toBe(true);
      });

      it('should validate correct CPF with formatting', () => {
        expect(AssistidoEntity.validarCPF('529.982.247-25')).toBe(true);
      });

      it('should validate correct CPF without formatting', () => {
        expect(AssistidoEntity.validarCPF('52998224725')).toBe(true);
      });

      it('should reject CPF with all same digits', () => {
        expect(AssistidoEntity.validarCPF('111.111.111-11')).toBe(false);
        expect(AssistidoEntity.validarCPF('000.000.000-00')).toBe(false);
        expect(AssistidoEntity.validarCPF('999.999.999-99')).toBe(false);
      });

      it('should reject CPF with invalid check digits', () => {
        expect(AssistidoEntity.validarCPF('123.456.789-00')).toBe(false);
        expect(AssistidoEntity.validarCPF('529.982.247-26')).toBe(false);
      });

      it('should reject CPF with wrong length', () => {
        expect(AssistidoEntity.validarCPF('123')).toBe(false);
        expect(AssistidoEntity.validarCPF('12345678901234')).toBe(false);
        expect(AssistidoEntity.validarCPF('1234567890')).toBe(false);
      });
    });

    describe('validarTelefone', () => {
      it('should validate 11-digit phone (mobile)', () => {
        expect(AssistidoEntity.validarTelefone('11999999999')).toBe(true);
      });

      it('should validate 10-digit phone (landline)', () => {
        expect(AssistidoEntity.validarTelefone('1199999999')).toBe(true);
      });

      it('should validate formatted phone', () => {
        expect(AssistidoEntity.validarTelefone('(11) 99999-9999')).toBe(true);
        expect(AssistidoEntity.validarTelefone('(11) 9999-9999')).toBe(true);
      });

      it('should reject empty phone', () => {
        expect(AssistidoEntity.validarTelefone('')).toBe(false);
      });

      it('should reject phone with too few digits', () => {
        expect(AssistidoEntity.validarTelefone('123456789')).toBe(false);
        expect(AssistidoEntity.validarTelefone('123')).toBe(false);
      });

      it('should reject phone with too many digits', () => {
        expect(AssistidoEntity.validarTelefone('123456789012')).toBe(false);
      });
    });

    describe('validarEmail', () => {
      it('should return true for empty email (optional field)', () => {
        expect(AssistidoEntity.validarEmail('')).toBe(true);
        expect(AssistidoEntity.validarEmail(undefined)).toBe(true);
      });

      it('should validate correct email formats', () => {
        expect(AssistidoEntity.validarEmail('test@example.com')).toBe(true);
        expect(AssistidoEntity.validarEmail('user.name@domain.org')).toBe(true);
        expect(AssistidoEntity.validarEmail('user+tag@domain.co.uk')).toBe(true);
      });

      it('should reject invalid email formats', () => {
        expect(AssistidoEntity.validarEmail('invalid')).toBe(false);
        expect(AssistidoEntity.validarEmail('invalid@')).toBe(false);
        expect(AssistidoEntity.validarEmail('@domain.com')).toBe(false);
        expect(AssistidoEntity.validarEmail('user@.com')).toBe(false);
        expect(AssistidoEntity.validarEmail('user @domain.com')).toBe(false);
      });
    });

    describe('validarNome', () => {
      it('should validate names with minimum length', () => {
        expect(AssistidoEntity.validarNome('Jo')).toBe(true);
        expect(AssistidoEntity.validarNome('Ana')).toBe(true);
      });

      it('should validate names with maximum length', () => {
        const longName = 'A'.repeat(100);
        expect(AssistidoEntity.validarNome(longName)).toBe(true);
      });

      it('should reject empty name', () => {
        expect(AssistidoEntity.validarNome('')).toBe(false);
      });

      it('should reject name with only whitespace', () => {
        expect(AssistidoEntity.validarNome('   ')).toBe(false);
      });

      it('should reject name too short', () => {
        expect(AssistidoEntity.validarNome('J')).toBe(false);
      });

      it('should reject name too long', () => {
        const tooLongName = 'A'.repeat(101);
        expect(AssistidoEntity.validarNome(tooLongName)).toBe(false);
      });

      it('should trim name before validation', () => {
        expect(AssistidoEntity.validarNome('  Jo  ')).toBe(true);
      });
    });

    describe('validarDataNascimento', () => {
      it('should validate current date (newborn)', () => {
        const today = new Date();
        expect(AssistidoEntity.validarDataNascimento(today)).toBe(true);
      });

      it('should validate date 100 years ago', () => {
        const centenarian = new Date();
        centenarian.setFullYear(centenarian.getFullYear() - 100);
        expect(AssistidoEntity.validarDataNascimento(centenarian)).toBe(true);
      });

      it('should validate date at maximum age (150 years)', () => {
        const maxAge = new Date();
        maxAge.setFullYear(maxAge.getFullYear() - 150);
        expect(AssistidoEntity.validarDataNascimento(maxAge)).toBe(true);
      });

      it('should reject future dates', () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        expect(AssistidoEntity.validarDataNascimento(future)).toBe(false);
      });

      it('should reject dates beyond 150 years', () => {
        const tooOld = new Date();
        tooOld.setFullYear(tooOld.getFullYear() - 151);
        expect(AssistidoEntity.validarDataNascimento(tooOld)).toBe(false);
      });
    });

    describe('validarRendaFamiliar', () => {
      it('should return true for undefined income (optional field)', () => {
        expect(AssistidoEntity.validarRendaFamiliar(undefined)).toBe(true);
      });

      it('should return true for null income (optional field)', () => {
        expect(AssistidoEntity.validarRendaFamiliar(null as unknown as number)).toBe(true);
      });

      it('should validate zero income', () => {
        expect(AssistidoEntity.validarRendaFamiliar(0)).toBe(true);
      });

      it('should validate positive income', () => {
        expect(AssistidoEntity.validarRendaFamiliar(1500.50)).toBe(true);
        expect(AssistidoEntity.validarRendaFamiliar(999999)).toBe(true);
      });

      it('should reject negative income', () => {
        expect(AssistidoEntity.validarRendaFamiliar(-100)).toBe(false);
      });

      it('should reject income above maximum', () => {
        expect(AssistidoEntity.validarRendaFamiliar(1000000)).toBe(false);
      });
    });
  });

  describe('Housing Validation', () => {
    describe('validarQuantidadeComodos', () => {
      it('should validate valid room count', () => {
        expect(AssistidoEntity.validarQuantidadeComodos(1)).toBe(true);
        expect(AssistidoEntity.validarQuantidadeComodos(5)).toBe(true);
        expect(AssistidoEntity.validarQuantidadeComodos(20)).toBe(true);
      });

      it('should reject zero rooms', () => {
        expect(AssistidoEntity.validarQuantidadeComodos(0)).toBe(false);
      });

      it('should reject negative rooms', () => {
        expect(AssistidoEntity.validarQuantidadeComodos(-1)).toBe(false);
      });

      it('should reject rooms above maximum', () => {
        expect(AssistidoEntity.validarQuantidadeComodos(21)).toBe(false);
      });

      it('should reject non-integer values', () => {
        expect(AssistidoEntity.validarQuantidadeComodos(2.5)).toBe(false);
      });
    });

    describe('formatarTipoMoradia', () => {
      it('should format rented housing correctly', () => {
        expect(AssistidoEntity.formatarTipoMoradia(TipoMoradia.Alugada)).toBe('Alugada');
      });

      it('should format owned housing correctly', () => {
        expect(AssistidoEntity.formatarTipoMoradia(TipoMoradia.Propria)).toBe('Própria');
      });
    });
  });

  describe('Address Validation', () => {
    describe('validarEndereco', () => {
      it('should return empty array for valid address', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310-100'
        };
        expect(AssistidoEntity.validarEndereco(endereco)).toEqual([]);
      });

      it('should detect invalid logradouro', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Ru',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310-100'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('Logradouro deve ter pelo menos 3 caracteres');
      });

      it('should detect empty numero', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310-100'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('Número é obrigatório');
      });

      it('should detect invalid bairro', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'C',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310-100'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('Bairro deve ter pelo menos 2 caracteres');
      });

      it('should detect invalid cidade', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'S',
          estado: 'SP',
          cep: '01310-100'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('Cidade deve ter pelo menos 2 caracteres');
      });

      it('should detect invalid estado', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SAO',
          cep: '01310-100'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('Estado deve ter 2 caracteres (ex: SP)');
      });

      it('should detect invalid CEP', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '1234'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors).toContain('CEP deve ter o formato 00000-000');
      });

      it('should validate CEP without hyphen', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310100'
        };
        expect(AssistidoEntity.validarEndereco(endereco)).toEqual([]);
      });

      it('should return multiple errors for multiple invalid fields', () => {
        const endereco: EnderecoAssistido = {
          logradouro: 'Ru',
          numero: '',
          bairro: 'C',
          cidade: 'S',
          estado: 'SAO',
          cep: '1234'
        };
        const errors = AssistidoEntity.validarEndereco(endereco);
        expect(errors.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Formatting Methods', () => {
    describe('formatarTelefone', () => {
      it('should format 11-digit phone numbers', () => {
        expect(AssistidoEntity.formatarTelefone('11999999999')).toBe('(11) 99999-9999');
      });

      it('should format 10-digit phone numbers', () => {
        expect(AssistidoEntity.formatarTelefone('1199999999')).toBe('(11) 9999-9999');
      });

      it('should return original for invalid formats', () => {
        expect(AssistidoEntity.formatarTelefone('123')).toBe('123');
        expect(AssistidoEntity.formatarTelefone('123456789012')).toBe('123456789012');
      });

      it('should handle already formatted phone', () => {
        expect(AssistidoEntity.formatarTelefone('(11) 99999-9999')).toBe('(11) 99999-9999');
      });
    });

    describe('formatarCPF', () => {
      it('should format CPF correctly', () => {
        expect(AssistidoEntity.formatarCPF('12345678901')).toBe('123.456.789-01');
      });

      it('should return original for invalid formats', () => {
        expect(AssistidoEntity.formatarCPF('123')).toBe('123');
        expect(AssistidoEntity.formatarCPF('12345678901234')).toBe('12345678901234');
      });

      it('should handle already formatted CPF', () => {
        expect(AssistidoEntity.formatarCPF('123.456.789-01')).toBe('123.456.789-01');
      });
    });
  });

  describe('Complete Assistido Validation', () => {
    describe('validarAssistido', () => {
      it('should return empty array for valid assistido', () => {
        const assistido = createMockAssistido();
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toEqual([]);
      });

      it('should detect missing nome', () => {
        const assistido = createMockAssistido({ nome: '' });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Nome é obrigatório e deve ter entre 2 e 100 caracteres');
      });

      it('should detect missing dataNascimento', () => {
        const assistido = createMockAssistido();
        delete (assistido as Partial<Assistido>).dataNascimento;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Data de nascimento é obrigatória e deve ser válida');
      });

      it('should detect invalid telefone', () => {
        const assistido = createMockAssistido({ telefone: '123' });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Telefone é obrigatório e deve ter formato válido');
      });

      it('should detect invalid CPF when provided', () => {
        const assistido = createMockAssistido({ cpf: '123.456.789-00' });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('CPF deve ter formato válido');
      });

      it('should detect invalid email when provided', () => {
        const assistido = createMockAssistido({ email: 'invalid-email' });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Email deve ter formato válido');
      });

      it('should detect missing endereco', () => {
        const assistido = createMockAssistido();
        delete (assistido as Partial<Assistido>).endereco;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Endereço é obrigatório');
      });

      it('should detect missing situacaoFamiliar', () => {
        const assistido = createMockAssistido();
        delete (assistido as Partial<Assistido>).situacaoFamiliar;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Situação familiar é obrigatória');
      });

      it('should detect missing escolaridade', () => {
        const assistido = createMockAssistido();
        delete (assistido as Partial<Assistido>).escolaridade;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Escolaridade é obrigatória');
      });

      it('should detect missing tipoMoradia', () => {
        const assistido = createMockAssistido();
        delete (assistido as Partial<Assistido>).tipoMoradia;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Tipo de moradia é obrigatório');
      });

      it('should detect invalid quantidadeComodos', () => {
        const assistido = createMockAssistido({ quantidadeComodos: 0 });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Quantidade de cômodos é obrigatória e deve ser um número entre 1 e 20');
      });

      it('should detect missing possuiCadUnico', () => {
        const assistido = createMockAssistido();
        (assistido as Partial<Assistido>).possuiCadUnico = undefined;
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Informação sobre CadÚnico é obrigatória');
      });

      it('should detect empty necessidades', () => {
        const assistido = createMockAssistido({ necessidades: [] });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Pelo menos uma necessidade deve ser selecionada');
      });

      it('should detect missing responsavelAtendimento', () => {
        const assistido = createMockAssistido({ responsavelAtendimento: '' });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Responsável pelo atendimento é obrigatório');
      });

      it('should detect invalid rendaFamiliar', () => {
        const assistido = createMockAssistido({ rendaFamiliar: -100 });
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors).toContain('Renda familiar deve ser um valor válido');
      });

      it('should return multiple errors for multiple invalid fields', () => {
        const assistido: Partial<Assistido> = {
          nome: '',
          telefone: '123',
          cpf: 'invalid',
          email: 'invalid',
          necessidades: [],
          responsavelAtendimento: ''
        };
        const errors = AssistidoEntity.validarAssistido(assistido);
        expect(errors.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Family Composition', () => {
    it('should handle empty family correctly', () => {
      const assistido = createMockAssistido({ familiares: [] });
      expect(assistido.familiares).toHaveLength(0);
      expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(2000);
    });

    it('should handle large family correctly', () => {
      const familiares: FamiliarAssistido[] = Array.from({ length: 10 }, (_, i) =>
        createMockFamiliar({
          id: `familiar-${i}`,
          nome: `Familiar ${i}`,
          renda: 100 * i
        })
      );
      const assistido = createMockAssistido({
        rendaFamiliar: 5500,
        familiares
      });
      expect(assistido.familiares).toHaveLength(10);
      expect(AssistidoEntity.calcularRendaPerCapita(assistido)).toBe(500);
    });

    it('should correctly represent family relationships', () => {
      const familiares: FamiliarAssistido[] = [
        createMockFamiliar({ id: 'f1', nome: 'Esposa', parentesco: TipoParentesco.Esposa }),
        createMockFamiliar({ id: 'f2', nome: 'Filho 1', parentesco: TipoParentesco.Filho }),
        createMockFamiliar({ id: 'f3', nome: 'Filha 1', parentesco: TipoParentesco.Filha }),
        createMockFamiliar({ id: 'f4', nome: 'Sogra', parentesco: TipoParentesco.Mae })
      ];
      const assistido = createMockAssistido({ familiares });

      expect(assistido.familiares.filter(f => f.parentesco === TipoParentesco.Esposa)).toHaveLength(1);
      expect(assistido.familiares.filter(f => f.parentesco === TipoParentesco.Filho)).toHaveLength(1);
      expect(assistido.familiares.filter(f => f.parentesco === TipoParentesco.Filha)).toHaveLength(1);
    });

    it('should handle family members with income', () => {
      const familiares: FamiliarAssistido[] = [
        createMockFamiliar({ id: 'f1', renda: 1000 }),
        createMockFamiliar({ id: 'f2', renda: 500 }),
        createMockFamiliar({ id: 'f3', renda: undefined })
      ];
      const assistido = createMockAssistido({ familiares });

      const familyIncome = familiares.reduce((sum, f) => sum + (f.renda || 0), 0);
      expect(familyIncome).toBe(1500);
    });
  });
});
