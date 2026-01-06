// Use Case - Login
// Contains the business logic for user authentication

import { User, UserCredentials, UserEntity } from '@modules/user-management/users/domain/entities/User';
import { IUserRepository } from '@modules/user-management/users/domain/repositories/IUserRepository';

export interface LoginUseCaseInput {
  email: string;
  password: string;
}

export interface LoginUseCaseOutput {
  user: User;
  token: string;
}

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    // Validate input
    if (!input.email || !input.password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Normalize email
    const credentials: UserCredentials = {
      email: input.email.toLowerCase().trim(),
      password: input.password
    };

    // Authenticate user
    const user = await this.userRepository.authenticate(credentials);
    
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Check if user can access the system
    if (!UserEntity.canAccessSystem(user)) {
      if (user.status === 'pending') {
        throw new Error('Sua conta está aguardando aprovação da secretaria');
      } else if (user.status === 'rejected') {
        throw new Error('Sua conta foi rejeitada. Entre em contato com a secretaria');
      } else if (user.status === 'suspended') {
        throw new Error('Sua conta está suspensa. Entre em contato com a administração');
      }
    }

    // Generate authentication token
    const token = await this.authService.generateToken(user);

    // Log successful login
    await this.authService.logLogin(user.id);

    return {
      user,
      token
    };
  }
}

// Auth Service Interface
export interface IAuthService {
  generateToken(user: User): Promise<string>;
  verifyToken(token: string): Promise<User | null>;
  logLogin(userId: string): Promise<void>;
  logLogout(userId: string): Promise<void>;
}