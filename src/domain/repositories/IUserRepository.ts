// Domain Repository Interface - User
// This is a port that defines how the domain interacts with user data

import { User, UserCredentials, UserRegistration, UserRole, UserStatus } from '../entities/User';

export interface IUserRepository {
  // Query methods
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findByRole(role: UserRole): Promise<User[]>;
  findByStatus(status: UserStatus): Promise<User[]>;
  
  // Command methods
  create(data: UserRegistration): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  
  // Authentication
  authenticate(credentials: UserCredentials): Promise<User | null>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
  
  // Status management
  approveUser(userId: string, approvedBy: string): Promise<void>;
  rejectUser(userId: string, rejectedBy: string, reason: string): Promise<void>;
  suspendUser(userId: string, suspendedBy: string, reason: string): Promise<void>;
  
  // Role management
  updateRole(userId: string, newRole: UserRole, updatedBy: string): Promise<void>;
}