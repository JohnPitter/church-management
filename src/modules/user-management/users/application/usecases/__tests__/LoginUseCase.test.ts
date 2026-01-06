// Unit Tests - LoginUseCase
// Tests for login business logic

import { LoginUseCase, IAuthService } from '@modules/user-management/auth/application/usecases/LoginUseCase';
import { IUserRepository } from '@modules/user-management/users/domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '@modules/user-management/users/domain/entities/User';

// Mock implementations
class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  setUsers(users: User[]) {
    this.users = users;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async authenticate(credentials: any): Promise<User | null> {
    const user = this.users.find(u => 
      u.email === credentials.email && 
      credentials.password === 'correct-password'
    );
    return user || null;
  }

  // Stub implementations for other methods
  async findAll(): Promise<User[]> { return []; }
  async findByRole(): Promise<User[]> { return []; }
  async findByStatus(): Promise<User[]> { return []; }
  async create(): Promise<User> { throw new Error('Not implemented'); }
  async update(): Promise<User> { throw new Error('Not implemented'); }
  async delete(): Promise<void> { throw new Error('Not implemented'); }
  async updatePassword(): Promise<void> { throw new Error('Not implemented'); }
  async approveUser(): Promise<void> { throw new Error('Not implemented'); }
  async rejectUser(): Promise<void> { throw new Error('Not implemented'); }
  async suspendUser(): Promise<void> { throw new Error('Not implemented'); }
  async updateRole(): Promise<void> { throw new Error('Not implemented'); }
}

class MockAuthService implements IAuthService {
  async generateToken(user: User): Promise<string> {
    return `token-${user.id}`;
  }

  async verifyToken(): Promise<User | null> {
    return null;
  }

  async logLogin(userId: string): Promise<void> {
    // Mock implementation
  }

  async logLogout(userId: string): Promise<void> {
    // Mock implementation
  }
}

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: MockUserRepository;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockAuthService = new MockAuthService();
    loginUseCase = new LoginUseCase(mockUserRepository, mockAuthService);
  });

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

  describe('execute', () => {
    it('should authenticate valid user successfully', async () => {
      // Arrange
      const user = createTestUser({ status: UserStatus.Approved });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: 'test@example.com',
        password: 'correct-password'
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(user);
      expect(result.token).toBe('token-1');
    });

    it('should throw error for missing email', async () => {
      // Arrange
      const input = {
        email: '',
        password: 'password'
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Email e senha são obrigatórios');
    });

    it('should throw error for missing password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: ''
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Email e senha são obrigatórios');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockUserRepository.setUsers([]);
      
      const input = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Email ou senha inválidos');
    });

    it('should throw error for pending user', async () => {
      // Arrange
      const user = createTestUser({ status: UserStatus.Pending });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: 'test@example.com',
        password: 'correct-password'
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Sua conta está aguardando aprovação da secretaria');
    });

    it('should throw error for rejected user', async () => {
      // Arrange
      const user = createTestUser({ status: UserStatus.Rejected });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: 'test@example.com',
        password: 'correct-password'
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Sua conta foi rejeitada. Entre em contato com a secretaria');
    });

    it('should throw error for suspended user', async () => {
      // Arrange
      const user = createTestUser({ status: UserStatus.Suspended });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: 'test@example.com',
        password: 'correct-password'
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Sua conta está suspensa. Entre em contato com a administração');
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const user = createTestUser({ 
        email: 'test@example.com',
        status: UserStatus.Approved 
      });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: 'TEST@EXAMPLE.COM',
        password: 'correct-password'
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(user);
    });

    it('should trim email whitespace', async () => {
      // Arrange
      const user = createTestUser({ 
        email: 'test@example.com',
        status: UserStatus.Approved 
      });
      mockUserRepository.setUsers([user]);
      
      const input = {
        email: '  test@example.com  ',
        password: 'correct-password'
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(user);
    });
  });
});