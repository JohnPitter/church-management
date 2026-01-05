// Domain Repository Interface - Event
// Defines the contract for event data operations

import { Event, EventCategory, EventConfirmation, EventStatus } from '../entities/Event';

export interface IEventRepository {
  // Query methods
  findById(id: string): Promise<Event | null>;
  findAll(): Promise<Event[]>;
  findByStatus(status: EventStatus): Promise<Event[]>;
  findByCategory(categoryId: string): Promise<Event[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  findUpcoming(limit?: number): Promise<Event[]>;
  findPast(limit?: number): Promise<Event[]>;
  findPublicEvents(): Promise<Event[]>;
  
  // Command methods
  create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<void>;
  
  // Status management
  updateStatus(eventId: string, status: EventStatus): Promise<void>;
  cancelEvent(eventId: string, reason: string, cancelledBy: string): Promise<void>;
  
  // Categories
  findAllCategories(): Promise<EventCategory[]>;
  createCategory(category: Omit<EventCategory, 'id'>): Promise<EventCategory>;
  updateCategory(id: string, data: Partial<EventCategory>): Promise<EventCategory>;
  deleteCategory(id: string): Promise<void>;
  
  // Confirmations
  findConfirmations(eventId: string): Promise<EventConfirmation[]>;
  findUserConfirmations(userId: string): Promise<EventConfirmation[]>;
  confirmAttendance(confirmation: Omit<EventConfirmation, 'id' | 'confirmedAt'>): Promise<EventConfirmation>;
  updateConfirmation(id: string, status: EventConfirmation['status']): Promise<void>;
  deleteConfirmation(id: string): Promise<void>;
  countConfirmations(eventId: string): Promise<number>;
  
  // Anonymous registrations
  createAnonymousRegistration(registration: {
    eventId: string;
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }): Promise<EventConfirmation>;
}