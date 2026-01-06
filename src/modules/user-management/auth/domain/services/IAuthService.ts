// Domain Service Interface - Auth Service
// Defines the contract for authentication services

import { User } from '@modules/user-management/users/domain/entities/User';

export interface IAuthService {
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, displayName: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  linkEmailPassword(password: string): Promise<void>;
  getSignInMethods(email: string): Promise<string[]>;
}