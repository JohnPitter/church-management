// Register Use Case - Re-export for backward compatibility
// This file provides the INotificationService interface and RegisterUseCase

export interface INotificationService {
  notifyNewEvent(eventId: string, eventTitle: string): Promise<void>;
  notifyNewMember(memberId: string, memberName: string): Promise<void>;
  notifyAll(title: string, message: string): Promise<void>;
  send(notification: {
    title: string;
    message: string;
    userId?: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
  }): Promise<void>;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterOutput {
  userId: string;
  email: string;
  displayName: string;
}

export class RegisterUseCase {
  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Stub implementation - actual implementation is in FirebaseAuthService
    throw new Error('RegisterUseCase.execute must be implemented');
  }
}
