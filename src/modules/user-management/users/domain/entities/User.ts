// Domain Entity - User
// This represents the core business entity, independent of any framework or database

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole | string; // Allow custom roles as strings
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  photoURL?: string;
  phoneNumber?: string;
  biography?: string;
}

export enum UserRole {
  Admin = 'admin',
  Secretary = 'secretary',
  Member = 'member',  // Membro da igreja
  Professional = 'professional'
}

export enum UserStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Suspended = 'suspended'
}

// Value Objects
export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  displayName: string;
  role?: UserRole;
}

// Business Rules
export class UserEntity {
  static canApproveUsers(user: User): boolean {
    return user.role === UserRole.Admin || user.role === UserRole.Secretary;
  }

  static canAccessSystem(user: User): boolean {
    return user.status === UserStatus.Approved;
  }

  static canAccessProfessionalArea(user: User): boolean {
    return user.role === UserRole.Professional && user.status === UserStatus.Approved;
  }

  static canManageFinances(user: User): boolean {
    return user.role === UserRole.Admin;
  }

  static canCreateContent(user: User): boolean {
    return user.role === UserRole.Admin || user.role === UserRole.Secretary;
  }

  static isAdmin(user: User): boolean {
    return user.role === UserRole.Admin;
  }

  static isSecretary(user: User): boolean {
    return user.role === UserRole.Secretary;
  }

  static isMember(user: User): boolean {
    return user.role === UserRole.Member || user.role === 'member';
  }

  static isProfessional(user: User): boolean {
    return user.role === UserRole.Professional;
  }
}
