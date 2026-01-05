// Domain Entity - Event
// Represents church events with business logic

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: EventCategory;
  isPublic: boolean;
  requiresConfirmation: boolean;
  allowAnonymousRegistration?: boolean;
  maxParticipants?: number;
  imageURL?: string;
  streamingURL?: string;
  responsible: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export enum EventStatus {
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface EventConfirmation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  status: ConfirmationStatus;
  confirmedAt: Date;
  notes?: string;
  // Fields for anonymous registrations
  userEmail?: string;
  userPhone?: string;
  isAnonymous?: boolean;
}

export enum ConfirmationStatus {
  Confirmed = 'confirmed',
  Declined = 'declined',
  Maybe = 'maybe'
}

// Business Rules
export class EventEntity {
  static isUpcoming(event: Event): boolean {
    return new Date(event.date) > new Date() && event.status === EventStatus.Scheduled;
  }

  static isPast(event: Event): boolean {
    return new Date(event.date) < new Date();
  }

  static isToday(event: Event): boolean {
    const today = new Date();
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  }

  static canConfirmAttendance(event: Event): boolean {
    return event.requiresConfirmation && 
           this.isUpcoming(event) && 
           event.status === EventStatus.Scheduled;
  }

  static hasAvailableSpots(event: Event, confirmedCount: number): boolean {
    if (!event.maxParticipants) return true;
    return confirmedCount < event.maxParticipants;
  }

  static getDaysUntilEvent(event: Event): number {
    const today = new Date();
    const eventDate = new Date(event.date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  static formatEventDateTime(event: Event): string {
    const date = new Date(event.date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return `${date.toLocaleDateString('pt-BR', options)} às ${event.time}`;
  }

  static shouldSendReminder(event: Event): boolean {
    const daysUntil = this.getDaysUntilEvent(event);
    return daysUntil === 7 || daysUntil === 3 || daysUntil === 1;
  }

  static validateEventDates(startDate: Date, endDate?: Date): boolean {
    if (endDate) {
      return startDate <= endDate;
    }
    return true;
  }
}
