// Use Case - Create Event
// Business logic for creating church events

import { Event, EventStatus } from '@modules/church-management/events/domain/entities/Event';
import { User, UserEntity } from '@modules/user-management/users/domain/entities/User';
import { IEventRepository } from '@modules/church-management/events/domain/repositories/IEventRepository';
import { IAuditService } from '@modules/church-management/events/domain/services/IAuditService';
import { INotificationService } from '@modules/user-management/auth/application/usecases/RegisterUseCase';

export interface CreateEventUseCaseInput {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  categoryId: string;
  isPublic: boolean;
  requiresConfirmation: boolean;
  maxParticipants?: number;
  imageURL?: string;
  streamingURL?: string;
}

export class CreateEventUseCase {
  constructor(
    private eventRepository: IEventRepository,
    private auditService: IAuditService,
    private notificationService: INotificationService
  ) {}

  async execute(
    input: CreateEventUseCaseInput,
    currentUser: User
  ): Promise<Event> {
    // Check permissions
    if (!UserEntity.canCreateContent(currentUser)) {
      throw new Error('Você não tem permissão para criar eventos');
    }

    // Validate input
    this.validateInput(input);

    // Get category to ensure it exists
    const categories = await this.eventRepository.findAllCategories();
    const category = categories.find(c => c.id === input.categoryId);
    
    if (!category) {
      throw new Error('Categoria de evento inválida');
    }

    // Prepare event data
    const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      title: input.title.trim(),
      description: input.description.trim(),
      date: new Date(input.date),
      time: input.time,
      location: input.location.trim(),
      category,
      isPublic: input.isPublic,
      requiresConfirmation: input.requiresConfirmation,
      maxParticipants: input.maxParticipants,
      imageURL: input.imageURL,
      streamingURL: input.streamingURL,
      responsible: currentUser.id,
      status: EventStatus.Scheduled,
      createdBy: currentUser.id
    };

    // Create event
    const newEvent = await this.eventRepository.create(eventData);

    // Log action
    await this.auditService.log({
      userId: currentUser.id,
      action: 'CREATE_EVENT',
      entityType: 'event',
      entityId: newEvent.id,
      details: {
        eventTitle: newEvent.title,
        eventDate: newEvent.date,
        eventCategory: category.name
      }
    });

    // Send notification if it's a public event
    if (input.isPublic) {
      await this.notifyMembers(newEvent);
    }

    return newEvent;
  }

  private validateInput(input: CreateEventUseCaseInput): void {
    // Validate required fields
    if (!input.title || !input.description || !input.date || 
        !input.time || !input.location || !input.categoryId) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos');
    }

    // Validate title
    if (input.title.length < 3 || input.title.length > 100) {
      throw new Error('O título deve ter entre 3 e 100 caracteres');
    }

    // Validate description
    if (input.description.length < 10) {
      throw new Error('A descrição deve ter no mínimo 10 caracteres');
    }

    // Validate date
    const eventDate = new Date(input.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      throw new Error('A data do evento não pode ser no passado');
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(input.time)) {
      throw new Error('Horário inválido. Use o formato HH:mm');
    }

    // Validate max participants
    if (input.maxParticipants !== undefined && input.maxParticipants < 1) {
      throw new Error('O número máximo de participantes deve ser maior que zero');
    }

    // Validate URLs if provided
    if (input.imageURL && !this.isValidURL(input.imageURL)) {
      throw new Error('URL da imagem inválida');
    }

    if (input.streamingURL && !this.isValidURL(input.streamingURL)) {
      throw new Error('URL de transmissão inválida');
    }
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async notifyMembers(event: Event): Promise<void> {
    // In a real implementation, this would notify all active members
    // For now, we'll just log the intention
    
    // Future implementation would:
    // 1. Get all active members
    // 2. Check their notification preferences
    // 3. Send notifications based on preferences
  }
}