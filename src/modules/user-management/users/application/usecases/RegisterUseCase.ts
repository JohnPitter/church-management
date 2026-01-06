// Use Case - Register
// Contains the business logic for user registration

import { User, UserRegistration, UserRole } from '@modules/user-management/users/domain/entities/User';
import { IUserRepository } from '@modules/user-management/users/domain/repositories/IUserRepository';
import { MemberEntity } from '@modules/user-management/users/domain/entities/Member';

export interface RegisterUseCaseInput {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface RegisterUseCaseOutput {
  user: User;
  message: string;
}

export class RegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private notificationService: INotificationService
  ) {}

  async execute(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    // Validate input
    this.validateInput(input);

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Este email já está cadastrado');
    }

    // Prepare user data
    const userData: UserRegistration = {
      email: input.email.toLowerCase().trim(),
      password: input.password,
      displayName: input.displayName.trim()
    };

    // Create user with pending status
    const newUser = await this.userRepository.create(userData);

    // Send notification to administrators
    await this.notifyAdministrators(newUser);

    return {
      user: newUser,
      message: 'Cadastro realizado com sucesso! Sua conta está aguardando aprovação da secretaria.'
    };
  }

  private validateInput(input: RegisterUseCaseInput): void {
    // Validate required fields
    if (!input.email || !input.password || !input.displayName) {
      throw new Error('Todos os campos são obrigatórios');
    }

    // Validate email format
    if (!MemberEntity.validateEmail(input.email)) {
      throw new Error('Email inválido');
    }

    // Validate password strength
    if (input.password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    // Validate password confirmation
    if (input.password !== input.confirmPassword) {
      throw new Error('As senhas não coincidem');
    }

    // Validate display name
    if (input.displayName.length < 3) {
      throw new Error('O nome deve ter no mínimo 3 caracteres');
    }
  }

  private async notifyAdministrators(newUser: User): Promise<void> {
    // Get all administrators and secretaries
    const admins = await this.userRepository.findByRole(UserRole.Admin);
    const secretaries = await this.userRepository.findByRole(UserRole.Secretary);
    const notifyUsers = [...admins, ...secretaries];

    // Send notification to each one
    for (const user of notifyUsers) {
      await this.notificationService.send({
        userId: user.id,
        title: 'Nova solicitação de cadastro',
        message: `${newUser.displayName} (${newUser.email}) solicitou acesso ao sistema.`,
        type: 'user_registration',
        priority: 'high',
        actionUrl: '/admin/user-approval'
      });
    }
  }
}

// Notification Service Interface
export interface INotificationService {
  send(notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }): Promise<void>;
}