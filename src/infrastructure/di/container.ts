// Dependency Injection Container
// Manages all dependencies and their lifecycles

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { FirebaseMemberRepository } from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository';
import { FirebaseEventRepository } from '@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository';
import { LoginUseCase } from '@modules/user-management/users/application/usecases/LoginUseCase';
import { RegisterUseCase } from '@modules/user-management/users/application/usecases/RegisterUseCase';
import { CreateMemberUseCase } from '@modules/church-management/members/application/usecases/CreateMemberUseCase';
import { FirebaseAuthService } from '../services/FirebaseAuthService';
import { FirebaseNotificationService } from '../services/FirebaseNotificationService';
import { FirebaseAuditService } from '../services/FirebaseAuditService';

class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.registerRepositories();
    this.registerServices();
    this.registerUseCases();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private registerRepositories(): void {
    // Register repository implementations
    this.services.set('IUserRepository', new FirebaseUserRepository());
    this.services.set('IMemberRepository', new FirebaseMemberRepository());
    this.services.set('IEventRepository', new FirebaseEventRepository());
  }

  private registerServices(): void {
    // Register service implementations
    this.services.set('IAuthService', new FirebaseAuthService());
    this.services.set('INotificationService', new FirebaseNotificationService());
    this.services.set('IAuditService', new FirebaseAuditService());
  }

  private registerUseCases(): void {
    // Register use cases with their dependencies
    this.services.set('LoginUseCase', new LoginUseCase(
      this.get<IUserRepository>('IUserRepository'),
      this.get('IAuthService')
    ));

    this.services.set('RegisterUseCase', new RegisterUseCase(
      this.get<IUserRepository>('IUserRepository'),
      this.get('INotificationService')
    ));

    this.services.set('CreateMemberUseCase', new CreateMemberUseCase(
      this.get<IMemberRepository>('IMemberRepository'),
      this.get('IAuditService')
    ));
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }

  // Factory methods for common use cases
  getUserRepository(): IUserRepository {
    return this.get<IUserRepository>('IUserRepository');
  }

  getMemberRepository(): IMemberRepository {
    return this.get<IMemberRepository>('IMemberRepository');
  }

  getEventRepository(): IEventRepository {
    return this.get<IEventRepository>('IEventRepository');
  }

  getLoginUseCase(): LoginUseCase {
    return this.get<LoginUseCase>('LoginUseCase');
  }

  getRegisterUseCase(): RegisterUseCase {
    return this.get<RegisterUseCase>('RegisterUseCase');
  }

  getCreateMemberUseCase(): CreateMemberUseCase {
    return this.get<CreateMemberUseCase>('CreateMemberUseCase');
  }
}

// Export singleton instance
export const container = DIContainer.getInstance();

// Export typed getters for better TypeScript support
export const getContainer = () => container;
export const getUserRepository = () => container.getUserRepository();
export const getMemberRepository = () => container.getMemberRepository();
export const getEventRepository = () => container.getEventRepository();
export const getLoginUseCase = () => container.getLoginUseCase();
export const getRegisterUseCase = () => container.getRegisterUseCase();
export const getCreateMemberUseCase = () => container.getCreateMemberUseCase();