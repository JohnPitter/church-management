// Use Case - Confirm Event Attendance
// Business logic for confirming attendance to events

import { Event, EventEntity, EventConfirmation, ConfirmationStatus } from '../../entities/Event';
import { User, UserEntity } from '../../entities/User';
import { IEventRepository } from '../../repositories/IEventRepository';
import { INotificationService } from '../auth/RegisterUseCase';

export interface ConfirmEventAttendanceInput {
  eventId: string;
  status: ConfirmationStatus;
  notes?: string;
}

export class ConfirmEventAttendanceUseCase {
  constructor(
    private eventRepository: IEventRepository,
    private notificationService: INotificationService
  ) {}

  async execute(
    input: ConfirmEventAttendanceInput,
    currentUser: User
  ): Promise<EventConfirmation> {
    // Check if user is approved
    if (!UserEntity.canAccessSystem(currentUser)) {
      throw new Error('Você não tem permissão para confirmar presença');
    }

    // Get event
    const event = await this.eventRepository.findById(input.eventId);
    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Check if event allows confirmations
    if (!EventEntity.canConfirmAttendance(event)) {
      if (!event.requiresConfirmation) {
        throw new Error('Este evento não requer confirmação de presença');
      }
      if (!EventEntity.isUpcoming(event)) {
        throw new Error('Não é possível confirmar presença em eventos passados');
      }
      throw new Error('Não é possível confirmar presença neste evento');
    }

    // Check if confirming attendance (not declining)
    if (input.status === ConfirmationStatus.Confirmed) {
      // Check available spots
      const confirmedCount = await this.eventRepository.countConfirmations(event.id);
      if (!EventEntity.hasAvailableSpots(event, confirmedCount)) {
        throw new Error('Não há mais vagas disponíveis para este evento');
      }
    }

    // Check if user already has a confirmation
    const existingConfirmations = await this.eventRepository.findUserConfirmations(currentUser.id);
    const existingConfirmation = existingConfirmations.find(c => c.eventId === input.eventId);

    let confirmation: EventConfirmation;

    if (existingConfirmation) {
      // Update existing confirmation
      await this.eventRepository.updateConfirmation(
        existingConfirmation.id,
        input.status
      );
      
      confirmation = {
        ...existingConfirmation,
        status: input.status,
        notes: input.notes || existingConfirmation.notes
      };
    } else {
      // Create new confirmation
      confirmation = await this.eventRepository.confirmAttendance({
        eventId: input.eventId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        status: input.status,
        notes: input.notes
      });
    }

    // Notify event responsible if someone declined
    if (input.status === ConfirmationStatus.Declined) {
      await this.notifyEventResponsible(event, currentUser, input.notes);
    }

    return confirmation;
  }

  private async notifyEventResponsible(
    event: Event,
    user: User,
    notes?: string
  ): Promise<void> {
    await this.notificationService.send({
      userId: event.responsible,
      title: 'Participante não poderá comparecer',
      message: `${user.displayName} informou que não poderá comparecer ao evento "${event.title}"${
        notes ? `. Motivo: ${notes}` : ''
      }`,
      type: 'event',
      priority: 'medium',
      actionUrl: `/eventos/${event.id}`
    });
  }
}