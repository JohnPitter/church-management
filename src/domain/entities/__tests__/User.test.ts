// Unit Tests - User Entity
// Tests for User business rules and validations

import { User, UserRole, UserStatus, UserEntity } from '../User';

describe('UserEntity', () => {
  const createTestUser = (overrides: Partial<User> = {}): User => ({
    id: '1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.Member,
    status: UserStatus.Approved,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  describe('canApproveUsers', () => {
    it('should return true for admin users', () => {
      const admin = createTestUser({ role: UserRole.Admin });
      expect(UserEntity.canApproveUsers(admin)).toBe(true);
    });

    it('should return true for secretary users', () => {
      const secretary = createTestUser({ role: UserRole.Secretary });
      expect(UserEntity.canApproveUsers(secretary)).toBe(true);
    });

    it('should return false for member users', () => {
      const member = createTestUser({ role: UserRole.Member });
      expect(UserEntity.canApproveUsers(member)).toBe(false);
    });
  });

  describe('canAccessSystem', () => {
    it('should return true for approved users', () => {
      const user = createTestUser({ status: UserStatus.Approved });
      expect(UserEntity.canAccessSystem(user)).toBe(true);
    });

    it('should return false for pending users', () => {
      const user = createTestUser({ status: UserStatus.Pending });
      expect(UserEntity.canAccessSystem(user)).toBe(false);
    });

    it('should return false for rejected users', () => {
      const user = createTestUser({ status: UserStatus.Rejected });
      expect(UserEntity.canAccessSystem(user)).toBe(false);
    });

    it('should return false for suspended users', () => {
      const user = createTestUser({ status: UserStatus.Suspended });
      expect(UserEntity.canAccessSystem(user)).toBe(false);
    });
  });

  describe('canManageFinances', () => {
    it('should return true for admin users', () => {
      const admin = createTestUser({ role: UserRole.Admin });
      expect(UserEntity.canManageFinances(admin)).toBe(true);
    });

    it('should return false for non-admin users', () => {
      const secretary = createTestUser({ role: UserRole.Secretary });
      const member = createTestUser({ role: UserRole.Member });
      
      expect(UserEntity.canManageFinances(secretary)).toBe(false);
      expect(UserEntity.canManageFinances(member)).toBe(false);
    });
  });

  describe('canCreateContent', () => {
    it('should return true for admin users', () => {
      const admin = createTestUser({ role: UserRole.Admin });
      expect(UserEntity.canCreateContent(admin)).toBe(true);
    });

    it('should return true for secretary users', () => {
      const secretary = createTestUser({ role: UserRole.Secretary });
      expect(UserEntity.canCreateContent(secretary)).toBe(true);
    });

    it('should return false for member users', () => {
      const member = createTestUser({ role: UserRole.Member });
      expect(UserEntity.canCreateContent(member)).toBe(false);
    });
  });

  describe('role checking methods', () => {
    it('should correctly identify admin users', () => {
      const admin = createTestUser({ role: UserRole.Admin });
      const nonAdmin = createTestUser({ role: UserRole.Member });
      
      expect(UserEntity.isAdmin(admin)).toBe(true);
      expect(UserEntity.isAdmin(nonAdmin)).toBe(false);
    });

    it('should correctly identify secretary users', () => {
      const secretary = createTestUser({ role: UserRole.Secretary });
      const nonSecretary = createTestUser({ role: UserRole.Member });
      
      expect(UserEntity.isSecretary(secretary)).toBe(true);
      expect(UserEntity.isSecretary(nonSecretary)).toBe(false);
    });

    it('should correctly identify member users', () => {
      const member = createTestUser({ role: UserRole.Member });
      const nonMember = createTestUser({ role: UserRole.Admin });
      
      expect(UserEntity.isMember(member)).toBe(true);
      expect(UserEntity.isMember(nonMember)).toBe(false);
    });
  });
});