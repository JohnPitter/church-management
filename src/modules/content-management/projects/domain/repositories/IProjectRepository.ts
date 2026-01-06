// Domain Repository Interface - Project
// Defines the contract for project data operations

import { Project, ProjectStatus, ProjectRegistration, RegistrationStatus } from '../entities/Project';

export interface IProjectRepository {
  // Project operations
  findById(id: string): Promise<Project | null>;
  findByName(name: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  findByStatus(status: ProjectStatus): Promise<Project[]>;
  findByResponsible(userId: string): Promise<Project[]>;
  findByCategory(category: string): Promise<Project[]>;
  findActive(): Promise<Project[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Project[]>;
  
  // CRUD operations
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: ProjectStatus): Promise<void>;
  
  // Registration operations
  findRegistrations(projectId: string): Promise<ProjectRegistration[]>;
  findUserRegistrations(userId: string): Promise<ProjectRegistration[]>;
  createRegistration(registration: Omit<ProjectRegistration, 'id' | 'registrationDate'>): Promise<ProjectRegistration>;
  updateRegistrationStatus(registrationId: string, status: RegistrationStatus, approvedBy?: string): Promise<void>;
  deleteRegistration(registrationId: string): Promise<void>;
  countRegistrations(projectId: string, status?: RegistrationStatus): Promise<number>;
  
  // Analytics
  getProjectStats(projectId: string): Promise<{
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    completionPercentage: number;
  }>;
}