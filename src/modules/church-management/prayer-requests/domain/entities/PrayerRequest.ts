// Domain Entity - Prayer Request
// Entity for managing prayer requests from the website

export interface PrayerRequest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  request: string;
  isUrgent: boolean;
  isAnonymous: boolean;
  status: PrayerRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  prayedBy: string[]; // Array of user emails who prayed for this request
  source: 'website' | 'app' | 'manual';
  ipAddress?: string;
}

export enum PrayerRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Praying = 'praying',
  Answered = 'answered',
  Rejected = 'rejected'
}

export interface CreatePrayerRequestData {
  name: string;
  email?: string;
  phone?: string;
  request: string;
  isUrgent?: boolean;
  isAnonymous?: boolean;
}

export class PrayerRequestEntity {
  static create(data: CreatePrayerRequestData): Omit<PrayerRequest, 'id'> {
    return {
      name: data.isAnonymous ? 'Anônimo' : data.name,
      email: data.isAnonymous ? undefined : data.email,
      phone: data.isAnonymous ? undefined : data.phone,
      request: data.request,
      isUrgent: data.isUrgent || false,
      isAnonymous: data.isAnonymous || false,
      status: PrayerRequestStatus.Pending,
      createdAt: new Date(),
      updatedAt: new Date(),
      prayedBy: [],
      source: 'website'
    };
  }

  static validate(data: CreatePrayerRequestData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Nome é obrigatório');
    }

    if (!data.request || data.request.trim() === '') {
      errors.push('Pedido de oração é obrigatório');
    }

    if (data.request && data.request.length < 10) {
      errors.push('Pedido de oração deve ter pelo menos 10 caracteres');
    }

    if (data.request && data.request.length > 2000) {
      errors.push('Pedido de oração deve ter no máximo 2000 caracteres');
    }

    if (data.email && !isValidEmail(data.email)) {
      errors.push('E-mail inválido');
    }

    return errors;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
