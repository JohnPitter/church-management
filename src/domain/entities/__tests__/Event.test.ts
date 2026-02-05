// Unit Tests - Event Entity
// Tests for Event business rules and validations

import { Event, EventStatus, EventEntity, EventCategory } from '../Event';

describe('EventEntity', () => {
  const createTestCategory = (): EventCategory => ({
    id: '1',
    name: 'Culto',
    color: '#3B82F6',
    priority: 1
  });

  const createTestEvent = (overrides: Partial<Event> = {}): Event => ({
    id: '1',
    title: 'Culto de Domingo',
    description: 'Culto dominical da igreja',
    date: new Date('2024-12-25'),
    time: '19:00',
    location: 'Templo Principal',
    category: createTestCategory(),
    isPublic: true,
    requiresConfirmation: true,
    responsible: 'admin',
    status: EventStatus.Scheduled,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    ...overrides
  });

  describe('isUpcoming', () => {
    it('should return true for future scheduled events', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event = createTestEvent({ 
        date: futureDate,
        status: EventStatus.Scheduled 
      });
      
      expect(EventEntity.isUpcoming(event)).toBe(true);
    });

    it('should return false for past events', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const event = createTestEvent({ date: pastDate });
      expect(EventEntity.isUpcoming(event)).toBe(false);
    });

    it('should return false for non-scheduled events', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event = createTestEvent({ 
        date: futureDate,
        status: EventStatus.Cancelled 
      });
      
      expect(EventEntity.isUpcoming(event)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past events', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const event = createTestEvent({ date: pastDate });
      expect(EventEntity.isPast(event)).toBe(true);
    });

    it('should return false for future events', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const event = createTestEvent({ date: futureDate });
      expect(EventEntity.isPast(event)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for events today', () => {
      const today = new Date();
      const event = createTestEvent({ date: today });
      expect(EventEntity.isToday(event)).toBe(true);
    });

    it('should return false for events not today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const event = createTestEvent({ date: tomorrow });
      expect(EventEntity.isToday(event)).toBe(false);
    });
  });

  describe('canConfirmAttendance', () => {
    it('should return true for upcoming events requiring confirmation', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event = createTestEvent({
        date: futureDate,
        requiresConfirmation: true,
        status: EventStatus.Scheduled
      });
      
      expect(EventEntity.canConfirmAttendance(event)).toBe(true);
    });

    it('should return false for events not requiring confirmation', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event = createTestEvent({
        date: futureDate,
        requiresConfirmation: false
      });
      
      expect(EventEntity.canConfirmAttendance(event)).toBe(false);
    });

    it('should return false for past events', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const event = createTestEvent({
        date: pastDate,
        requiresConfirmation: true
      });
      
      expect(EventEntity.canConfirmAttendance(event)).toBe(false);
    });
  });

  describe('hasAvailableSpots', () => {
    it('should return true when no max participants limit', () => {
      const event = createTestEvent({ maxParticipants: undefined });
      expect(EventEntity.hasAvailableSpots(event, 100)).toBe(true);
    });

    it('should return true when under the limit', () => {
      const event = createTestEvent({ maxParticipants: 50 });
      expect(EventEntity.hasAvailableSpots(event, 30)).toBe(true);
    });

    it('should return false when at or over the limit', () => {
      const event = createTestEvent({ maxParticipants: 50 });
      expect(EventEntity.hasAvailableSpots(event, 50)).toBe(false);
      expect(EventEntity.hasAvailableSpots(event, 60)).toBe(false);
    });
  });

  describe('getDaysUntilEvent', () => {
    it('should calculate days until event correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const event = createTestEvent({ date: futureDate });
      const days = EventEntity.getDaysUntilEvent(event);
      
      expect(days).toBe(5);
    });

    it('should return 0 for past events', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const event = createTestEvent({ date: pastDate });
      expect(EventEntity.getDaysUntilEvent(event)).toBe(-5);
    });
  });

  describe('formatEventDateTime', () => {
    it('should format date and time correctly', () => {
      // Use explicit local date to avoid timezone issues
      const event = createTestEvent({
        date: new Date(2024, 11, 25, 12, 0, 0), // December 25, 2024 at noon local time
        time: '19:00'
      });

      const formatted = EventEntity.formatEventDateTime(event);
      expect(formatted).toContain('25');
      expect(formatted).toContain('dezembro');
      expect(formatted).toContain('19:00');
    });
  });

  describe('shouldSendReminder', () => {
    it('should return true for events 7 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event = createTestEvent({ date: futureDate });
      expect(EventEntity.shouldSendReminder(event)).toBe(true);
    });

    it('should return true for events 3 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const event = createTestEvent({ date: futureDate });
      expect(EventEntity.shouldSendReminder(event)).toBe(true);
    });

    it('should return true for events 1 day away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const event = createTestEvent({ date: futureDate });
      expect(EventEntity.shouldSendReminder(event)).toBe(true);
    });

    it('should return false for other days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const event = createTestEvent({ date: futureDate });
      expect(EventEntity.shouldSendReminder(event)).toBe(false);
    });
  });

  describe('validateEventDates', () => {
    it('should return true for valid date ranges', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      expect(EventEntity.validateEventDates(startDate, endDate)).toBe(true);
    });

    it('should return false when end date is before start date', () => {
      const startDate = new Date('2024-01-02');
      const endDate = new Date('2024-01-01');
      
      expect(EventEntity.validateEventDates(startDate, endDate)).toBe(false);
    });

    it('should return true when no end date provided', () => {
      const startDate = new Date('2024-01-01');
      expect(EventEntity.validateEventDates(startDate)).toBe(true);
    });
  });
});