// Unit Tests - Assistencia Entity
// Regression tests for assistance/appointment management

import {
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  AssistenciaEntity,
  ProfissionalAssistencia,
  AgendamentoAssistencia
} from '../Assistencia';

describe('AssistenciaEntity', () => {
  describe('formatarTipoAssistencia', () => {
    it('should format all assistance types correctly', () => {
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Psicologica)).toBe('Assistência Psicológica');
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Social)).toBe('Assistência Social');
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Juridica)).toBe('Assistência Jurídica');
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Medica)).toBe('Assistência Médica');
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Fisioterapia)).toBe('Assistência Fisioterapêutica');
      expect(AssistenciaEntity.formatarTipoAssistencia(TipoAssistencia.Nutricao)).toBe('Assistência Nutricional');
    });
  });

  describe('formatarStatusAgendamento', () => {
    it('should format all appointment statuses correctly', () => {
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Agendado)).toBe('Agendado');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Confirmado)).toBe('Confirmado');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.EmAndamento)).toBe('Em Andamento');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Concluido)).toBe('Concluído');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Cancelado)).toBe('Cancelado');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Remarcado)).toBe('Remarcado');
      expect(AssistenciaEntity.formatarStatusAgendamento(StatusAgendamento.Faltou)).toBe('Paciente Faltou');
    });
  });

  describe('formatarModalidadeAtendimento', () => {
    it('should format all modalities correctly', () => {
      expect(AssistenciaEntity.formatarModalidadeAtendimento(ModalidadeAtendimento.Presencial)).toBe('Presencial');
      expect(AssistenciaEntity.formatarModalidadeAtendimento(ModalidadeAtendimento.Online)).toBe('Online');
      expect(AssistenciaEntity.formatarModalidadeAtendimento(ModalidadeAtendimento.Domiciliar)).toBe('Domiciliar');
      expect(AssistenciaEntity.formatarModalidadeAtendimento(ModalidadeAtendimento.Telefonico)).toBe('Telefônico');
    });
  });

  describe('formatarPrioridade', () => {
    it('should format all priorities correctly', () => {
      expect(AssistenciaEntity.formatarPrioridade(PrioridadeAtendimento.Baixa)).toBe('Baixa');
      expect(AssistenciaEntity.formatarPrioridade(PrioridadeAtendimento.Normal)).toBe('Normal');
      expect(AssistenciaEntity.formatarPrioridade(PrioridadeAtendimento.Alta)).toBe('Alta');
      expect(AssistenciaEntity.formatarPrioridade(PrioridadeAtendimento.Urgente)).toBe('Urgente');
      expect(AssistenciaEntity.formatarPrioridade(PrioridadeAtendimento.Emergencial)).toBe('Emergencial');
    });
  });

  describe('calcularIdadePaciente', () => {
    it('should calculate age correctly for past birthdays', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth() - 1, today.getDate());
      expect(AssistenciaEntity.calcularIdadePaciente(birthDate)).toBe(30);
    });

    it('should calculate age correctly for future birthdays this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());
      expect(AssistenciaEntity.calcularIdadePaciente(birthDate)).toBe(29);
    });

    it('should handle birthday today', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      expect(AssistenciaEntity.calcularIdadePaciente(birthDate)).toBe(25);
    });
  });

  describe('calcularDuracaoConsulta', () => {
    it('should calculate duration in minutes correctly', () => {
      const inicio = new Date('2024-01-15T10:00:00');
      const fim = new Date('2024-01-15T10:30:00');
      expect(AssistenciaEntity.calcularDuracaoConsulta(inicio, fim)).toBe(30);
    });

    it('should handle hour-long consultations', () => {
      const inicio = new Date('2024-01-15T10:00:00');
      const fim = new Date('2024-01-15T11:00:00');
      expect(AssistenciaEntity.calcularDuracaoConsulta(inicio, fim)).toBe(60);
    });

    it('should handle consultations spanning multiple hours', () => {
      const inicio = new Date('2024-01-15T10:00:00');
      const fim = new Date('2024-01-15T12:30:00');
      expect(AssistenciaEntity.calcularDuracaoConsulta(inicio, fim)).toBe(150);
    });
  });

  describe('Validation Methods', () => {
    describe('validarEmail', () => {
      it('should validate correct email formats', () => {
        expect(AssistenciaEntity.validarEmail('test@example.com')).toBe(true);
        expect(AssistenciaEntity.validarEmail('user.name@domain.org')).toBe(true);
        expect(AssistenciaEntity.validarEmail('user+tag@domain.co.uk')).toBe(true);
      });

      it('should reject invalid email formats', () => {
        expect(AssistenciaEntity.validarEmail('invalid')).toBe(false);
        expect(AssistenciaEntity.validarEmail('invalid@')).toBe(false);
        expect(AssistenciaEntity.validarEmail('@domain.com')).toBe(false);
        expect(AssistenciaEntity.validarEmail('user@.com')).toBe(false);
      });
    });

    describe('validarTelefone', () => {
      it('should validate correct phone formats', () => {
        expect(AssistenciaEntity.validarTelefone('11999999999')).toBe(true);
        expect(AssistenciaEntity.validarTelefone('1199999999')).toBe(true);
        expect(AssistenciaEntity.validarTelefone('(11) 99999-9999')).toBe(true);
      });

      it('should reject invalid phone formats', () => {
        expect(AssistenciaEntity.validarTelefone('123')).toBe(false);
        expect(AssistenciaEntity.validarTelefone('123456789012')).toBe(false);
      });
    });

    describe('validarCPF', () => {
      it('should validate correct CPF', () => {
        // Valid CPF for testing (generated, not real)
        expect(AssistenciaEntity.validarCPF('529.982.247-25')).toBe(true);
        expect(AssistenciaEntity.validarCPF('52998224725')).toBe(true);
      });

      it('should reject invalid CPF', () => {
        expect(AssistenciaEntity.validarCPF('111.111.111-11')).toBe(false);
        expect(AssistenciaEntity.validarCPF('123.456.789-00')).toBe(false);
        expect(AssistenciaEntity.validarCPF('12345678900')).toBe(false);
      });

      it('should reject CPF with wrong length', () => {
        expect(AssistenciaEntity.validarCPF('123')).toBe(false);
        expect(AssistenciaEntity.validarCPF('12345678901234')).toBe(false);
      });
    });
  });

  describe('Formatting Methods', () => {
    describe('formatarTelefone', () => {
      it('should format 11-digit phone numbers', () => {
        expect(AssistenciaEntity.formatarTelefone('11999999999')).toBe('(11) 99999-9999');
      });

      it('should format 10-digit phone numbers', () => {
        expect(AssistenciaEntity.formatarTelefone('1199999999')).toBe('(11) 9999-9999');
      });

      it('should return original for invalid formats', () => {
        expect(AssistenciaEntity.formatarTelefone('123')).toBe('123');
      });
    });

    describe('formatarCPF', () => {
      it('should format CPF correctly', () => {
        expect(AssistenciaEntity.formatarCPF('12345678901')).toBe('123.456.789-01');
      });

      it('should return original for invalid formats', () => {
        expect(AssistenciaEntity.formatarCPF('123')).toBe('123');
      });
    });

    describe('formatarCEP', () => {
      it('should format CEP correctly', () => {
        expect(AssistenciaEntity.formatarCEP('01310100')).toBe('01310-100');
      });

      it('should return original for invalid formats', () => {
        expect(AssistenciaEntity.formatarCEP('123')).toBe('123');
      });
    });
  });

  describe('obterProximosHorariosDisponiveis', () => {
    const createMockProfissional = (tempoConsulta: number): ProfissionalAssistencia => ({
      id: 'prof-1',
      nome: 'Dr. Test',
      telefone: '11999999999',
      email: 'dr.test@example.com',
      endereco: {
        logradouro: 'Rua Test',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310100'
      },
      especialidade: TipoAssistencia.Psicologica,
      registroProfissional: 'CRP-123456',
      status: StatusProfissional.Ativo,
      dataCadastro: new Date(),
      horariosFuncionamento: [
        {
          diaSemana: 1, // Monday
          horaInicio: '09:00',
          horaFim: '12:00'
        }
      ],
      tempoConsulta,
      modalidadesAtendimento: [ModalidadeAtendimento.Presencial],
      documentos: [],
      avaliacoes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin'
    });

    it('should return available slots within working hours', () => {
      const profissional = createMockProfissional(60);

      // Find next Monday
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const endDate = new Date(nextMonday);
      endDate.setDate(nextMonday.getDate() + 1);

      const slots = AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional,
        nextMonday,
        endDate,
        []
      );

      // Should have 3 slots: 9:00, 10:00, 11:00 (each 60 min, ending at 12:00)
      expect(slots.length).toBe(3);
    });

    it('should exclude conflicting appointments', () => {
      const profissional = createMockProfissional(60);

      // Find next Monday
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const endDate = new Date(nextMonday);
      endDate.setDate(nextMonday.getDate() + 1);

      // Existing appointment at 10:00
      const existingAppointment: AgendamentoAssistencia = {
        id: 'apt-1',
        pacienteId: 'patient-1',
        pacienteNome: 'Test Patient',
        pacienteTelefone: '11999999999',
        profissionalId: 'prof-1',
        profissionalNome: 'Dr. Test',
        tipoAssistencia: TipoAssistencia.Psicologica,
        dataHoraAgendamento: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 10, 0),
        dataHoraFim: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 11, 0),
        modalidade: ModalidadeAtendimento.Presencial,
        prioridade: PrioridadeAtendimento.Normal,
        status: StatusAgendamento.Confirmado,
        motivo: 'Consultation',
        anexos: [],
        historico: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      };

      const slots = AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional,
        nextMonday,
        endDate,
        [existingAppointment]
      );

      // Should have only 2 slots: 9:00 and 11:00 (10:00 is occupied)
      expect(slots.length).toBe(2);

      // Verify 10:00 slot is not included
      const tenAMSlot = slots.find(s => s.getHours() === 10);
      expect(tenAMSlot).toBeUndefined();
    });

    it('should return empty array for invalid consultation duration', () => {
      const profissional = createMockProfissional(0);

      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const slots = AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional,
        today,
        endDate,
        []
      );

      expect(slots).toEqual([]);
    });

    it('should handle multiple days correctly', () => {
      const profissional: ProfissionalAssistencia = {
        ...createMockProfissional(60),
        horariosFuncionamento: [
          { diaSemana: 1, horaInicio: '09:00', horaFim: '10:00' }, // Monday: 1 slot
          { diaSemana: 3, horaInicio: '09:00', horaFim: '10:00' }  // Wednesday: 1 slot
        ]
      };

      // Start from Sunday to cover both Monday and Wednesday
      const today = new Date();
      const daysUntilSunday = (7 - today.getDay()) % 7;
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilSunday);
      nextSunday.setHours(0, 0, 0, 0);

      const endDate = new Date(nextSunday);
      endDate.setDate(nextSunday.getDate() + 7); // One week

      const slots = AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional,
        nextSunday,
        endDate,
        []
      );

      // Should have at least 2 slots (one per day)
      expect(slots.length).toBeGreaterThanOrEqual(2);
    });

    // REGRESSION TEST: This ensures the no-loop-func fix works correctly
    it('should not have closure issues with loop variables', () => {
      const profissional = createMockProfissional(30); // 30 min appointments

      // Find next Monday
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const endDate = new Date(nextMonday);
      endDate.setDate(nextMonday.getDate() + 1);

      // Existing appointments at different times
      const mondayDate = nextMonday;
      const existingAppointments: AgendamentoAssistencia[] = [
        {
          id: 'apt-1',
          pacienteId: 'patient-1',
          pacienteNome: 'Patient 1',
          pacienteTelefone: '11999999999',
          profissionalId: 'prof-1',
          profissionalNome: 'Dr. Test',
          tipoAssistencia: TipoAssistencia.Psicologica,
          dataHoraAgendamento: new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 9, 30),
          dataHoraFim: new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 10, 0),
          modalidade: ModalidadeAtendimento.Presencial,
          prioridade: PrioridadeAtendimento.Normal,
          status: StatusAgendamento.Confirmado,
          motivo: 'Consultation 1',
          anexos: [],
          historico: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        },
        {
          id: 'apt-2',
          pacienteId: 'patient-2',
          pacienteNome: 'Patient 2',
          pacienteTelefone: '11888888888',
          profissionalId: 'prof-1',
          profissionalNome: 'Dr. Test',
          tipoAssistencia: TipoAssistencia.Psicologica,
          dataHoraAgendamento: new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 10, 30),
          dataHoraFim: new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 11, 0),
          modalidade: ModalidadeAtendimento.Presencial,
          prioridade: PrioridadeAtendimento.Normal,
          status: StatusAgendamento.Confirmado,
          motivo: 'Consultation 2',
          anexos: [],
          historico: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        }
      ];

      const slots = AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional,
        nextMonday,
        endDate,
        existingAppointments
      );

      // With 30 min slots from 9:00-12:00, we have: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
      // Minus conflicts at 9:30 and 10:30
      // Expected: 9:00, 10:00, 11:00, 11:30 = 4 slots
      expect(slots.length).toBe(4);

      // Verify specific slots
      const slotTimes = slots.map(s => `${s.getHours()}:${s.getMinutes().toString().padStart(2, '0')}`);
      expect(slotTimes).toContain('9:00');
      expect(slotTimes).toContain('10:00');
      expect(slotTimes).toContain('11:00');
      expect(slotTimes).toContain('11:30');
      expect(slotTimes).not.toContain('9:30');
      expect(slotTimes).not.toContain('10:30');
    });
  });

  describe('calcularValorFinalConsulta', () => {
    it('should calculate final value without discount', () => {
      expect(AssistenciaEntity.calcularValorFinalConsulta(100, 0)).toBe(100);
    });

    it('should calculate final value with discount', () => {
      expect(AssistenciaEntity.calcularValorFinalConsulta(100, 20)).toBe(80);
    });

    it('should handle default discount (no parameter)', () => {
      expect(AssistenciaEntity.calcularValorFinalConsulta(100)).toBe(100);
    });
  });

  describe('gerarCodigoAgendamento', () => {
    it('should generate unique codes', () => {
      const code1 = AssistenciaEntity.gerarCodigoAgendamento();
      const code2 = AssistenciaEntity.gerarCodigoAgendamento();

      expect(code1).not.toBe(code2);
    });

    it('should start with ASS- prefix', () => {
      const code = AssistenciaEntity.gerarCodigoAgendamento();
      expect(code.startsWith('ASS-')).toBe(true);
    });

    it('should have correct format', () => {
      const code = AssistenciaEntity.gerarCodigoAgendamento();
      // Format: ASS-XXXXXX-XXXXXX
      expect(code).toMatch(/^ASS-\d{6}-[A-Z0-9]{6}$/);
    });
  });
});

describe('Enums', () => {
  describe('TipoAssistencia', () => {
    it('should have all expected values', () => {
      expect(TipoAssistencia.Psicologica).toBe('psicologica');
      expect(TipoAssistencia.Social).toBe('social');
      expect(TipoAssistencia.Juridica).toBe('juridica');
      expect(TipoAssistencia.Medica).toBe('medica');
      expect(TipoAssistencia.Fisioterapia).toBe('fisioterapia');
      expect(TipoAssistencia.Nutricao).toBe('nutricao');
    });
  });

  describe('StatusAgendamento', () => {
    it('should have all expected values', () => {
      expect(StatusAgendamento.Agendado).toBe('agendado');
      expect(StatusAgendamento.Confirmado).toBe('confirmado');
      expect(StatusAgendamento.EmAndamento).toBe('em_andamento');
      expect(StatusAgendamento.Concluido).toBe('concluido');
      expect(StatusAgendamento.Cancelado).toBe('cancelado');
      expect(StatusAgendamento.Remarcado).toBe('remarcado');
      expect(StatusAgendamento.Faltou).toBe('faltou');
    });
  });

  describe('StatusProfissional', () => {
    it('should have all expected values', () => {
      expect(StatusProfissional.Ativo).toBe('ativo');
      expect(StatusProfissional.Inativo).toBe('inativo');
      expect(StatusProfissional.Licença).toBe('licenca');
      expect(StatusProfissional.Suspenso).toBe('suspenso');
    });
  });
});
