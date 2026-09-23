import {
  GuidelinePeriodType,
  GuidelineStatus,
  PedagogyEntity,
  PedagogyOrganization,
  StudentDifficultyType,
  belongsToOrganization,
  resolvePedagogyOrganization
} from '../Pedagogy';

describe('PedagogyEntity', () => {
  it('rejects a guideline without period', () => {
    expect(() => PedagogyEntity.validateGuideline({
      title: 'Diretriz',
      content: 'Conteúdo'
    })).toThrow('Período de validade é obrigatório');
  });

  it('marks published guideline as active inside the validity window', () => {
    const active = PedagogyEntity.isGuidelineActive({
      id: '1',
      organization: PedagogyOrganization.Church,
      title: 'Diretriz',
      content: 'Texto',
      periodType: GuidelinePeriodType.Semester,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      supportMaterials: [],
      status: GuidelineStatus.Published,
      createdBy: 'u1',
      createdByName: 'Coord',
      createdAt: new Date(),
      updatedAt: new Date()
    }, new Date('2026-08-20'));

    expect(active).toBe(true);
  });

  it('calculates attendance and engagement rates', () => {
    expect(PedagogyEntity.attendanceRate({ totalStudents: 15, presentCount: 12 })).toBe(80);
    expect(PedagogyEntity.engagementRate({ presentCount: 12, engagedCount: 9 })).toBe(75);
  });

  it('rejects session with more present students than the class size', () => {
    expect(() => PedagogyEntity.validateSessionRecord({
      classGroup: 'Turma A',
      sessionDate: new Date(),
      totalStudents: 10,
      presentCount: 11,
      engagedCount: 0,
      lowEngagementCount: 0
    })).toThrow('Presentes não podem exceder o total de alunos');
  });

  it('requires a description when difficulty is other', () => {
    expect(() => PedagogyEntity.validateDifficulty({
      studentName: 'Ana',
      difficulties: [StudentDifficultyType.Other],
      description: 'Situação breve'
    })).toThrow('Descreva a dificuldade em "Outros"');
  });

  it('treats missing organization as church and keeps ONG distinct', () => {
    expect(resolvePedagogyOrganization(undefined)).toBe(PedagogyOrganization.Church);
    expect(belongsToOrganization(undefined, PedagogyOrganization.Church)).toBe(true);
    expect(belongsToOrganization('ong', PedagogyOrganization.ONG)).toBe(true);
    expect(belongsToOrganization('ong', PedagogyOrganization.Church)).toBe(false);
  });

  it('lists educators who have not registered a session', () => {
    const pending = PedagogyEntity.educatorsWithoutSessionRecords(
      [
        { id: 'e1', name: 'Ana' },
        { id: 'e2', name: 'Bruno' },
        { id: 'e3', name: 'Carla' }
      ],
      [{ educatorId: 'e2' }]
    );

    expect(pending.map(item => item.id)).toEqual(['e1', 'e3']);
  });

  it('rejects attendance without named students', () => {
    expect(() => PedagogyEntity.validateAttendance({
      classGroup: 'Turma A',
      sessionDate: new Date(),
      students: [{ name: '  ', present: true }]
    })).toThrow('Inclua ao menos um aluno na chamada');
  });

  it('lists absences and suggests names from the class history', () => {
    const roll = {
      id: 'r1',
      organization: PedagogyOrganization.Church,
      educatorId: 'e1',
      educatorName: 'Ana',
      classGroup: 'Turma A',
      sessionDate: new Date('2026-09-07T12:00:00'),
      students: [
        { name: 'Mariane', present: true },
        { name: 'Pedro', present: false }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(PedagogyEntity.absentStudents(roll).map(item => item.name)).toEqual(['Pedro']);
    expect(PedagogyEntity.presentCount(roll)).toBe(1);
    expect(PedagogyEntity.suggestStudentNames('turma a', [
      { studentName: 'Lucas', classGroup: 'Turma A' }
    ], [roll])).toEqual(['Lucas', 'Mariane', 'Pedro']);
    expect(PedagogyEntity.absenceReport([roll])[0].studentName).toBe('Pedro');
  });

  it('normalizes roster names and moves a student between classes', () => {
    const origin = {
      id: 't1',
      organization: PedagogyOrganization.Church,
      classGroup: 'Clube da leitura',
      students: ['Mariane', 'Pedro'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'sec-1'
    };
    const destination = {
      ...origin,
      id: 't2',
      classGroup: 'Turma B',
      students: ['Lucas']
    };

    const moved = PedagogyEntity.moveStudentBetweenRosters(origin, destination, 'pedro');
    expect(moved.origin.students).toEqual(['Mariane']);
    expect(moved.destination.students).toEqual(['Lucas', 'Pedro']);
    expect(PedagogyEntity.normalizeStudentNames([' Pedro ', 'pedro', 'Ana'])).toEqual(['Ana', 'Pedro']);
  });

  it('copies a student without removing from origin, while move still cuts', () => {
    const origin = {
      id: 't1',
      organization: PedagogyOrganization.Church,
      classGroup: 'Clube da leitura',
      students: ['Mariane', 'Pedro'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'sec-1'
    };
    const destination = {
      ...origin,
      id: 't2',
      classGroup: 'Turma B',
      students: ['Lucas']
    };

    const copied = PedagogyEntity.copyStudentToRoster(origin, destination, 'pedro');
    expect(copied.origin.students).toEqual(['Mariane', 'Pedro']);
    expect(copied.destination.students).toEqual(['Lucas', 'Pedro']);

    const moved = PedagogyEntity.moveStudentBetweenRosters(origin, destination, 'pedro');
    expect(moved.origin.students).toEqual(['Mariane']);
    expect(moved.destination.students).toEqual(['Lucas', 'Pedro']);
  });

  it('rejects copying a student onto the same roster', () => {
    const roster = {
      id: 't1',
      organization: PedagogyOrganization.Church,
      classGroup: 'Clube da leitura',
      students: ['Pedro'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'sec-1'
    };

    expect(() => PedagogyEntity.copyStudentToRoster(roster, roster, 'Pedro'))
      .toThrow('Escolha outra turma para copiar o aluno');
  });
});
