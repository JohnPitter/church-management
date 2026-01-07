// Login Use Case
import { User } from '@modules/user-management/users/domain/entities/User';
import { IUserRepository } from '@modules/user-management/users/domain/repositories/IUserRepository';

// Re-export IAuthService for backward compatibility
export type { IAuthService } from '@modules/user-management/users/domain/services/IAuthService';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
  token?: string;
}

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // Stub implementation - actual implementation is in FirebaseAuthService
    throw new Error('LoginUseCase.execute must be implemented');
  }
}
