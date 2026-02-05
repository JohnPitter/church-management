// Unit Tests - Member Entity (Church Management Module)
// Comprehensive tests for Member business rules, validations, and edge cases

import {
  Member,
  Address,
  MaritalStatus,
  MemberStatus,
  MemberType,
  MemberEntity
} from '../Member';

describe('Member Entity', () => {
  // ============================================================================
  // Test Helpers
  // ============================================================================

  const createTestAddress = (overrides: Partial<Address> = {}): Address => ({
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apt 101',
    neighborhood: 'Centro',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01234567',
    ...overrides
  });

  const createTestMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-123',
    name: 'Joao Silva',
    email: 'joao.silva@example.com',
    phone: '(11) 99999-9999',
    birthDate: new Date('1990-05-15'),
    address: createTestAddress(),
    maritalStatus: MaritalStatus.Single,
    memberType: MemberType.Member,
    baptismDate: new Date('2010-06-20'),
    conversionDate: new Date('2009-03-10'),
    ministries: ['Louvor', 'Jovens'],
    role: 'Membro Ativo',
    observations: 'Membro fiel',
    photoURL: 'https://example.com/photo.jpg',
    status: MemberStatus.Active,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin-user-id',
    ...overrides
  });

  // ============================================================================
  // Enum Value Tests
  // ============================================================================

  describe('MaritalStatus Enum', () => {
    it('should have correct values for all marital statuses', () => {
      expect(MaritalStatus.Single).toBe('single');
      expect(MaritalStatus.Married).toBe('married');
      expect(MaritalStatus.Divorced).toBe('divorced');
      expect(MaritalStatus.Widowed).toBe('widowed');
    });

    it('should have exactly 4 marital status values', () => {
      const values = Object.values(MaritalStatus);
      expect(values).toHaveLength(4);
    });

    it('should contain all expected values', () => {
      const values = Object.values(MaritalStatus);
      expect(values).toContain('single');
      expect(values).toContain('married');
      expect(values).toContain('divorced');
      expect(values).toContain('widowed');
    });
  });

  describe('MemberStatus Enum', () => {
    it('should have correct values for all member statuses', () => {
      expect(MemberStatus.Active).toBe('active');
      expect(MemberStatus.Inactive).toBe('inactive');
      expect(MemberStatus.Transferred).toBe('transferred');
      expect(MemberStatus.Disciplined).toBe('disciplined');
    });

    it('should have exactly 4 member status values', () => {
      const values = Object.values(MemberStatus);
      expect(values).toHaveLength(4);
    });

    it('should contain all expected values', () => {
      const values = Object.values(MemberStatus);
      expect(values).toContain('active');
      expect(values).toContain('inactive');
      expect(values).toContain('transferred');
      expect(values).toContain('disciplined');
    });
  });

  describe('MemberType Enum', () => {
    it('should have correct values for all member types', () => {
      expect(MemberType.Member).toBe('member');
      expect(MemberType.Congregant).toBe('congregant');
    });

    it('should have exactly 2 member type values', () => {
      const values = Object.values(MemberType);
      expect(values).toHaveLength(2);
    });

    it('should contain all expected values', () => {
      const values = Object.values(MemberType);
      expect(values).toContain('member');
      expect(values).toContain('congregant');
    });
  });

  // ============================================================================
  // MemberEntity.calculateAge Tests
  // ============================================================================

  describe('MemberEntity.calculateAge', () => {
    it('should calculate age correctly for a member born 30 years ago', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      birthDate.setMonth(0); // January
      birthDate.setDate(1);

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      // If current month is January or later, age should be 30
      expect(age).toBeGreaterThanOrEqual(29);
      expect(age).toBeLessThanOrEqual(30);
    });

    it('should calculate age correctly when birthday has already passed this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, 0, 1); // Born Jan 1, 25 years ago

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      expect(age).toBe(25);
    });

    it('should calculate age correctly when birthday has not yet passed this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, 11, 31); // Born Dec 31, 25 years ago

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      // If today is before Dec 31, age should be 24
      if (today.getMonth() < 11 || (today.getMonth() === 11 && today.getDate() < 31)) {
        expect(age).toBe(24);
      } else {
        expect(age).toBe(25);
      }
    });

    it('should handle birthday on the same day', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 40,
        today.getMonth(),
        today.getDate()
      );

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      expect(age).toBe(40);
    });

    it('should calculate age correctly for a newborn (age 0)', () => {
      const today = new Date();
      const birthDate = new Date(today);

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      expect(age).toBe(0);
    });

    it('should calculate age correctly for elderly members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 90);

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      expect(age).toBeGreaterThanOrEqual(89);
      expect(age).toBeLessThanOrEqual(90);
    });

    it('should handle string date conversion from birthDate', () => {
      // Simulate a scenario where birthDate might come from database as a Date object
      const member = createTestMember({ birthDate: new Date('2000-06-15') });
      const age = MemberEntity.calculateAge(member);

      const expectedAge = new Date().getFullYear() - 2000;
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate();

      // Adjust expected age if birthday hasn't occurred yet this year
      if (currentMonth < 5 || (currentMonth === 5 && currentDay < 15)) {
        expect(age).toBe(expectedAge - 1);
      } else {
        expect(age).toBe(expectedAge);
      }
    });
  });

  // ============================================================================
  // MemberEntity.isMinor Tests
  // ============================================================================

  describe('MemberEntity.isMinor', () => {
    it('should return true for a 17-year-old member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 17);

      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(true);
    });

    it('should return true for a 10-year-old member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);

      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(true);
    });

    it('should return true for a newborn member', () => {
      const member = createTestMember({ birthDate: new Date() });
      expect(MemberEntity.isMinor(member)).toBe(true);
    });

    it('should return false for an 18-year-old member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      birthDate.setMonth(birthDate.getMonth() - 1); // Ensure birthday has passed

      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(false);
    });

    it('should return false for a 25-year-old member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(false);
    });

    it('should return false for elderly members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 70);

      const member = createTestMember({ birthDate });
      expect(MemberEntity.isMinor(member)).toBe(false);
    });

    it('should handle edge case of almost 18', () => {
      const today = new Date();
      // Born 18 years ago but birthday is next month
      const birthDate = new Date(
        today.getFullYear() - 18,
        today.getMonth() + 1,
        today.getDate()
      );

      const member = createTestMember({ birthDate });
      // Should still be 17 since birthday hasn't passed
      expect(MemberEntity.isMinor(member)).toBe(true);
    });
  });

  // ============================================================================
  // MemberEntity.isBaptized Tests
  // ============================================================================

  describe('MemberEntity.isBaptized', () => {
    it('should return true when baptismDate is set', () => {
      const member = createTestMember({ baptismDate: new Date('2015-03-20') });
      expect(MemberEntity.isBaptized(member)).toBe(true);
    });

    it('should return true when baptismDate is today', () => {
      const member = createTestMember({ baptismDate: new Date() });
      expect(MemberEntity.isBaptized(member)).toBe(true);
    });

    it('should return true when baptismDate is in the past', () => {
      const member = createTestMember({ baptismDate: new Date('1990-01-01') });
      expect(MemberEntity.isBaptized(member)).toBe(true);
    });

    it('should return false when baptismDate is undefined', () => {
      const member = createTestMember({ baptismDate: undefined });
      expect(MemberEntity.isBaptized(member)).toBe(false);
    });

    it('should return false when member is created without baptismDate', () => {
      const member: Member = {
        id: 'test-id',
        name: 'Test Member',
        email: 'test@example.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('2000-01-01'),
        address: createTestAddress(),
        maritalStatus: MaritalStatus.Single,
        memberType: MemberType.Congregant,
        ministries: [],
        status: MemberStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
        // baptismDate intentionally omitted
      };
      expect(MemberEntity.isBaptized(member)).toBe(false);
    });
  });

  // ============================================================================
  // MemberEntity.canVoteInAssembly Tests
  // ============================================================================

  describe('MemberEntity.canVoteInAssembly', () => {
    it('should return true for active, baptized, adult, official member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(true);
    });

    it('should return false for inactive members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Inactive,
        memberType: MemberType.Member,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for transferred members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Transferred,
        memberType: MemberType.Member,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for disciplined members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Disciplined,
        memberType: MemberType.Member,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for congregants (even if active, baptized, adult)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Congregant,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for non-baptized members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        baptismDate: undefined,
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false for minor members (even if active, baptized, official)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 16);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        baptismDate: new Date('2020-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return false when multiple conditions fail', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);

      const member = createTestMember({
        status: MemberStatus.Inactive,
        memberType: MemberType.Congregant,
        baptismDate: undefined,
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
    });

    it('should return true for member exactly 18 years old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      birthDate.setMonth(birthDate.getMonth() - 1); // Ensure 18th birthday has passed

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        baptismDate: new Date('2020-01-01'),
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(true);
    });
  });

  // ============================================================================
  // MemberEntity.canSignDocuments Tests
  // ============================================================================

  describe('MemberEntity.canSignDocuments', () => {
    it('should return true for active, adult, official member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(true);
    });

    it('should return true for active adult member without baptism', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        baptismDate: undefined,
        birthDate
      });

      // canSignDocuments doesn't require baptism
      expect(MemberEntity.canSignDocuments(member)).toBe(true);
    });

    it('should return false for inactive members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Inactive,
        memberType: MemberType.Member,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(false);
    });

    it('should return false for transferred members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Transferred,
        memberType: MemberType.Member,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(false);
    });

    it('should return false for disciplined members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Disciplined,
        memberType: MemberType.Member,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(false);
    });

    it('should return false for congregants', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Congregant,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(false);
    });

    it('should return false for minor members', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 16);

      const member = createTestMember({
        status: MemberStatus.Active,
        memberType: MemberType.Member,
        birthDate
      });

      expect(MemberEntity.canSignDocuments(member)).toBe(false);
    });
  });

  // ============================================================================
  // MemberEntity.isCongregant Tests
  // ============================================================================

  describe('MemberEntity.isCongregant', () => {
    it('should return true for congregant members', () => {
      const member = createTestMember({ memberType: MemberType.Congregant });
      expect(MemberEntity.isCongregant(member)).toBe(true);
    });

    it('should return false for official members', () => {
      const member = createTestMember({ memberType: MemberType.Member });
      expect(MemberEntity.isCongregant(member)).toBe(false);
    });
  });

  // ============================================================================
  // MemberEntity.isMember Tests
  // ============================================================================

  describe('MemberEntity.isMember', () => {
    it('should return true for official members', () => {
      const member = createTestMember({ memberType: MemberType.Member });
      expect(MemberEntity.isMember(member)).toBe(true);
    });

    it('should return false for congregants', () => {
      const member = createTestMember({ memberType: MemberType.Congregant });
      expect(MemberEntity.isMember(member)).toBe(false);
    });
  });

  // ============================================================================
  // MemberEntity.getYearsAsMember Tests
  // ============================================================================

  describe('MemberEntity.getYearsAsMember', () => {
    it('should calculate years as member correctly', () => {
      const conversionDate = new Date();
      conversionDate.setFullYear(conversionDate.getFullYear() - 10);

      const member = createTestMember({ conversionDate });
      const years = MemberEntity.getYearsAsMember(member);

      expect(years).toBe(10);
    });

    it('should return 0 when conversionDate is not set', () => {
      const member = createTestMember({ conversionDate: undefined });
      expect(MemberEntity.getYearsAsMember(member)).toBe(0);
    });

    it('should return 0 for member converted this year', () => {
      const conversionDate = new Date();

      const member = createTestMember({ conversionDate });
      const years = MemberEntity.getYearsAsMember(member);

      expect(years).toBe(0);
    });

    it('should calculate years for long-term members', () => {
      const conversionDate = new Date();
      conversionDate.setFullYear(conversionDate.getFullYear() - 50);

      const member = createTestMember({ conversionDate });
      const years = MemberEntity.getYearsAsMember(member);

      expect(years).toBe(50);
    });

    it('should calculate years for recently converted members', () => {
      const conversionDate = new Date();
      conversionDate.setFullYear(conversionDate.getFullYear() - 1);

      const member = createTestMember({ conversionDate });
      const years = MemberEntity.getYearsAsMember(member);

      expect(years).toBe(1);
    });
  });

  // ============================================================================
  // MemberEntity.validateEmail Tests
  // ============================================================================

  describe('MemberEntity.validateEmail', () => {
    describe('valid emails', () => {
      it('should return true for simple email', () => {
        expect(MemberEntity.validateEmail('test@example.com')).toBe(true);
      });

      it('should return true for email with subdomain', () => {
        expect(MemberEntity.validateEmail('user@mail.example.com')).toBe(true);
      });

      it('should return true for email with dots in local part', () => {
        expect(MemberEntity.validateEmail('user.name@example.com')).toBe(true);
      });

      it('should return true for email with plus sign', () => {
        expect(MemberEntity.validateEmail('user+tag@example.com')).toBe(true);
      });

      it('should return true for email with numbers', () => {
        expect(MemberEntity.validateEmail('user123@example123.com')).toBe(true);
      });

      it('should return true for email with different TLDs', () => {
        expect(MemberEntity.validateEmail('user@example.co.uk')).toBe(true);
        expect(MemberEntity.validateEmail('user@example.org')).toBe(true);
        expect(MemberEntity.validateEmail('user@example.net')).toBe(true);
        expect(MemberEntity.validateEmail('user@example.com.br')).toBe(true);
      });

      it('should return true for email with hyphens', () => {
        expect(MemberEntity.validateEmail('user-name@example-domain.com')).toBe(true);
      });

      it('should return true for email with underscores in local part', () => {
        expect(MemberEntity.validateEmail('user_name@example.com')).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it('should return false for email without @ symbol', () => {
        expect(MemberEntity.validateEmail('testexample.com')).toBe(false);
      });

      it('should return false for email without domain', () => {
        expect(MemberEntity.validateEmail('test@')).toBe(false);
      });

      it('should return false for email without local part', () => {
        expect(MemberEntity.validateEmail('@example.com')).toBe(false);
      });

      it('should return false for email without TLD', () => {
        expect(MemberEntity.validateEmail('test@example')).toBe(false);
      });

      it('should return false for email with spaces', () => {
        expect(MemberEntity.validateEmail('test @example.com')).toBe(false);
        expect(MemberEntity.validateEmail('test@ example.com')).toBe(false);
        expect(MemberEntity.validateEmail(' test@example.com')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(MemberEntity.validateEmail('')).toBe(false);
      });

      it('should return false for just a string', () => {
        expect(MemberEntity.validateEmail('notanemail')).toBe(false);
      });

      it('should return false for email with multiple @ symbols', () => {
        expect(MemberEntity.validateEmail('test@@example.com')).toBe(false);
        expect(MemberEntity.validateEmail('test@test@example.com')).toBe(false);
      });
    });
  });

  // ============================================================================
  // MemberEntity.validatePhone Tests
  // ============================================================================

  describe('MemberEntity.validatePhone', () => {
    describe('valid phone formats', () => {
      it('should return true for mobile phone with 9 digits (11 total)', () => {
        expect(MemberEntity.validatePhone('(11) 99999-9999')).toBe(true);
      });

      it('should return true for landline phone with 8 digits (10 total)', () => {
        expect(MemberEntity.validatePhone('(11) 8888-8888')).toBe(true);
      });

      it('should return true for different area codes', () => {
        expect(MemberEntity.validatePhone('(21) 99999-9999')).toBe(true);
        expect(MemberEntity.validatePhone('(31) 98765-4321')).toBe(true);
        expect(MemberEntity.validatePhone('(71) 91234-5678')).toBe(true);
      });

      it('should return true for landline with different area codes', () => {
        expect(MemberEntity.validatePhone('(21) 1234-5678')).toBe(true);
        expect(MemberEntity.validatePhone('(31) 2345-6789')).toBe(true);
      });
    });

    describe('invalid phone formats', () => {
      it('should return false for phone without parentheses', () => {
        expect(MemberEntity.validatePhone('11 99999-9999')).toBe(false);
      });

      it('should return false for phone without space after area code', () => {
        expect(MemberEntity.validatePhone('(11)99999-9999')).toBe(false);
      });

      it('should return false for phone without hyphen', () => {
        expect(MemberEntity.validatePhone('(11) 999999999')).toBe(false);
      });

      it('should return false for phone with wrong number of digits', () => {
        expect(MemberEntity.validatePhone('(11) 999-999')).toBe(false);
        expect(MemberEntity.validatePhone('(11) 999999-9999')).toBe(false);
        expect(MemberEntity.validatePhone('(11) 9999-99999')).toBe(false);
      });

      it('should return false for phone with letters', () => {
        expect(MemberEntity.validatePhone('(11) 9999a-9999')).toBe(false);
        expect(MemberEntity.validatePhone('(AB) 99999-9999')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(MemberEntity.validatePhone('')).toBe(false);
      });

      it('should return false for unformatted phone numbers', () => {
        expect(MemberEntity.validatePhone('11999999999')).toBe(false);
        expect(MemberEntity.validatePhone('1199999999')).toBe(false);
      });

      it('should return false for international format', () => {
        expect(MemberEntity.validatePhone('+55 11 99999-9999')).toBe(false);
        expect(MemberEntity.validatePhone('+5511999999999')).toBe(false);
      });
    });
  });

  // ============================================================================
  // MemberEntity.formatPhone Tests
  // ============================================================================

  describe('MemberEntity.formatPhone', () => {
    describe('11-digit phone numbers (mobile)', () => {
      it('should format raw 11-digit phone number', () => {
        expect(MemberEntity.formatPhone('11999999999')).toBe('(11) 99999-9999');
      });

      it('should format phone with different area codes', () => {
        expect(MemberEntity.formatPhone('21987654321')).toBe('(21) 98765-4321');
        expect(MemberEntity.formatPhone('31912345678')).toBe('(31) 91234-5678');
      });

      it('should strip non-numeric characters and format', () => {
        expect(MemberEntity.formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999');
        expect(MemberEntity.formatPhone('11-99999-9999')).toBe('(11) 99999-9999');
        expect(MemberEntity.formatPhone('11.99999.9999')).toBe('(11) 99999-9999');
      });
    });

    describe('10-digit phone numbers (landline)', () => {
      it('should format raw 10-digit phone number', () => {
        expect(MemberEntity.formatPhone('1188888888')).toBe('(11) 8888-8888');
      });

      it('should format landline with different area codes', () => {
        expect(MemberEntity.formatPhone('2123456789')).toBe('(21) 2345-6789');
        expect(MemberEntity.formatPhone('3134567890')).toBe('(31) 3456-7890');
      });

      it('should strip non-numeric characters and format landline', () => {
        expect(MemberEntity.formatPhone('(11) 8888-8888')).toBe('(11) 8888-8888');
        expect(MemberEntity.formatPhone('11-8888-8888')).toBe('(11) 8888-8888');
      });
    });

    describe('invalid phone lengths', () => {
      it('should return original string for too few digits', () => {
        expect(MemberEntity.formatPhone('123')).toBe('123');
        expect(MemberEntity.formatPhone('123456789')).toBe('123456789');
      });

      it('should return original string for too many digits', () => {
        expect(MemberEntity.formatPhone('123456789012')).toBe('123456789012');
        expect(MemberEntity.formatPhone('1234567890123')).toBe('1234567890123');
      });

      it('should return original string for non-numeric input', () => {
        expect(MemberEntity.formatPhone('invalid')).toBe('invalid');
        expect(MemberEntity.formatPhone('not-a-phone')).toBe('not-a-phone');
      });

      it('should return original string for empty input', () => {
        expect(MemberEntity.formatPhone('')).toBe('');
      });
    });

    describe('edge cases', () => {
      it('should return original string for phone with country code (too many digits)', () => {
        // +55 (11) 99999-9999 has 13 digits when cleaned, which is not 10 or 11
        expect(MemberEntity.formatPhone('+55 (11) 99999-9999')).toBe('+55 (11) 99999-9999');
      });

      it('should handle phone numbers with spaces', () => {
        expect(MemberEntity.formatPhone('11 99999 9999')).toBe('(11) 99999-9999');
      });

      it('should handle phone numbers with leading/trailing spaces', () => {
        expect(MemberEntity.formatPhone('  11999999999  ')).toBe('(11) 99999-9999');
      });
    });
  });

  // ============================================================================
  // Member Interface Tests
  // ============================================================================

  describe('Member Interface', () => {
    it('should create a valid member with all required fields', () => {
      const member: Member = {
        id: 'member-1',
        name: 'Test Member',
        email: 'test@example.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('1990-01-01'),
        address: createTestAddress(),
        maritalStatus: MaritalStatus.Single,
        memberType: MemberType.Member,
        ministries: [],
        status: MemberStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      };

      expect(member.id).toBe('member-1');
      expect(member.name).toBe('Test Member');
      expect(member.email).toBe('test@example.com');
      expect(member.phone).toBe('(11) 99999-9999');
      expect(member.birthDate).toBeInstanceOf(Date);
      expect(member.address).toBeDefined();
      expect(member.maritalStatus).toBe(MaritalStatus.Single);
      expect(member.memberType).toBe(MemberType.Member);
      expect(member.ministries).toEqual([]);
      expect(member.status).toBe(MemberStatus.Active);
      expect(member.createdAt).toBeInstanceOf(Date);
      expect(member.updatedAt).toBeInstanceOf(Date);
      expect(member.createdBy).toBe('admin');
    });

    it('should allow optional fields to be undefined', () => {
      const member: Member = {
        id: 'member-1',
        name: 'Test Member',
        email: 'test@example.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('1990-01-01'),
        address: createTestAddress(),
        maritalStatus: MaritalStatus.Single,
        memberType: MemberType.Congregant,
        ministries: [],
        status: MemberStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
        // Optional fields: baptismDate, conversionDate, role, observations, photoURL
      };

      expect(member.baptismDate).toBeUndefined();
      expect(member.conversionDate).toBeUndefined();
      expect(member.role).toBeUndefined();
      expect(member.observations).toBeUndefined();
      expect(member.photoURL).toBeUndefined();
    });

    it('should allow all optional fields to be set', () => {
      const member: Member = createTestMember();

      expect(member.baptismDate).toBeInstanceOf(Date);
      expect(member.conversionDate).toBeInstanceOf(Date);
      expect(member.role).toBe('Membro Ativo');
      expect(member.observations).toBe('Membro fiel');
      expect(member.photoURL).toBe('https://example.com/photo.jpg');
    });
  });

  // ============================================================================
  // Address Interface Tests
  // ============================================================================

  describe('Address Interface', () => {
    it('should create a valid address with all required fields', () => {
      const address: Address = {
        street: 'Rua Principal',
        number: '100',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01000000'
      };

      expect(address.street).toBe('Rua Principal');
      expect(address.number).toBe('100');
      expect(address.neighborhood).toBe('Centro');
      expect(address.city).toBe('Sao Paulo');
      expect(address.state).toBe('SP');
      expect(address.zipCode).toBe('01000000');
    });

    it('should allow complement to be undefined', () => {
      const address: Address = {
        street: 'Rua Principal',
        number: '100',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01000000'
      };

      expect(address.complement).toBeUndefined();
    });

    it('should allow complement to be set', () => {
      const address: Address = createTestAddress({ complement: 'Bloco A, Apt 101' });
      expect(address.complement).toBe('Bloco A, Apt 101');
    });
  });

  // ============================================================================
  // Member Lifecycle Tests
  // ============================================================================

  describe('Member Lifecycle', () => {
    it('should allow transition from Active to Inactive', () => {
      const member = createTestMember({ status: MemberStatus.Active });
      expect(member.status).toBe(MemberStatus.Active);

      const inactiveMember = { ...member, status: MemberStatus.Inactive };
      expect(inactiveMember.status).toBe(MemberStatus.Inactive);
    });

    it('should allow transition from Active to Transferred', () => {
      const member = createTestMember({ status: MemberStatus.Active });
      expect(member.status).toBe(MemberStatus.Active);

      const transferredMember = { ...member, status: MemberStatus.Transferred };
      expect(transferredMember.status).toBe(MemberStatus.Transferred);
    });

    it('should allow transition from Active to Disciplined', () => {
      const member = createTestMember({ status: MemberStatus.Active });
      expect(member.status).toBe(MemberStatus.Active);

      const disciplinedMember = { ...member, status: MemberStatus.Disciplined };
      expect(disciplinedMember.status).toBe(MemberStatus.Disciplined);
    });

    it('should allow transition from Inactive to Active', () => {
      const member = createTestMember({ status: MemberStatus.Inactive });
      expect(member.status).toBe(MemberStatus.Inactive);

      const activeMember = { ...member, status: MemberStatus.Active };
      expect(activeMember.status).toBe(MemberStatus.Active);
    });

    it('should allow transition from Congregant to Member', () => {
      const congregant = createTestMember({ memberType: MemberType.Congregant });
      expect(congregant.memberType).toBe(MemberType.Congregant);

      const member = { ...congregant, memberType: MemberType.Member };
      expect(member.memberType).toBe(MemberType.Member);
    });

    it('should properly update timestamps on member update', () => {
      const originalDate = new Date('2020-01-01');
      const updateDate = new Date('2024-06-15');

      const member = createTestMember({
        createdAt: originalDate,
        updatedAt: originalDate
      });

      const updatedMember = { ...member, updatedAt: updateDate };

      expect(updatedMember.createdAt).toEqual(originalDate);
      expect(updatedMember.updatedAt).toEqual(updateDate);
    });

    it('should handle member baptism event', () => {
      const member = createTestMember({ baptismDate: undefined });
      expect(MemberEntity.isBaptized(member)).toBe(false);

      const baptizedMember = { ...member, baptismDate: new Date() };
      expect(MemberEntity.isBaptized(baptizedMember)).toBe(true);
    });

    it('should handle member ministry assignment', () => {
      const member = createTestMember({ ministries: [] });
      expect(member.ministries).toHaveLength(0);

      const memberWithMinistries = {
        ...member,
        ministries: ['Louvor', 'Jovens', 'Evangelismo']
      };
      expect(memberWithMinistries.ministries).toHaveLength(3);
      expect(memberWithMinistries.ministries).toContain('Louvor');
      expect(memberWithMinistries.ministries).toContain('Jovens');
      expect(memberWithMinistries.ministries).toContain('Evangelismo');
    });

    it('should handle complete member profile update', () => {
      const member = createTestMember();

      const updatedMember: Member = {
        ...member,
        name: 'Joao Silva Santos',
        email: 'joao.santos@newemail.com',
        phone: '(21) 88888-8888',
        maritalStatus: MaritalStatus.Married,
        address: {
          ...member.address,
          street: 'Nova Rua',
          number: '456',
          city: 'Rio de Janeiro',
          state: 'RJ'
        },
        updatedAt: new Date()
      };

      expect(updatedMember.name).toBe('Joao Silva Santos');
      expect(updatedMember.email).toBe('joao.santos@newemail.com');
      expect(updatedMember.phone).toBe('(21) 88888-8888');
      expect(updatedMember.maritalStatus).toBe(MaritalStatus.Married);
      expect(updatedMember.address.street).toBe('Nova Rua');
      expect(updatedMember.address.city).toBe('Rio de Janeiro');
      expect(updatedMember.address.state).toBe('RJ');
    });
  });

  // ============================================================================
  // Edge Cases and Boundary Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle member with empty ministries array', () => {
      const member = createTestMember({ ministries: [] });
      expect(member.ministries).toHaveLength(0);
    });

    it('should handle member with many ministries', () => {
      const ministries = [
        'Louvor', 'Jovens', 'Evangelismo', 'Intercessao',
        'Criancas', 'Casais', 'Diaconia', 'Midia'
      ];
      const member = createTestMember({ ministries });
      expect(member.ministries).toHaveLength(8);
    });

    it('should handle very old member (100 years old)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 100);

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      expect(age).toBeGreaterThanOrEqual(99);
      expect(age).toBeLessThanOrEqual(100);
      expect(MemberEntity.isMinor(member)).toBe(false);
    });

    it('should handle member born on leap year', () => {
      // Feb 29, 2000 (leap year)
      const birthDate = new Date('2000-02-29');

      const member = createTestMember({ birthDate });
      const age = MemberEntity.calculateAge(member);

      // Age should be calculated correctly
      expect(age).toBeGreaterThan(0);
    });

    it('should handle address with empty complement', () => {
      const address = createTestAddress({ complement: '' });
      expect(address.complement).toBe('');
    });

    it('should handle very long observations', () => {
      const longObservation = 'A'.repeat(1000);
      const member = createTestMember({ observations: longObservation });
      expect(member.observations).toHaveLength(1000);
    });

    it('should handle special characters in member name', () => {
      const member = createTestMember({ name: 'Jose da Silva Jr.' });
      expect(member.name).toBe('Jose da Silva Jr.');
    });

    it('should handle unicode characters in member name', () => {
      const member = createTestMember({ name: 'Joao Pedro da Conceicao' });
      expect(member.name).toBe('Joao Pedro da Conceicao');
    });

    it('should handle member with role undefined vs empty string', () => {
      const memberUndefined = createTestMember({ role: undefined });
      const memberEmpty = createTestMember({ role: '' });

      expect(memberUndefined.role).toBeUndefined();
      expect(memberEmpty.role).toBe('');
    });
  });

  // ============================================================================
  // Business Rules Integration Tests
  // ============================================================================

  describe('Business Rules Integration', () => {
    it('should correctly identify a new congregant who cannot vote', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      const newCongregant = createTestMember({
        memberType: MemberType.Congregant,
        status: MemberStatus.Active,
        baptismDate: undefined,
        birthDate
      });

      expect(MemberEntity.isCongregant(newCongregant)).toBe(true);
      expect(MemberEntity.isMember(newCongregant)).toBe(false);
      expect(MemberEntity.isBaptized(newCongregant)).toBe(false);
      expect(MemberEntity.canVoteInAssembly(newCongregant)).toBe(false);
      expect(MemberEntity.canSignDocuments(newCongregant)).toBe(false);
    });

    it('should correctly identify a fully qualified voting member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 35);

      const qualifiedMember = createTestMember({
        memberType: MemberType.Member,
        status: MemberStatus.Active,
        baptismDate: new Date('2010-01-01'),
        birthDate
      });

      expect(MemberEntity.isMember(qualifiedMember)).toBe(true);
      expect(MemberEntity.isCongregant(qualifiedMember)).toBe(false);
      expect(MemberEntity.isBaptized(qualifiedMember)).toBe(true);
      expect(MemberEntity.isMinor(qualifiedMember)).toBe(false);
      expect(MemberEntity.canVoteInAssembly(qualifiedMember)).toBe(true);
      expect(MemberEntity.canSignDocuments(qualifiedMember)).toBe(true);
    });

    it('should correctly identify a baptized minor member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);

      const minorMember = createTestMember({
        memberType: MemberType.Member,
        status: MemberStatus.Active,
        baptismDate: new Date(),
        birthDate
      });

      expect(MemberEntity.isMember(minorMember)).toBe(true);
      expect(MemberEntity.isBaptized(minorMember)).toBe(true);
      expect(MemberEntity.isMinor(minorMember)).toBe(true);
      expect(MemberEntity.canVoteInAssembly(minorMember)).toBe(false);
      expect(MemberEntity.canSignDocuments(minorMember)).toBe(false);
    });

    it('should correctly identify a disciplined adult member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 40);

      const disciplinedMember = createTestMember({
        memberType: MemberType.Member,
        status: MemberStatus.Disciplined,
        baptismDate: new Date('2005-01-01'),
        birthDate
      });

      expect(MemberEntity.isMember(disciplinedMember)).toBe(true);
      expect(MemberEntity.isBaptized(disciplinedMember)).toBe(true);
      expect(MemberEntity.isMinor(disciplinedMember)).toBe(false);
      expect(MemberEntity.canVoteInAssembly(disciplinedMember)).toBe(false);
      expect(MemberEntity.canSignDocuments(disciplinedMember)).toBe(false);
    });

    it('should track member progression from congregant to voting member', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      // Step 1: New congregant arrives
      let member = createTestMember({
        memberType: MemberType.Congregant,
        status: MemberStatus.Active,
        baptismDate: undefined,
        conversionDate: undefined,
        birthDate
      });

      expect(MemberEntity.canVoteInAssembly(member)).toBe(false);
      expect(MemberEntity.canSignDocuments(member)).toBe(false);

      // Step 2: Congregant gets converted
      member = { ...member, conversionDate: new Date() };
      expect(MemberEntity.getYearsAsMember(member)).toBe(0);

      // Step 3: Gets baptized
      member = { ...member, baptismDate: new Date() };
      expect(MemberEntity.isBaptized(member)).toBe(true);
      expect(MemberEntity.canVoteInAssembly(member)).toBe(false); // Still congregant

      // Step 4: Becomes official member
      member = { ...member, memberType: MemberType.Member };
      expect(MemberEntity.isMember(member)).toBe(true);
      expect(MemberEntity.canVoteInAssembly(member)).toBe(true);
      expect(MemberEntity.canSignDocuments(member)).toBe(true);
    });
  });
});
