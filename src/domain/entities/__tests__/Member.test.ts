// Unit Tests - Member Entity
// Tests for Member business rules and validations

import { Member, MemberStatus, MaritalStatus, MemberEntity } from '../Member';

describe('MemberEntity', () => {
  const createTestMember = (overrides: Partial<Member> = {}): Member => ({
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    birthDate: new Date('1990-01-01'),
    address: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    },
    maritalStatus: MaritalStatus.Single,
    baptismDate: new Date('2010-01-01'),
    conversionDate: new Date('2009-01-01'),
    ministries: ['Louvor'],
    status: MemberStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    ...overrides
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      
      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);
      
      expect(age).toBe(25);
    });

    it('should handle birthday not yet occurred this year', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      birthDate.setMonth(birthDate.getMonth() + 1); // Next month
      
      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);
      
      expect(age).toBe(24);
    });
  });

  describe('isMinor', () => {
    it('should return true for members under 18', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 16);
      
      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(true);
    });

    it('should return false for members 18 or older', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);
      
      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(false);
    });
  });

  describe('isBaptized', () => {
    it('should return true when baptism date exists', () => {
      const member = createTestMember({ baptismDate: new Date() });
      expect(MemberEntity.isBaptized(member)).toBe(true);
    });

    it('should return false when baptism date is undefined', () => {
      const member = createTestMember({ baptismDate: undefined });
      expect(MemberEntity.isBaptized(member)).toBe(false);
    });
  });

  describe('canVoteInAssembly', () => {
    it('should return true for active, baptized, adult members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      
      const member = createTestMember({
        status: MemberStatus.Active,
        baptismDate: new Date(),
        birthDate
      });
      
      expect(MemberEntity.canVoteInAssembly(member)).toBe(true);
    });

    it('should return false for inactive members', () => {
      const member = createTestMember({ status: MemberStatus.Inactive });
      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for non-baptized members', () => {
      const member = createTestMember({ baptismDate: undefined });
      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for minor members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 16);
      
      const member = createTestMember({ birthDate });
      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });
  });

  describe('getYearsAsMember', () => {
    it('should calculate years as member correctly', () => {
      const conversionDate = new Date();
      conversionDate.setFullYear(conversionDate.getFullYear() - 5);
      
      const member = createTestMember({ conversionDate });
      const years = MemberEntity.getYearsAsMember(member);
      
      expect(years).toBe(5);
    });

    it('should return 0 when conversion date is not set', () => {
      const member = createTestMember({ conversionDate: undefined });
      expect(MemberEntity.getYearsAsMember(member)).toBe(0);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(MemberEntity.validateEmail('test@example.com')).toBe(true);
      expect(MemberEntity.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(MemberEntity.validateEmail('invalid-email')).toBe(false);
      expect(MemberEntity.validateEmail('test@')).toBe(false);
      expect(MemberEntity.validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone formats', () => {
      expect(MemberEntity.validatePhone('(11) 99999-9999')).toBe(true);
      expect(MemberEntity.validatePhone('(21) 8888-8888')).toBe(true);
    });

    it('should return false for invalid phone formats', () => {
      expect(MemberEntity.validatePhone('11 99999-9999')).toBe(false);
      expect(MemberEntity.validatePhone('(11) 999-999')).toBe(false);
      expect(MemberEntity.validatePhone('invalid')).toBe(false);
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit phone numbers correctly', () => {
      expect(MemberEntity.formatPhone('11999999999')).toBe('(11) 99999-9999');
    });

    it('should format 10-digit phone numbers correctly', () => {
      expect(MemberEntity.formatPhone('1188888888')).toBe('(11) 8888-8888');
    });

    it('should return original string for invalid formats', () => {
      expect(MemberEntity.formatPhone('123')).toBe('123');
      expect(MemberEntity.formatPhone('invalid')).toBe('invalid');
    });

    it('should handle already formatted numbers', () => {
      expect(MemberEntity.formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999');
    });
  });
});