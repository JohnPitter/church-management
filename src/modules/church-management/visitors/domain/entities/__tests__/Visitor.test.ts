// Unit Tests - Visitor Entity
// Comprehensive tests for Visitor domain entity, enums, and business logic

import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  ContactAttempt,
  ContactType,
  ContactMethod,
  VisitRecord,
  ServiceType,
  VisitorStats
} from '../Visitor';

// Helper function to create a test visitor with default values
const createTestVisitor = (overrides: Partial<Visitor> = {}): Visitor => ({
  id: 'visitor-1',
  name: 'Maria Santos',
  email: 'maria@example.com',
  phone: '(11) 99999-9999',
  address: {
    street: 'Rua das Flores',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01234567'
  },
  birthDate: new Date('1990-05-15'),
  gender: 'feminino',
  maritalStatus: 'casado',
  profession: 'Professora',
  howDidYouKnow: 'Convite de amigo',
  interests: ['Louvor', 'Grupos de Estudo'],
  observations: 'Primeira visita muito positiva',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'admin-1',
  status: VisitorStatus.ACTIVE,
  firstVisitDate: new Date('2024-01-15'),
  lastVisitDate: new Date('2024-02-20'),
  totalVisits: 3,
  contactAttempts: [],
  followUpStatus: FollowUpStatus.PENDING,
  assignedTo: 'leader-1',
  isMember: false,
  ...overrides
});

// Helper function to create a test contact attempt
const createTestContactAttempt = (overrides: Partial<ContactAttempt> = {}): ContactAttempt => ({
  id: 'contact-1',
  date: new Date('2024-01-20'),
  type: ContactType.WELCOME,
  method: ContactMethod.PHONE,
  notes: 'Ligacao de boas-vindas realizada com sucesso',
  successful: true,
  contactedBy: 'leader-1',
  ...overrides
});

// Helper function to create a test visit record
const createTestVisitRecord = (overrides: Partial<VisitRecord> = {}): VisitRecord => ({
  id: 'visit-1',
  visitorId: 'visitor-1',
  visitDate: new Date('2024-01-15'),
  service: ServiceType.SUNDAY_MORNING,
  registeredBy: 'secretary-1',
  notes: 'Visitante acompanhado por membro',
  broughtBy: 'member-1',
  createdAt: new Date('2024-01-15'),
  ...overrides
});

// VisitorEntity class with business logic methods
class VisitorEntity {
  // Calculate visitor age
  static calculateAge(visitor: Visitor): number | null {
    if (!visitor.birthDate) return null;

    const today = new Date();
    const birthDate = new Date(visitor.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Check if visitor has been contacted recently (within days)
  static hasRecentContact(visitor: Visitor, withinDays: number = 7): boolean {
    if (visitor.contactAttempts.length === 0) return false;

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000);

    return visitor.contactAttempts.some(
      attempt => new Date(attempt.date) >= cutoffDate
    );
  }

  // Get the last contact attempt
  static getLastContactAttempt(visitor: Visitor): ContactAttempt | null {
    if (visitor.contactAttempts.length === 0) return null;

    const sortedAttempts = [...visitor.contactAttempts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedAttempts[0];
  }

  // Check if visitor needs follow-up
  static needsFollowUp(visitor: Visitor): boolean {
    // Already converted or inactive - no follow-up needed
    if (visitor.status === VisitorStatus.CONVERTED ||
        visitor.status === VisitorStatus.INACTIVE) {
      return false;
    }

    // Follow-up completed - no more needed
    if (visitor.followUpStatus === FollowUpStatus.COMPLETED) {
      return false;
    }

    return visitor.followUpStatus === FollowUpStatus.PENDING ||
           visitor.followUpStatus === FollowUpStatus.IN_PROGRESS;
  }

  // Calculate successful contact rate
  static getContactSuccessRate(visitor: Visitor): number {
    if (visitor.contactAttempts.length === 0) return 0;

    const successfulContacts = visitor.contactAttempts.filter(a => a.successful).length;
    return (successfulContacts / visitor.contactAttempts.length) * 100;
  }

  // Check if visitor is eligible for member conversion
  static isEligibleForConversion(visitor: Visitor, minVisits: number = 3): boolean {
    // Already a member
    if (visitor.isMember) return false;

    // Must be active
    if (visitor.status !== VisitorStatus.ACTIVE) return false;

    // Must have minimum visits
    if (visitor.totalVisits < minVisits) return false;

    // Must have completed follow-up
    if (visitor.followUpStatus !== FollowUpStatus.COMPLETED) return false;

    return true;
  }

  // Get days since first visit
  static getDaysSinceFirstVisit(visitor: Visitor): number {
    const now = new Date();
    const firstVisit = new Date(visitor.firstVisitDate);
    const diffTime = Math.abs(now.getTime() - firstVisit.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get days since last visit
  static getDaysSinceLastVisit(visitor: Visitor): number | null {
    if (!visitor.lastVisitDate) return null;

    const now = new Date();
    const lastVisit = new Date(visitor.lastVisitDate);
    const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if visitor is at risk of becoming inactive
  static isAtRisk(visitor: Visitor, inactiveDaysThreshold: number = 30): boolean {
    if (visitor.status !== VisitorStatus.ACTIVE) return false;

    const daysSinceLastVisit = this.getDaysSinceLastVisit(visitor);
    if (daysSinceLastVisit === null) {
      // If no last visit date, use first visit date
      const daysSinceFirstVisit = this.getDaysSinceFirstVisit(visitor);
      return daysSinceFirstVisit > inactiveDaysThreshold;
    }

    return daysSinceLastVisit > inactiveDaysThreshold;
  }

  // Get next scheduled contact date
  static getNextScheduledContact(visitor: Visitor): Date | null {
    if (visitor.contactAttempts.length === 0) return null;

    const lastAttempt = this.getLastContactAttempt(visitor);
    return lastAttempt?.nextContactDate || null;
  }

  // Format visitor status for display
  static formatStatus(status: VisitorStatus): string {
    const statusMap: Record<VisitorStatus, string> = {
      [VisitorStatus.ACTIVE]: 'Ativo',
      [VisitorStatus.INACTIVE]: 'Inativo',
      [VisitorStatus.CONVERTED]: 'Convertido',
      [VisitorStatus.NO_CONTACT]: 'Sem Contato'
    };
    return statusMap[status];
  }

  // Format follow-up status for display
  static formatFollowUpStatus(status: FollowUpStatus): string {
    const statusMap: Record<FollowUpStatus, string> = {
      [FollowUpStatus.PENDING]: 'Pendente',
      [FollowUpStatus.IN_PROGRESS]: 'Em Andamento',
      [FollowUpStatus.COMPLETED]: 'Concluido',
      [FollowUpStatus.NO_RESPONSE]: 'Sem Resposta'
    };
    return statusMap[status];
  }

  // Format contact type for display
  static formatContactType(type: ContactType): string {
    const typeMap: Record<ContactType, string> = {
      [ContactType.WELCOME]: 'Boas-vindas',
      [ContactType.FOLLOW_UP]: 'Acompanhamento',
      [ContactType.INVITATION]: 'Convite',
      [ContactType.PRAYER_REQUEST]: 'Pedido de Oracao',
      [ContactType.OTHER]: 'Outro'
    };
    return typeMap[type];
  }

  // Format contact method for display
  static formatContactMethod(method: ContactMethod): string {
    const methodMap: Record<ContactMethod, string> = {
      [ContactMethod.PHONE]: 'Telefone',
      [ContactMethod.EMAIL]: 'E-mail',
      [ContactMethod.WHATSAPP]: 'WhatsApp',
      [ContactMethod.IN_PERSON]: 'Pessoalmente',
      [ContactMethod.LETTER]: 'Carta'
    };
    return methodMap[method];
  }

  // Format service type for display
  static formatServiceType(service: ServiceType): string {
    const serviceMap: Record<ServiceType, string> = {
      [ServiceType.SUNDAY_MORNING]: 'Culto Domingo Manha',
      [ServiceType.SUNDAY_EVENING]: 'Culto Domingo Noite',
      [ServiceType.WEDNESDAY_PRAYER]: 'Culto de Oracao Quarta',
      [ServiceType.BIBLE_STUDY]: 'Estudo Biblico',
      [ServiceType.YOUTH_SERVICE]: 'Culto de Jovens',
      [ServiceType.CHILDREN_SERVICE]: 'Culto Infantil',
      [ServiceType.SPECIAL_EVENT]: 'Evento Especial',
      [ServiceType.OTHER]: 'Outro'
    };
    return serviceMap[service];
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone format (Brazilian)
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
    return phoneRegex.test(phone);
  }

  // Format phone number
  static formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return phone;
  }

  // Convert visitor to member (returns updated visitor object)
  static convertToMember(visitor: Visitor, memberId: string): Visitor {
    return {
      ...visitor,
      isMember: true,
      memberId,
      convertedToMemberAt: new Date(),
      status: VisitorStatus.CONVERTED,
      followUpStatus: FollowUpStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  // Add contact attempt (returns updated visitor object)
  static addContactAttempt(
    visitor: Visitor,
    attempt: Omit<ContactAttempt, 'id'>
  ): Visitor {
    const newAttempt: ContactAttempt = {
      ...attempt,
      id: `contact_${Date.now()}`
    };

    return {
      ...visitor,
      contactAttempts: [...visitor.contactAttempts, newAttempt],
      followUpStatus: attempt.successful
        ? FollowUpStatus.COMPLETED
        : FollowUpStatus.IN_PROGRESS,
      updatedAt: new Date()
    };
  }

  // Record visit (returns updated visitor object)
  static recordVisit(visitor: Visitor, visitDate: Date): Visitor {
    return {
      ...visitor,
      totalVisits: visitor.totalVisits + 1,
      lastVisitDate: visitDate,
      updatedAt: new Date()
    };
  }
}

// Export the entity class for use in other tests
export { VisitorEntity, createTestVisitor, createTestContactAttempt, createTestVisitRecord };

describe('Visitor Entity', () => {
  describe('Enums', () => {
    describe('VisitorStatus', () => {
      it('should have all expected values', () => {
        expect(VisitorStatus.ACTIVE).toBe('active');
        expect(VisitorStatus.INACTIVE).toBe('inactive');
        expect(VisitorStatus.CONVERTED).toBe('converted');
        expect(VisitorStatus.NO_CONTACT).toBe('no_contact');
      });

      it('should have exactly 4 status values', () => {
        const values = Object.values(VisitorStatus);
        expect(values).toHaveLength(4);
      });
    });

    describe('FollowUpStatus', () => {
      it('should have all expected values', () => {
        expect(FollowUpStatus.PENDING).toBe('pending');
        expect(FollowUpStatus.IN_PROGRESS).toBe('in_progress');
        expect(FollowUpStatus.COMPLETED).toBe('completed');
        expect(FollowUpStatus.NO_RESPONSE).toBe('no_response');
      });

      it('should have exactly 4 follow-up status values', () => {
        const values = Object.values(FollowUpStatus);
        expect(values).toHaveLength(4);
      });
    });

    describe('ContactType', () => {
      it('should have all expected values', () => {
        expect(ContactType.WELCOME).toBe('welcome');
        expect(ContactType.FOLLOW_UP).toBe('follow_up');
        expect(ContactType.INVITATION).toBe('invitation');
        expect(ContactType.PRAYER_REQUEST).toBe('prayer_request');
        expect(ContactType.OTHER).toBe('other');
      });

      it('should have exactly 5 contact type values', () => {
        const values = Object.values(ContactType);
        expect(values).toHaveLength(5);
      });
    });

    describe('ContactMethod', () => {
      it('should have all expected values', () => {
        expect(ContactMethod.PHONE).toBe('phone');
        expect(ContactMethod.EMAIL).toBe('email');
        expect(ContactMethod.WHATSAPP).toBe('whatsapp');
        expect(ContactMethod.IN_PERSON).toBe('in_person');
        expect(ContactMethod.LETTER).toBe('letter');
      });

      it('should have exactly 5 contact method values', () => {
        const values = Object.values(ContactMethod);
        expect(values).toHaveLength(5);
      });
    });

    describe('ServiceType', () => {
      it('should have all expected values', () => {
        expect(ServiceType.SUNDAY_MORNING).toBe('sunday_morning');
        expect(ServiceType.SUNDAY_EVENING).toBe('sunday_evening');
        expect(ServiceType.WEDNESDAY_PRAYER).toBe('wednesday_prayer');
        expect(ServiceType.BIBLE_STUDY).toBe('bible_study');
        expect(ServiceType.YOUTH_SERVICE).toBe('youth_service');
        expect(ServiceType.CHILDREN_SERVICE).toBe('children_service');
        expect(ServiceType.SPECIAL_EVENT).toBe('special_event');
        expect(ServiceType.OTHER).toBe('other');
      });

      it('should have exactly 8 service type values', () => {
        const values = Object.values(ServiceType);
        expect(values).toHaveLength(8);
      });
    });
  });

  describe('VisitorEntity', () => {
    describe('calculateAge', () => {
      it('should calculate age correctly for past birthdays', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() - 1, today.getDate());

        const visitor = createTestVisitor({ birthDate });
        const age = VisitorEntity.calculateAge(visitor);

        expect(age).toBe(30);
      });

      it('should calculate age correctly when birthday has not occurred yet this year', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());

        const visitor = createTestVisitor({ birthDate });
        const age = VisitorEntity.calculateAge(visitor);

        expect(age).toBe(29);
      });

      it('should handle birthday today', () => {
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

        const visitor = createTestVisitor({ birthDate });
        const age = VisitorEntity.calculateAge(visitor);

        expect(age).toBe(25);
      });

      it('should return null when birthDate is undefined', () => {
        const visitor = createTestVisitor({ birthDate: undefined });
        const age = VisitorEntity.calculateAge(visitor);

        expect(age).toBeNull();
      });
    });

    describe('hasRecentContact', () => {
      it('should return true when contact was made within the specified days', () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 3);

        const visitor = createTestVisitor({
          contactAttempts: [createTestContactAttempt({ date: recentDate })]
        });

        expect(VisitorEntity.hasRecentContact(visitor, 7)).toBe(true);
      });

      it('should return false when contact was made outside the specified days', () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);

        const visitor = createTestVisitor({
          contactAttempts: [createTestContactAttempt({ date: oldDate })]
        });

        expect(VisitorEntity.hasRecentContact(visitor, 7)).toBe(false);
      });

      it('should return false when there are no contact attempts', () => {
        const visitor = createTestVisitor({ contactAttempts: [] });
        expect(VisitorEntity.hasRecentContact(visitor)).toBe(false);
      });

      it('should use default of 7 days when withinDays is not specified', () => {
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

        const visitor = createTestVisitor({
          contactAttempts: [createTestContactAttempt({ date: sixDaysAgo })]
        });

        expect(VisitorEntity.hasRecentContact(visitor)).toBe(true);
      });
    });

    describe('getLastContactAttempt', () => {
      it('should return the most recent contact attempt', () => {
        const oldDate = new Date('2024-01-10');
        const recentDate = new Date('2024-01-20');

        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ id: 'old', date: oldDate }),
            createTestContactAttempt({ id: 'recent', date: recentDate })
          ]
        });

        const lastAttempt = VisitorEntity.getLastContactAttempt(visitor);
        expect(lastAttempt?.id).toBe('recent');
      });

      it('should return null when there are no contact attempts', () => {
        const visitor = createTestVisitor({ contactAttempts: [] });
        expect(VisitorEntity.getLastContactAttempt(visitor)).toBeNull();
      });

      it('should handle single contact attempt', () => {
        const visitor = createTestVisitor({
          contactAttempts: [createTestContactAttempt({ id: 'single' })]
        });

        const lastAttempt = VisitorEntity.getLastContactAttempt(visitor);
        expect(lastAttempt?.id).toBe('single');
      });
    });

    describe('needsFollowUp', () => {
      it('should return true for pending follow-up status', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          followUpStatus: FollowUpStatus.PENDING
        });

        expect(VisitorEntity.needsFollowUp(visitor)).toBe(true);
      });

      it('should return true for in-progress follow-up status', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          followUpStatus: FollowUpStatus.IN_PROGRESS
        });

        expect(VisitorEntity.needsFollowUp(visitor)).toBe(true);
      });

      it('should return false for converted visitors', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.CONVERTED,
          followUpStatus: FollowUpStatus.PENDING
        });

        expect(VisitorEntity.needsFollowUp(visitor)).toBe(false);
      });

      it('should return false for inactive visitors', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.INACTIVE,
          followUpStatus: FollowUpStatus.PENDING
        });

        expect(VisitorEntity.needsFollowUp(visitor)).toBe(false);
      });

      it('should return false for completed follow-up', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          followUpStatus: FollowUpStatus.COMPLETED
        });

        expect(VisitorEntity.needsFollowUp(visitor)).toBe(false);
      });
    });

    describe('getContactSuccessRate', () => {
      it('should calculate success rate correctly', () => {
        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ successful: true }),
            createTestContactAttempt({ id: 'c2', successful: true }),
            createTestContactAttempt({ id: 'c3', successful: false }),
            createTestContactAttempt({ id: 'c4', successful: false })
          ]
        });

        expect(VisitorEntity.getContactSuccessRate(visitor)).toBe(50);
      });

      it('should return 0 when there are no contact attempts', () => {
        const visitor = createTestVisitor({ contactAttempts: [] });
        expect(VisitorEntity.getContactSuccessRate(visitor)).toBe(0);
      });

      it('should return 100 when all contacts are successful', () => {
        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ successful: true }),
            createTestContactAttempt({ id: 'c2', successful: true })
          ]
        });

        expect(VisitorEntity.getContactSuccessRate(visitor)).toBe(100);
      });

      it('should return 0 when no contacts are successful', () => {
        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ successful: false }),
            createTestContactAttempt({ id: 'c2', successful: false })
          ]
        });

        expect(VisitorEntity.getContactSuccessRate(visitor)).toBe(0);
      });
    });

    describe('isEligibleForConversion', () => {
      it('should return true when all criteria are met', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          totalVisits: 5,
          followUpStatus: FollowUpStatus.COMPLETED,
          isMember: false
        });

        expect(VisitorEntity.isEligibleForConversion(visitor)).toBe(true);
      });

      it('should return false when visitor is already a member', () => {
        const visitor = createTestVisitor({
          isMember: true,
          status: VisitorStatus.ACTIVE,
          totalVisits: 5,
          followUpStatus: FollowUpStatus.COMPLETED
        });

        expect(VisitorEntity.isEligibleForConversion(visitor)).toBe(false);
      });

      it('should return false when visitor is not active', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.INACTIVE,
          totalVisits: 5,
          followUpStatus: FollowUpStatus.COMPLETED
        });

        expect(VisitorEntity.isEligibleForConversion(visitor)).toBe(false);
      });

      it('should return false when visitor has insufficient visits', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          totalVisits: 2,
          followUpStatus: FollowUpStatus.COMPLETED
        });

        expect(VisitorEntity.isEligibleForConversion(visitor)).toBe(false);
      });

      it('should return false when follow-up is not completed', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          totalVisits: 5,
          followUpStatus: FollowUpStatus.IN_PROGRESS
        });

        expect(VisitorEntity.isEligibleForConversion(visitor)).toBe(false);
      });

      it('should respect custom minimum visits parameter', () => {
        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          totalVisits: 5,
          followUpStatus: FollowUpStatus.COMPLETED,
          isMember: false
        });

        expect(VisitorEntity.isEligibleForConversion(visitor, 10)).toBe(false);
        expect(VisitorEntity.isEligibleForConversion(visitor, 5)).toBe(true);
      });
    });

    describe('getDaysSinceFirstVisit', () => {
      it('should calculate days correctly', () => {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const visitor = createTestVisitor({ firstVisitDate: tenDaysAgo });
        const days = VisitorEntity.getDaysSinceFirstVisit(visitor);

        expect(days).toBe(10);
      });

      it('should return 0 for today', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const visitor = createTestVisitor({ firstVisitDate: today });
        const days = VisitorEntity.getDaysSinceFirstVisit(visitor);

        expect(days).toBeLessThanOrEqual(1);
      });
    });

    describe('getDaysSinceLastVisit', () => {
      it('should calculate days correctly', () => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const visitor = createTestVisitor({ lastVisitDate: fiveDaysAgo });
        const days = VisitorEntity.getDaysSinceLastVisit(visitor);

        expect(days).toBe(5);
      });

      it('should return null when lastVisitDate is undefined', () => {
        const visitor = createTestVisitor({ lastVisitDate: undefined });
        expect(VisitorEntity.getDaysSinceLastVisit(visitor)).toBeNull();
      });
    });

    describe('isAtRisk', () => {
      it('should return true when visitor has not visited in over 30 days', () => {
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          lastVisitDate: fortyDaysAgo
        });

        expect(VisitorEntity.isAtRisk(visitor)).toBe(true);
      });

      it('should return false when visitor visited recently', () => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          lastVisitDate: fiveDaysAgo
        });

        expect(VisitorEntity.isAtRisk(visitor)).toBe(false);
      });

      it('should return false for non-active visitors', () => {
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

        const visitor = createTestVisitor({
          status: VisitorStatus.INACTIVE,
          lastVisitDate: fortyDaysAgo
        });

        expect(VisitorEntity.isAtRisk(visitor)).toBe(false);
      });

      it('should use first visit date when last visit date is undefined', () => {
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          firstVisitDate: fortyDaysAgo,
          lastVisitDate: undefined
        });

        expect(VisitorEntity.isAtRisk(visitor)).toBe(true);
      });

      it('should respect custom threshold parameter', () => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const visitor = createTestVisitor({
          status: VisitorStatus.ACTIVE,
          lastVisitDate: fifteenDaysAgo
        });

        expect(VisitorEntity.isAtRisk(visitor, 10)).toBe(true);
        expect(VisitorEntity.isAtRisk(visitor, 20)).toBe(false);
      });
    });

    describe('getNextScheduledContact', () => {
      it('should return the next contact date from last attempt', () => {
        const nextContactDate = new Date('2024-02-01');

        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ nextContactDate })
          ]
        });

        expect(VisitorEntity.getNextScheduledContact(visitor)).toEqual(nextContactDate);
      });

      it('should return null when there are no contact attempts', () => {
        const visitor = createTestVisitor({ contactAttempts: [] });
        expect(VisitorEntity.getNextScheduledContact(visitor)).toBeNull();
      });

      it('should return null when last attempt has no next contact date', () => {
        const visitor = createTestVisitor({
          contactAttempts: [
            createTestContactAttempt({ nextContactDate: undefined })
          ]
        });

        expect(VisitorEntity.getNextScheduledContact(visitor)).toBeNull();
      });
    });

    describe('Format Methods', () => {
      describe('formatStatus', () => {
        it('should format all statuses correctly', () => {
          expect(VisitorEntity.formatStatus(VisitorStatus.ACTIVE)).toBe('Ativo');
          expect(VisitorEntity.formatStatus(VisitorStatus.INACTIVE)).toBe('Inativo');
          expect(VisitorEntity.formatStatus(VisitorStatus.CONVERTED)).toBe('Convertido');
          expect(VisitorEntity.formatStatus(VisitorStatus.NO_CONTACT)).toBe('Sem Contato');
        });
      });

      describe('formatFollowUpStatus', () => {
        it('should format all follow-up statuses correctly', () => {
          expect(VisitorEntity.formatFollowUpStatus(FollowUpStatus.PENDING)).toBe('Pendente');
          expect(VisitorEntity.formatFollowUpStatus(FollowUpStatus.IN_PROGRESS)).toBe('Em Andamento');
          expect(VisitorEntity.formatFollowUpStatus(FollowUpStatus.COMPLETED)).toBe('Concluido');
          expect(VisitorEntity.formatFollowUpStatus(FollowUpStatus.NO_RESPONSE)).toBe('Sem Resposta');
        });
      });

      describe('formatContactType', () => {
        it('should format all contact types correctly', () => {
          expect(VisitorEntity.formatContactType(ContactType.WELCOME)).toBe('Boas-vindas');
          expect(VisitorEntity.formatContactType(ContactType.FOLLOW_UP)).toBe('Acompanhamento');
          expect(VisitorEntity.formatContactType(ContactType.INVITATION)).toBe('Convite');
          expect(VisitorEntity.formatContactType(ContactType.PRAYER_REQUEST)).toBe('Pedido de Oracao');
          expect(VisitorEntity.formatContactType(ContactType.OTHER)).toBe('Outro');
        });
      });

      describe('formatContactMethod', () => {
        it('should format all contact methods correctly', () => {
          expect(VisitorEntity.formatContactMethod(ContactMethod.PHONE)).toBe('Telefone');
          expect(VisitorEntity.formatContactMethod(ContactMethod.EMAIL)).toBe('E-mail');
          expect(VisitorEntity.formatContactMethod(ContactMethod.WHATSAPP)).toBe('WhatsApp');
          expect(VisitorEntity.formatContactMethod(ContactMethod.IN_PERSON)).toBe('Pessoalmente');
          expect(VisitorEntity.formatContactMethod(ContactMethod.LETTER)).toBe('Carta');
        });
      });

      describe('formatServiceType', () => {
        it('should format all service types correctly', () => {
          expect(VisitorEntity.formatServiceType(ServiceType.SUNDAY_MORNING)).toBe('Culto Domingo Manha');
          expect(VisitorEntity.formatServiceType(ServiceType.SUNDAY_EVENING)).toBe('Culto Domingo Noite');
          expect(VisitorEntity.formatServiceType(ServiceType.WEDNESDAY_PRAYER)).toBe('Culto de Oracao Quarta');
          expect(VisitorEntity.formatServiceType(ServiceType.BIBLE_STUDY)).toBe('Estudo Biblico');
          expect(VisitorEntity.formatServiceType(ServiceType.YOUTH_SERVICE)).toBe('Culto de Jovens');
          expect(VisitorEntity.formatServiceType(ServiceType.CHILDREN_SERVICE)).toBe('Culto Infantil');
          expect(VisitorEntity.formatServiceType(ServiceType.SPECIAL_EVENT)).toBe('Evento Especial');
          expect(VisitorEntity.formatServiceType(ServiceType.OTHER)).toBe('Outro');
        });
      });
    });

    describe('Validation Methods', () => {
      describe('validateEmail', () => {
        it('should return true for valid emails', () => {
          expect(VisitorEntity.validateEmail('test@example.com')).toBe(true);
          expect(VisitorEntity.validateEmail('user.name@domain.org')).toBe(true);
          expect(VisitorEntity.validateEmail('user+tag@domain.co.uk')).toBe(true);
        });

        it('should return false for invalid emails', () => {
          expect(VisitorEntity.validateEmail('invalid')).toBe(false);
          expect(VisitorEntity.validateEmail('invalid@')).toBe(false);
          expect(VisitorEntity.validateEmail('@domain.com')).toBe(false);
          expect(VisitorEntity.validateEmail('user@.com')).toBe(false);
          expect(VisitorEntity.validateEmail('')).toBe(false);
        });
      });

      describe('validatePhone', () => {
        it('should return true for valid phone formats', () => {
          expect(VisitorEntity.validatePhone('11999999999')).toBe(true);
          expect(VisitorEntity.validatePhone('1199999999')).toBe(true);
          expect(VisitorEntity.validatePhone('(11) 99999-9999')).toBe(true);
          expect(VisitorEntity.validatePhone('(11)99999-9999')).toBe(true);
        });

        it('should return false for invalid phone formats', () => {
          expect(VisitorEntity.validatePhone('123')).toBe(false);
          expect(VisitorEntity.validatePhone('abcdefghij')).toBe(false);
        });
      });

      describe('formatPhone', () => {
        it('should format 11-digit phone numbers', () => {
          expect(VisitorEntity.formatPhone('11999999999')).toBe('(11) 99999-9999');
        });

        it('should format 10-digit phone numbers', () => {
          expect(VisitorEntity.formatPhone('1199999999')).toBe('(11) 9999-9999');
        });

        it('should return original for invalid formats', () => {
          expect(VisitorEntity.formatPhone('123')).toBe('123');
          expect(VisitorEntity.formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999');
        });
      });
    });

    describe('Conversion Workflow', () => {
      describe('convertToMember', () => {
        it('should convert visitor to member correctly', () => {
          const visitor = createTestVisitor({
            status: VisitorStatus.ACTIVE,
            isMember: false
          });

          const converted = VisitorEntity.convertToMember(visitor, 'member-123');

          expect(converted.isMember).toBe(true);
          expect(converted.memberId).toBe('member-123');
          expect(converted.status).toBe(VisitorStatus.CONVERTED);
          expect(converted.followUpStatus).toBe(FollowUpStatus.COMPLETED);
          expect(converted.convertedToMemberAt).toBeDefined();
          expect(converted.updatedAt).toBeDefined();
        });

        it('should not modify the original visitor object', () => {
          const visitor = createTestVisitor({ isMember: false });
          const originalStatus = visitor.status;

          VisitorEntity.convertToMember(visitor, 'member-123');

          expect(visitor.isMember).toBe(false);
          expect(visitor.status).toBe(originalStatus);
        });
      });

      describe('addContactAttempt', () => {
        it('should add contact attempt to visitor', () => {
          const visitor = createTestVisitor({ contactAttempts: [] });

          const updated = VisitorEntity.addContactAttempt(visitor, {
            date: new Date(),
            type: ContactType.WELCOME,
            method: ContactMethod.PHONE,
            notes: 'First contact',
            successful: true,
            contactedBy: 'leader-1'
          });

          expect(updated.contactAttempts).toHaveLength(1);
          expect(updated.contactAttempts[0].type).toBe(ContactType.WELCOME);
          expect(updated.contactAttempts[0].id).toBeDefined();
        });

        it('should set follow-up status to COMPLETED when successful', () => {
          const visitor = createTestVisitor({
            contactAttempts: [],
            followUpStatus: FollowUpStatus.PENDING
          });

          const updated = VisitorEntity.addContactAttempt(visitor, {
            date: new Date(),
            type: ContactType.FOLLOW_UP,
            method: ContactMethod.WHATSAPP,
            notes: 'Successful contact',
            successful: true,
            contactedBy: 'leader-1'
          });

          expect(updated.followUpStatus).toBe(FollowUpStatus.COMPLETED);
        });

        it('should set follow-up status to IN_PROGRESS when unsuccessful', () => {
          const visitor = createTestVisitor({
            contactAttempts: [],
            followUpStatus: FollowUpStatus.PENDING
          });

          const updated = VisitorEntity.addContactAttempt(visitor, {
            date: new Date(),
            type: ContactType.FOLLOW_UP,
            method: ContactMethod.PHONE,
            notes: 'No answer',
            successful: false,
            contactedBy: 'leader-1'
          });

          expect(updated.followUpStatus).toBe(FollowUpStatus.IN_PROGRESS);
        });

        it('should preserve existing contact attempts', () => {
          const existingAttempt = createTestContactAttempt({ id: 'existing' });
          const visitor = createTestVisitor({
            contactAttempts: [existingAttempt]
          });

          const updated = VisitorEntity.addContactAttempt(visitor, {
            date: new Date(),
            type: ContactType.INVITATION,
            method: ContactMethod.EMAIL,
            notes: 'New contact',
            successful: true,
            contactedBy: 'leader-2'
          });

          expect(updated.contactAttempts).toHaveLength(2);
          expect(updated.contactAttempts[0].id).toBe('existing');
        });
      });

      describe('recordVisit', () => {
        it('should increment total visits', () => {
          const visitor = createTestVisitor({ totalVisits: 3 });
          const visitDate = new Date();

          const updated = VisitorEntity.recordVisit(visitor, visitDate);

          expect(updated.totalVisits).toBe(4);
        });

        it('should update last visit date', () => {
          const visitor = createTestVisitor();
          const visitDate = new Date('2024-03-15');

          const updated = VisitorEntity.recordVisit(visitor, visitDate);

          expect(updated.lastVisitDate).toEqual(visitDate);
        });

        it('should update the updatedAt timestamp', () => {
          const visitor = createTestVisitor();
          const originalUpdatedAt = visitor.updatedAt;

          const updated = VisitorEntity.recordVisit(visitor, new Date());

          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
        });

        it('should not modify the original visitor object', () => {
          const visitor = createTestVisitor({ totalVisits: 3 });

          VisitorEntity.recordVisit(visitor, new Date());

          expect(visitor.totalVisits).toBe(3);
        });
      });
    });

    describe('Follow-up Tracking', () => {
      it('should track multiple contact attempts chronologically', () => {
        let visitor = createTestVisitor({ contactAttempts: [] });

        // First contact
        visitor = VisitorEntity.addContactAttempt(visitor, {
          date: new Date('2024-01-15'),
          type: ContactType.WELCOME,
          method: ContactMethod.PHONE,
          notes: 'Welcome call',
          successful: false,
          contactedBy: 'leader-1'
        });

        // Second contact
        visitor = VisitorEntity.addContactAttempt(visitor, {
          date: new Date('2024-01-20'),
          type: ContactType.FOLLOW_UP,
          method: ContactMethod.WHATSAPP,
          notes: 'WhatsApp message',
          successful: true,
          contactedBy: 'leader-1'
        });

        expect(visitor.contactAttempts).toHaveLength(2);
        expect(visitor.followUpStatus).toBe(FollowUpStatus.COMPLETED);
      });

      it('should correctly identify visitors needing follow-up', () => {
        const visitors = [
          createTestVisitor({ id: '1', followUpStatus: FollowUpStatus.PENDING, status: VisitorStatus.ACTIVE }),
          createTestVisitor({ id: '2', followUpStatus: FollowUpStatus.IN_PROGRESS, status: VisitorStatus.ACTIVE }),
          createTestVisitor({ id: '3', followUpStatus: FollowUpStatus.COMPLETED, status: VisitorStatus.ACTIVE }),
          createTestVisitor({ id: '4', followUpStatus: FollowUpStatus.PENDING, status: VisitorStatus.CONVERTED })
        ];

        const needingFollowUp = visitors.filter(v => VisitorEntity.needsFollowUp(v));

        expect(needingFollowUp).toHaveLength(2);
        expect(needingFollowUp.map(v => v.id)).toContain('1');
        expect(needingFollowUp.map(v => v.id)).toContain('2');
      });
    });
  });

  describe('Test Helper Functions', () => {
    describe('createTestVisitor', () => {
      it('should create a valid visitor with default values', () => {
        const visitor = createTestVisitor();

        expect(visitor.id).toBe('visitor-1');
        expect(visitor.name).toBe('Maria Santos');
        expect(visitor.status).toBe(VisitorStatus.ACTIVE);
        expect(visitor.isMember).toBe(false);
      });

      it('should allow overriding default values', () => {
        const visitor = createTestVisitor({
          id: 'custom-id',
          name: 'Custom Name',
          status: VisitorStatus.CONVERTED
        });

        expect(visitor.id).toBe('custom-id');
        expect(visitor.name).toBe('Custom Name');
        expect(visitor.status).toBe(VisitorStatus.CONVERTED);
      });
    });

    describe('createTestContactAttempt', () => {
      it('should create a valid contact attempt with default values', () => {
        const attempt = createTestContactAttempt();

        expect(attempt.id).toBe('contact-1');
        expect(attempt.type).toBe(ContactType.WELCOME);
        expect(attempt.method).toBe(ContactMethod.PHONE);
        expect(attempt.successful).toBe(true);
      });

      it('should allow overriding default values', () => {
        const attempt = createTestContactAttempt({
          type: ContactType.INVITATION,
          method: ContactMethod.EMAIL,
          successful: false
        });

        expect(attempt.type).toBe(ContactType.INVITATION);
        expect(attempt.method).toBe(ContactMethod.EMAIL);
        expect(attempt.successful).toBe(false);
      });
    });

    describe('createTestVisitRecord', () => {
      it('should create a valid visit record with default values', () => {
        const record = createTestVisitRecord();

        expect(record.id).toBe('visit-1');
        expect(record.visitorId).toBe('visitor-1');
        expect(record.service).toBe(ServiceType.SUNDAY_MORNING);
      });

      it('should allow overriding default values', () => {
        const record = createTestVisitRecord({
          service: ServiceType.YOUTH_SERVICE,
          visitorId: 'visitor-2'
        });

        expect(record.service).toBe(ServiceType.YOUTH_SERVICE);
        expect(record.visitorId).toBe('visitor-2');
      });
    });
  });

  describe('Interface Type Validation', () => {
    describe('Visitor interface', () => {
      it('should have all required fields', () => {
        const visitor = createTestVisitor();

        // Required fields
        expect(visitor.id).toBeDefined();
        expect(visitor.name).toBeDefined();
        expect(visitor.createdAt).toBeDefined();
        expect(visitor.updatedAt).toBeDefined();
        expect(visitor.createdBy).toBeDefined();
        expect(visitor.status).toBeDefined();
        expect(visitor.firstVisitDate).toBeDefined();
        expect(visitor.totalVisits).toBeDefined();
        expect(visitor.contactAttempts).toBeDefined();
        expect(visitor.followUpStatus).toBeDefined();
        expect(visitor.isMember).toBeDefined();
      });

      it('should allow optional fields to be undefined', () => {
        const visitor = createTestVisitor({
          email: undefined,
          phone: undefined,
          address: undefined,
          birthDate: undefined,
          gender: undefined,
          maritalStatus: undefined,
          profession: undefined,
          howDidYouKnow: undefined,
          interests: undefined,
          observations: undefined,
          lastVisitDate: undefined,
          assignedTo: undefined,
          memberId: undefined,
          convertedToMemberAt: undefined
        });

        expect(visitor.email).toBeUndefined();
        expect(visitor.phone).toBeUndefined();
        expect(visitor.memberId).toBeUndefined();
      });
    });

    describe('ContactAttempt interface', () => {
      it('should have all required fields', () => {
        const attempt = createTestContactAttempt();

        expect(attempt.id).toBeDefined();
        expect(attempt.date).toBeDefined();
        expect(attempt.type).toBeDefined();
        expect(attempt.method).toBeDefined();
        expect(attempt.notes).toBeDefined();
        expect(attempt.successful).toBeDefined();
        expect(attempt.contactedBy).toBeDefined();
      });

      it('should allow optional nextContactDate', () => {
        const attempt = createTestContactAttempt({ nextContactDate: undefined });
        expect(attempt.nextContactDate).toBeUndefined();

        const attemptWithDate = createTestContactAttempt({
          nextContactDate: new Date('2024-02-01')
        });
        expect(attemptWithDate.nextContactDate).toBeDefined();
      });
    });

    describe('VisitRecord interface', () => {
      it('should have all required fields', () => {
        const record = createTestVisitRecord();

        expect(record.id).toBeDefined();
        expect(record.visitorId).toBeDefined();
        expect(record.visitDate).toBeDefined();
        expect(record.service).toBeDefined();
        expect(record.registeredBy).toBeDefined();
        expect(record.createdAt).toBeDefined();
      });

      it('should allow optional fields', () => {
        const record = createTestVisitRecord({
          notes: undefined,
          broughtBy: undefined
        });

        expect(record.notes).toBeUndefined();
        expect(record.broughtBy).toBeUndefined();
      });
    });

    describe('VisitorStats interface', () => {
      it('should have all statistic fields', () => {
        const stats: VisitorStats = {
          totalVisitors: 100,
          newThisMonth: 15,
          activeVisitors: 75,
          convertedToMembers: 20,
          pendingFollowUp: 30,
          averageVisitsPerVisitor: 2.5,
          retentionRate: 60.5,
          conversionRate: 20.0
        };

        expect(stats.totalVisitors).toBe(100);
        expect(stats.newThisMonth).toBe(15);
        expect(stats.activeVisitors).toBe(75);
        expect(stats.convertedToMembers).toBe(20);
        expect(stats.pendingFollowUp).toBe(30);
        expect(stats.averageVisitsPerVisitor).toBe(2.5);
        expect(stats.retentionRate).toBe(60.5);
        expect(stats.conversionRate).toBe(20.0);
      });
    });
  });
});
