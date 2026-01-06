// Auth Service Interface
import { User } from '../entities/User';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface IAuthService {
  signIn(credentials: AuthCredentials): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  register(email: string, password: string, displayName: string): Promise<User>;
  resetPassword(email: string): Promise<void>;
  updatePassword(currentPassword: string, newPassword: string): Promise<void>;
}
