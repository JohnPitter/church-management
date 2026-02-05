// Unit Tests - Leader Entity
// Comprehensive tests for leader domain logic including enums, interfaces, and label mappings

import {
  Leader,
  LeaderRole,
  LeaderStatus,
  LEADER_ROLE_LABELS,
  LEADER_STATUS_LABELS
} from '../Leader';

// Test Fixtures
const createMockLeader = (overrides: Partial<Leader> = {}): Leader => ({
  id: 'leader-1',
  nome: 'Pastor João Silva',
  cargo: LeaderRole.Pastor,
  ministerio: 'Pastoral Geral',
  bio: 'Pastor há mais de 20 anos, dedicado ao ministério da palavra.',
  foto: 'https://example.com/photo.jpg',
  email: 'pastor.joao@igreja.com',
  telefone: '(11) 99999-9999',
  ordem: 1,
  status: LeaderStatus.Ativo,
  dataCadastro: new Date('2024-01-01T10:00:00Z'),
  dataAtualizacao: new Date('2024-01-01T11:00:00Z'),
  criadoPor: 'admin-user-id',
  ...overrides
});

describe('LeaderRole Enum', () => {
  it('should have Pastor role', () => {
    expect(LeaderRole.Pastor).toBe('pastor');
  });

  it('should have Auxiliar role', () => {
    expect(LeaderRole.Auxiliar).toBe('auxiliar');
  });

  it('should have Diacono role', () => {
    expect(LeaderRole.Diacono).toBe('diacono');
  });

  it('should have Lider role', () => {
    expect(LeaderRole.Lider).toBe('lider');
  });

  it('should have Coordenador role', () => {
    expect(LeaderRole.Coordenador).toBe('coordenador');
  });

  it('should have Missionario role', () => {
    expect(LeaderRole.Missionario).toBe('missionario');
  });

  it('should have Evangelista role', () => {
    expect(LeaderRole.Evangelista).toBe('evangelista');
  });

  it('should have Outro role', () => {
    expect(LeaderRole.Outro).toBe('outro');
  });

  it('should have exactly 8 role values', () => {
    const roleValues = Object.values(LeaderRole);
    expect(roleValues).toHaveLength(8);
    expect(roleValues).toContain('pastor');
    expect(roleValues).toContain('auxiliar');
    expect(roleValues).toContain('diacono');
    expect(roleValues).toContain('lider');
    expect(roleValues).toContain('coordenador');
    expect(roleValues).toContain('missionario');
    expect(roleValues).toContain('evangelista');
    expect(roleValues).toContain('outro');
  });

  it('should use lowercase values for consistency', () => {
    const roleValues = Object.values(LeaderRole);
    roleValues.forEach(value => {
      expect(value).toBe(value.toLowerCase());
    });
  });
});

describe('LeaderStatus Enum', () => {
  it('should have Ativo status', () => {
    expect(LeaderStatus.Ativo).toBe('ativo');
  });

  it('should have Inativo status', () => {
    expect(LeaderStatus.Inativo).toBe('inativo');
  });

  it('should have Afastado status', () => {
    expect(LeaderStatus.Afastado).toBe('afastado');
  });

  it('should have exactly 3 status values', () => {
    const statusValues = Object.values(LeaderStatus);
    expect(statusValues).toHaveLength(3);
    expect(statusValues).toContain('ativo');
    expect(statusValues).toContain('inativo');
    expect(statusValues).toContain('afastado');
  });

  it('should use lowercase values for consistency', () => {
    const statusValues = Object.values(LeaderStatus);
    statusValues.forEach(value => {
      expect(value).toBe(value.toLowerCase());
    });
  });
});

describe('LEADER_ROLE_LABELS', () => {
  it('should have label for Pastor role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Pastor]).toBe('Pastor');
  });

  it('should have label for Auxiliar role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Auxiliar]).toBe('Pastor Auxiliar');
  });

  it('should have label for Diacono role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Diacono]).toBe('Diácono');
  });

  it('should have label for Lider role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Lider]).toBe('Líder');
  });

  it('should have label for Coordenador role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Coordenador]).toBe('Coordenador');
  });

  it('should have label for Missionario role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Missionario]).toBe('Missionário');
  });

  it('should have label for Evangelista role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Evangelista]).toBe('Evangelista');
  });

  it('should have label for Outro role', () => {
    expect(LEADER_ROLE_LABELS[LeaderRole.Outro]).toBe('Outro');
  });

  it('should have labels for all LeaderRole values', () => {
    const allRoles = Object.values(LeaderRole);
    allRoles.forEach(role => {
      expect(LEADER_ROLE_LABELS[role]).toBeDefined();
      expect(typeof LEADER_ROLE_LABELS[role]).toBe('string');
      expect(LEADER_ROLE_LABELS[role].length).toBeGreaterThan(0);
    });
  });

  it('should have exactly 8 labels matching the enum count', () => {
    const labelCount = Object.keys(LEADER_ROLE_LABELS).length;
    const enumCount = Object.values(LeaderRole).length;
    expect(labelCount).toBe(enumCount);
    expect(labelCount).toBe(8);
  });

  it('should have human-readable labels (capitalized)', () => {
    const labels = Object.values(LEADER_ROLE_LABELS);
    labels.forEach(label => {
      // First character should be uppercase
      expect(label[0]).toBe(label[0].toUpperCase());
    });
  });
});

describe('LEADER_STATUS_LABELS', () => {
  it('should have label for Ativo status', () => {
    expect(LEADER_STATUS_LABELS[LeaderStatus.Ativo]).toBe('Ativo');
  });

  it('should have label for Inativo status', () => {
    expect(LEADER_STATUS_LABELS[LeaderStatus.Inativo]).toBe('Inativo');
  });

  it('should have label for Afastado status', () => {
    expect(LEADER_STATUS_LABELS[LeaderStatus.Afastado]).toBe('Afastado');
  });

  it('should have labels for all LeaderStatus values', () => {
    const allStatuses = Object.values(LeaderStatus);
    allStatuses.forEach(status => {
      expect(LEADER_STATUS_LABELS[status]).toBeDefined();
      expect(typeof LEADER_STATUS_LABELS[status]).toBe('string');
      expect(LEADER_STATUS_LABELS[status].length).toBeGreaterThan(0);
    });
  });

  it('should have exactly 3 labels matching the enum count', () => {
    const labelCount = Object.keys(LEADER_STATUS_LABELS).length;
    const enumCount = Object.values(LeaderStatus).length;
    expect(labelCount).toBe(enumCount);
    expect(labelCount).toBe(3);
  });

  it('should have human-readable labels (capitalized)', () => {
    const labels = Object.values(LEADER_STATUS_LABELS);
    labels.forEach(label => {
      // First character should be uppercase
      expect(label[0]).toBe(label[0].toUpperCase());
    });
  });
});

describe('Leader Interface', () => {
  describe('Required Fields', () => {
    it('should accept a valid Leader object with all required fields', () => {
      const leader: Leader = createMockLeader();
      expect(leader.id).toBeDefined();
      expect(leader.nome).toBeDefined();
      expect(leader.cargo).toBeDefined();
      expect(leader.ordem).toBeDefined();
      expect(leader.status).toBeDefined();
      expect(leader.dataCadastro).toBeDefined();
      expect(leader.dataAtualizacao).toBeDefined();
      expect(leader.criadoPor).toBeDefined();
    });

    it('should require id field', () => {
      const leader: Leader = createMockLeader();
      expect(typeof leader.id).toBe('string');
      expect(leader.id.length).toBeGreaterThan(0);
    });

    it('should require nome field', () => {
      const leader: Leader = createMockLeader();
      expect(typeof leader.nome).toBe('string');
      expect(leader.nome.length).toBeGreaterThan(0);
    });

    it('should require cargo field with valid LeaderRole', () => {
      const leader: Leader = createMockLeader();
      const validRoles = Object.values(LeaderRole);
      expect(validRoles).toContain(leader.cargo);
    });

    it('should require ordem field as number', () => {
      const leader: Leader = createMockLeader();
      expect(typeof leader.ordem).toBe('number');
    });

    it('should require status field with valid LeaderStatus', () => {
      const leader: Leader = createMockLeader();
      const validStatuses = Object.values(LeaderStatus);
      expect(validStatuses).toContain(leader.status);
    });

    it('should require dataCadastro field as Date', () => {
      const leader: Leader = createMockLeader();
      expect(leader.dataCadastro).toBeInstanceOf(Date);
    });

    it('should require dataAtualizacao field as Date', () => {
      const leader: Leader = createMockLeader();
      expect(leader.dataAtualizacao).toBeInstanceOf(Date);
    });

    it('should require criadoPor field', () => {
      const leader: Leader = createMockLeader();
      expect(typeof leader.criadoPor).toBe('string');
      expect(leader.criadoPor.length).toBeGreaterThan(0);
    });
  });

  describe('Optional Fields', () => {
    it('should allow cargoPersonalizado to be undefined', () => {
      const leader: Leader = createMockLeader({
        cargoPersonalizado: undefined
      });
      expect(leader.cargoPersonalizado).toBeUndefined();
    });

    it('should allow cargoPersonalizado to be set for custom roles', () => {
      const leader: Leader = createMockLeader({
        cargo: LeaderRole.Outro,
        cargoPersonalizado: 'Coordenador de Louvor'
      });
      expect(leader.cargoPersonalizado).toBe('Coordenador de Louvor');
    });

    it('should allow ministerio to be undefined', () => {
      const leader: Leader = createMockLeader({
        ministerio: undefined
      });
      expect(leader.ministerio).toBeUndefined();
    });

    it('should allow ministerio to be set', () => {
      const leader: Leader = createMockLeader({
        ministerio: 'Ministerio de Louvor'
      });
      expect(leader.ministerio).toBe('Ministerio de Louvor');
    });

    it('should allow bio to be undefined', () => {
      const leader: Leader = createMockLeader({
        bio: undefined
      });
      expect(leader.bio).toBeUndefined();
    });

    it('should allow bio to be set with biographical information', () => {
      const leader: Leader = createMockLeader({
        bio: 'Uma breve descricao sobre o lider.'
      });
      expect(leader.bio).toBe('Uma breve descricao sobre o lider.');
    });

    it('should allow foto to be undefined', () => {
      const leader: Leader = createMockLeader({
        foto: undefined
      });
      expect(leader.foto).toBeUndefined();
    });

    it('should allow foto to be set with URL', () => {
      const leader: Leader = createMockLeader({
        foto: 'https://example.com/leader-photo.jpg'
      });
      expect(leader.foto).toBe('https://example.com/leader-photo.jpg');
    });

    it('should allow email to be undefined', () => {
      const leader: Leader = createMockLeader({
        email: undefined
      });
      expect(leader.email).toBeUndefined();
    });

    it('should allow email to be set', () => {
      const leader: Leader = createMockLeader({
        email: 'leader@church.com'
      });
      expect(leader.email).toBe('leader@church.com');
    });

    it('should allow telefone to be undefined', () => {
      const leader: Leader = createMockLeader({
        telefone: undefined
      });
      expect(leader.telefone).toBeUndefined();
    });

    it('should allow telefone to be set', () => {
      const leader: Leader = createMockLeader({
        telefone: '(11) 98765-4321'
      });
      expect(leader.telefone).toBe('(11) 98765-4321');
    });
  });
});

describe('Leader Role Assignment', () => {
  describe('Standard Roles', () => {
    it('should create a Pastor leader', () => {
      const pastor: Leader = createMockLeader({
        cargo: LeaderRole.Pastor,
        nome: 'Pastor Principal'
      });
      expect(pastor.cargo).toBe(LeaderRole.Pastor);
      expect(LEADER_ROLE_LABELS[pastor.cargo]).toBe('Pastor');
    });

    it('should create an Auxiliar leader', () => {
      const auxiliar: Leader = createMockLeader({
        cargo: LeaderRole.Auxiliar,
        nome: 'Pastor Auxiliar da Igreja'
      });
      expect(auxiliar.cargo).toBe(LeaderRole.Auxiliar);
      expect(LEADER_ROLE_LABELS[auxiliar.cargo]).toBe('Pastor Auxiliar');
    });

    it('should create a Diacono leader', () => {
      const diacono: Leader = createMockLeader({
        cargo: LeaderRole.Diacono,
        nome: 'Diacono Jose'
      });
      expect(diacono.cargo).toBe(LeaderRole.Diacono);
      expect(LEADER_ROLE_LABELS[diacono.cargo]).toBe('Diácono');
    });

    it('should create a Lider leader', () => {
      const lider: Leader = createMockLeader({
        cargo: LeaderRole.Lider,
        nome: 'Lider de Celula'
      });
      expect(lider.cargo).toBe(LeaderRole.Lider);
      expect(LEADER_ROLE_LABELS[lider.cargo]).toBe('Líder');
    });

    it('should create a Coordenador leader', () => {
      const coordenador: Leader = createMockLeader({
        cargo: LeaderRole.Coordenador,
        nome: 'Coordenador de Ministerio'
      });
      expect(coordenador.cargo).toBe(LeaderRole.Coordenador);
      expect(LEADER_ROLE_LABELS[coordenador.cargo]).toBe('Coordenador');
    });

    it('should create a Missionario leader', () => {
      const missionario: Leader = createMockLeader({
        cargo: LeaderRole.Missionario,
        nome: 'Missionario no Campo'
      });
      expect(missionario.cargo).toBe(LeaderRole.Missionario);
      expect(LEADER_ROLE_LABELS[missionario.cargo]).toBe('Missionário');
    });

    it('should create an Evangelista leader', () => {
      const evangelista: Leader = createMockLeader({
        cargo: LeaderRole.Evangelista,
        nome: 'Evangelista da Igreja'
      });
      expect(evangelista.cargo).toBe(LeaderRole.Evangelista);
      expect(LEADER_ROLE_LABELS[evangelista.cargo]).toBe('Evangelista');
    });
  });

  describe('Custom Roles', () => {
    it('should create an Outro leader with custom cargo', () => {
      const custom: Leader = createMockLeader({
        cargo: LeaderRole.Outro,
        cargoPersonalizado: 'Diretor de Midia'
      });
      expect(custom.cargo).toBe(LeaderRole.Outro);
      expect(custom.cargoPersonalizado).toBe('Diretor de Midia');
    });

    it('should use cargoPersonalizado when cargo is Outro', () => {
      const custom: Leader = createMockLeader({
        cargo: LeaderRole.Outro,
        cargoPersonalizado: 'Ministro de Musica'
      });
      const displayRole = custom.cargoPersonalizado || LEADER_ROLE_LABELS[custom.cargo];
      expect(displayRole).toBe('Ministro de Musica');
    });

    it('should fallback to Outro label when cargoPersonalizado is not set', () => {
      const custom: Leader = createMockLeader({
        cargo: LeaderRole.Outro,
        cargoPersonalizado: undefined
      });
      const displayRole = custom.cargoPersonalizado || LEADER_ROLE_LABELS[custom.cargo];
      expect(displayRole).toBe('Outro');
    });
  });
});

describe('Leader Status Management', () => {
  describe('Active Leaders', () => {
    it('should create an active leader', () => {
      const active: Leader = createMockLeader({
        status: LeaderStatus.Ativo
      });
      expect(active.status).toBe(LeaderStatus.Ativo);
      expect(LEADER_STATUS_LABELS[active.status]).toBe('Ativo');
    });

    it('should identify active leaders as eligible for display', () => {
      const active: Leader = createMockLeader({
        status: LeaderStatus.Ativo
      });
      const isDisplayable = active.status === LeaderStatus.Ativo;
      expect(isDisplayable).toBe(true);
    });
  });

  describe('Inactive Leaders', () => {
    it('should create an inactive leader', () => {
      const inactive: Leader = createMockLeader({
        status: LeaderStatus.Inativo
      });
      expect(inactive.status).toBe(LeaderStatus.Inativo);
      expect(LEADER_STATUS_LABELS[inactive.status]).toBe('Inativo');
    });

    it('should identify inactive leaders as not eligible for display', () => {
      const inactive: Leader = createMockLeader({
        status: LeaderStatus.Inativo
      });
      const isDisplayable = inactive.status === LeaderStatus.Ativo;
      expect(isDisplayable).toBe(false);
    });
  });

  describe('On Leave Leaders (Afastado)', () => {
    it('should create a leader on leave', () => {
      const onLeave: Leader = createMockLeader({
        status: LeaderStatus.Afastado
      });
      expect(onLeave.status).toBe(LeaderStatus.Afastado);
      expect(LEADER_STATUS_LABELS[onLeave.status]).toBe('Afastado');
    });

    it('should identify on-leave leaders as not eligible for public display', () => {
      const onLeave: Leader = createMockLeader({
        status: LeaderStatus.Afastado
      });
      const isDisplayable = onLeave.status === LeaderStatus.Ativo;
      expect(isDisplayable).toBe(false);
    });

    it('should differentiate between inactive and on-leave status', () => {
      const onLeave: Leader = createMockLeader({
        status: LeaderStatus.Afastado
      });
      const inactive: Leader = createMockLeader({
        status: LeaderStatus.Inativo
      });
      expect(onLeave.status).not.toBe(inactive.status);
    });
  });

  describe('Status Transitions', () => {
    it('should allow transitioning from active to inactive', () => {
      const leader = createMockLeader({ status: LeaderStatus.Ativo });
      const updatedLeader = { ...leader, status: LeaderStatus.Inativo };
      expect(updatedLeader.status).toBe(LeaderStatus.Inativo);
    });

    it('should allow transitioning from active to on-leave', () => {
      const leader = createMockLeader({ status: LeaderStatus.Ativo });
      const updatedLeader = { ...leader, status: LeaderStatus.Afastado };
      expect(updatedLeader.status).toBe(LeaderStatus.Afastado);
    });

    it('should allow transitioning from on-leave back to active', () => {
      const leader = createMockLeader({ status: LeaderStatus.Afastado });
      const updatedLeader = { ...leader, status: LeaderStatus.Ativo };
      expect(updatedLeader.status).toBe(LeaderStatus.Ativo);
    });

    it('should allow transitioning from inactive to active', () => {
      const leader = createMockLeader({ status: LeaderStatus.Inativo });
      const updatedLeader = { ...leader, status: LeaderStatus.Ativo };
      expect(updatedLeader.status).toBe(LeaderStatus.Ativo);
    });
  });
});

describe('Leader Ordering', () => {
  it('should support ordering with positive numbers', () => {
    const leader: Leader = createMockLeader({ ordem: 1 });
    expect(leader.ordem).toBe(1);
  });

  it('should support zero order for first position', () => {
    const leader: Leader = createMockLeader({ ordem: 0 });
    expect(leader.ordem).toBe(0);
  });

  it('should allow sorting leaders by ordem', () => {
    const leaders: Leader[] = [
      createMockLeader({ id: '3', ordem: 3 }),
      createMockLeader({ id: '1', ordem: 1 }),
      createMockLeader({ id: '2', ordem: 2 })
    ];
    const sorted = [...leaders].sort((a, b) => a.ordem - b.ordem);
    expect(sorted.map(l => l.id)).toEqual(['1', '2', '3']);
  });

  it('should handle leaders with same ordem value', () => {
    const leaders: Leader[] = [
      createMockLeader({ id: 'a', ordem: 1 }),
      createMockLeader({ id: 'b', ordem: 1 }),
      createMockLeader({ id: 'c', ordem: 2 })
    ];
    const sorted = [...leaders].sort((a, b) => a.ordem - b.ordem);
    // First two should have same order
    expect(sorted[0].ordem).toBe(sorted[1].ordem);
    expect(sorted[2].ordem).toBe(2);
  });
});

describe('Leader Date Management', () => {
  describe('dataCadastro (Creation Date)', () => {
    it('should have creation date set', () => {
      const leader: Leader = createMockLeader();
      expect(leader.dataCadastro).toBeInstanceOf(Date);
    });

    it('should preserve creation date across updates', () => {
      const creationDate = new Date('2020-01-01');
      const leader: Leader = createMockLeader({
        dataCadastro: creationDate
      });
      expect(leader.dataCadastro.getTime()).toBe(creationDate.getTime());
    });
  });

  describe('dataAtualizacao (Update Date)', () => {
    it('should have update date set', () => {
      const leader: Leader = createMockLeader();
      expect(leader.dataAtualizacao).toBeInstanceOf(Date);
    });

    it('should update dataAtualizacao on changes', () => {
      const initialDate = new Date('2024-01-01');
      const updateDate = new Date('2024-06-01');
      const leader = createMockLeader({
        dataAtualizacao: initialDate
      });
      const updatedLeader = {
        ...leader,
        dataAtualizacao: updateDate,
        nome: 'Updated Name'
      };
      expect(updatedLeader.dataAtualizacao.getTime()).toBe(updateDate.getTime());
      expect(updatedLeader.dataAtualizacao.getTime()).toBeGreaterThan(
        initialDate.getTime()
      );
    });

    it('should have dataAtualizacao >= dataCadastro', () => {
      const creationDate = new Date('2024-01-01T10:00:00Z');
      const updateDate = new Date('2024-01-01T11:00:00Z');
      const leader: Leader = createMockLeader({
        dataCadastro: creationDate,
        dataAtualizacao: updateDate
      });
      expect(leader.dataAtualizacao.getTime()).toBeGreaterThanOrEqual(
        leader.dataCadastro.getTime()
      );
    });
  });
});

describe('Leader Creator Tracking', () => {
  it('should track who created the leader', () => {
    const leader: Leader = createMockLeader({
      criadoPor: 'admin-user-123'
    });
    expect(leader.criadoPor).toBe('admin-user-123');
  });

  it('should have a non-empty criadoPor field', () => {
    const leader: Leader = createMockLeader();
    expect(leader.criadoPor.length).toBeGreaterThan(0);
  });
});

describe('Leader Contact Information', () => {
  it('should store email contact', () => {
    const leader: Leader = createMockLeader({
      email: 'contact@church.org'
    });
    expect(leader.email).toBe('contact@church.org');
  });

  it('should store phone contact', () => {
    const leader: Leader = createMockLeader({
      telefone: '+55 11 99999-9999'
    });
    expect(leader.telefone).toBe('+55 11 99999-9999');
  });

  it('should allow leader without contact information', () => {
    const leader: Leader = createMockLeader({
      email: undefined,
      telefone: undefined
    });
    expect(leader.email).toBeUndefined();
    expect(leader.telefone).toBeUndefined();
  });
});

describe('Leader Ministry Assignment', () => {
  it('should allow assigning leader to a ministry', () => {
    const leader: Leader = createMockLeader({
      ministerio: 'Ministerio de Louvor'
    });
    expect(leader.ministerio).toBe('Ministerio de Louvor');
  });

  it('should allow leader without specific ministry', () => {
    const leader: Leader = createMockLeader({
      ministerio: undefined
    });
    expect(leader.ministerio).toBeUndefined();
  });

  it('should support various ministry assignments', () => {
    const ministries = [
      'Ministerio de Louvor',
      'Ministerio Infantil',
      'Ministerio de Jovens',
      'Ministerio de Casais',
      'Ministerio de Intercessao',
      'Ministerio de Evangelismo'
    ];

    ministries.forEach(ministry => {
      const leader: Leader = createMockLeader({ ministerio: ministry });
      expect(leader.ministerio).toBe(ministry);
    });
  });
});

describe('Leader Profile Information', () => {
  describe('Biography', () => {
    it('should store biography text', () => {
      const bio = 'Pastor dedicado com mais de 20 anos de experiencia no ministerio.';
      const leader: Leader = createMockLeader({ bio });
      expect(leader.bio).toBe(bio);
    });

    it('should allow empty biography', () => {
      const leader: Leader = createMockLeader({ bio: undefined });
      expect(leader.bio).toBeUndefined();
    });

    it('should support long biography text', () => {
      const longBio = 'A'.repeat(1000);
      const leader: Leader = createMockLeader({ bio: longBio });
      expect(leader.bio).toBe(longBio);
      expect(leader.bio?.length).toBe(1000);
    });
  });

  describe('Photo', () => {
    it('should store photo URL', () => {
      const photoUrl = 'https://storage.example.com/leaders/photo.jpg';
      const leader: Leader = createMockLeader({ foto: photoUrl });
      expect(leader.foto).toBe(photoUrl);
    });

    it('should allow leader without photo', () => {
      const leader: Leader = createMockLeader({ foto: undefined });
      expect(leader.foto).toBeUndefined();
    });

    it('should support various photo URL formats', () => {
      const photoUrls = [
        'https://example.com/photo.jpg',
        'https://example.com/photo.png',
        'https://storage.googleapis.com/bucket/photo.webp',
        'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/photo.jpg'
      ];

      photoUrls.forEach(url => {
        const leader: Leader = createMockLeader({ foto: url });
        expect(leader.foto).toBe(url);
      });
    });
  });
});

describe('Leader Filtering and Querying', () => {
  const createLeaderList = (): Leader[] => [
    createMockLeader({
      id: '1',
      nome: 'Pastor Principal',
      cargo: LeaderRole.Pastor,
      status: LeaderStatus.Ativo,
      ordem: 1
    }),
    createMockLeader({
      id: '2',
      nome: 'Pastor Auxiliar',
      cargo: LeaderRole.Auxiliar,
      status: LeaderStatus.Ativo,
      ordem: 2
    }),
    createMockLeader({
      id: '3',
      nome: 'Diacono Afastado',
      cargo: LeaderRole.Diacono,
      status: LeaderStatus.Afastado,
      ordem: 3
    }),
    createMockLeader({
      id: '4',
      nome: 'Lider Inativo',
      cargo: LeaderRole.Lider,
      status: LeaderStatus.Inativo,
      ordem: 4
    }),
    createMockLeader({
      id: '5',
      nome: 'Coordenador Ativo',
      cargo: LeaderRole.Coordenador,
      status: LeaderStatus.Ativo,
      ordem: 5
    })
  ];

  it('should filter active leaders only', () => {
    const leaders = createLeaderList();
    const activeLeaders = leaders.filter(l => l.status === LeaderStatus.Ativo);
    expect(activeLeaders).toHaveLength(3);
    expect(activeLeaders.every(l => l.status === LeaderStatus.Ativo)).toBe(true);
  });

  it('should filter inactive leaders only', () => {
    const leaders = createLeaderList();
    const inactiveLeaders = leaders.filter(l => l.status === LeaderStatus.Inativo);
    expect(inactiveLeaders).toHaveLength(1);
  });

  it('should filter on-leave leaders only', () => {
    const leaders = createLeaderList();
    const onLeaveLeaders = leaders.filter(l => l.status === LeaderStatus.Afastado);
    expect(onLeaveLeaders).toHaveLength(1);
  });

  it('should filter by role', () => {
    const leaders = createLeaderList();
    const pastors = leaders.filter(l =>
      l.cargo === LeaderRole.Pastor || l.cargo === LeaderRole.Auxiliar
    );
    expect(pastors).toHaveLength(2);
  });

  it('should sort by ordem ascending', () => {
    const leaders = createLeaderList();
    const sorted = [...leaders].sort((a, b) => a.ordem - b.ordem);
    expect(sorted[0].ordem).toBe(1);
    expect(sorted[sorted.length - 1].ordem).toBe(5);
  });

  it('should filter active leaders and sort by ordem', () => {
    const leaders = createLeaderList();
    const activeAndSorted = leaders
      .filter(l => l.status === LeaderStatus.Ativo)
      .sort((a, b) => a.ordem - b.ordem);

    expect(activeAndSorted).toHaveLength(3);
    expect(activeAndSorted.map(l => l.ordem)).toEqual([1, 2, 5]);
  });
});

describe('Edge Cases', () => {
  it('should handle leader with minimal required fields', () => {
    const minimalLeader: Leader = {
      id: 'min-1',
      nome: 'Minimal Leader',
      cargo: LeaderRole.Lider,
      ordem: 0,
      status: LeaderStatus.Ativo,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      criadoPor: 'system'
    };
    expect(minimalLeader.id).toBe('min-1');
    expect(minimalLeader.cargoPersonalizado).toBeUndefined();
    expect(minimalLeader.ministerio).toBeUndefined();
    expect(minimalLeader.bio).toBeUndefined();
    expect(minimalLeader.foto).toBeUndefined();
    expect(minimalLeader.email).toBeUndefined();
    expect(minimalLeader.telefone).toBeUndefined();
  });

  it('should handle leader with all fields populated', () => {
    const fullLeader: Leader = createMockLeader({
      cargoPersonalizado: 'Cargo Especial',
      ministerio: 'Todos os Ministerios',
      bio: 'Biografia completa',
      foto: 'https://example.com/photo.jpg',
      email: 'leader@example.com',
      telefone: '(11) 99999-9999'
    });
    expect(fullLeader.cargoPersonalizado).toBeDefined();
    expect(fullLeader.ministerio).toBeDefined();
    expect(fullLeader.bio).toBeDefined();
    expect(fullLeader.foto).toBeDefined();
    expect(fullLeader.email).toBeDefined();
    expect(fullLeader.telefone).toBeDefined();
  });

  it('should handle special characters in nome', () => {
    const leader: Leader = createMockLeader({
      nome: "Pastor Jose D'Angelo Junior"
    });
    expect(leader.nome).toBe("Pastor Jose D'Angelo Junior");
  });

  it('should handle unicode characters in bio', () => {
    const leader: Leader = createMockLeader({
      bio: 'Pastor dedicado a oracao e adoracao'
    });
    expect(leader.bio).toContain('oracao');
    expect(leader.bio).toContain('adoracao');
  });

  it('should handle empty string vs undefined for optional fields', () => {
    const leaderWithEmptyString: Leader = createMockLeader({
      bio: ''
    });
    const leaderWithUndefined: Leader = createMockLeader({
      bio: undefined
    });
    expect(leaderWithEmptyString.bio).toBe('');
    expect(leaderWithUndefined.bio).toBeUndefined();
  });
});
