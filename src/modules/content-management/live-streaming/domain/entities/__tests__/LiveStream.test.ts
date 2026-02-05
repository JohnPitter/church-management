// Unit Tests - LiveStream Entity
// Tests for LiveStream business rules and validations

import {
  LiveStream,
  StreamCategory,
  StreamStatus,
  LiveStreamEntity
} from '../LiveStream';

describe('LiveStreamEntity', () => {
  const createTestLiveStream = (overrides: Partial<LiveStream> = {}): LiveStream => ({
    id: '1',
    title: 'Culto de Domingo',
    description: 'Transmissão ao vivo do culto dominical',
    streamUrl: 'https://youtube.com/watch?v=abc123',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    isLive: false,
    scheduledDate: new Date('2025-12-25T10:00:00'),
    duration: 3600,
    viewCount: 150,
    category: StreamCategory.Culto,
    status: StreamStatus.Scheduled,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    ...overrides
  });

  describe('StreamStatus enum', () => {
    it('should have Scheduled status', () => {
      expect(StreamStatus.Scheduled).toBe('scheduled');
    });

    it('should have Live status', () => {
      expect(StreamStatus.Live).toBe('live');
    });

    it('should have Ended status', () => {
      expect(StreamStatus.Ended).toBe('ended');
    });

    it('should have Cancelled status', () => {
      expect(StreamStatus.Cancelled).toBe('cancelled');
    });

    it('should have exactly 4 status values', () => {
      const statusValues = Object.values(StreamStatus);
      expect(statusValues).toHaveLength(4);
      expect(statusValues).toContain('scheduled');
      expect(statusValues).toContain('live');
      expect(statusValues).toContain('ended');
      expect(statusValues).toContain('cancelled');
    });
  });

  describe('StreamCategory enum', () => {
    it('should have Culto category', () => {
      expect(StreamCategory.Culto).toBe('culto');
    });

    it('should have Estudo category', () => {
      expect(StreamCategory.Estudo).toBe('estudo');
    });

    it('should have Reuniao category', () => {
      expect(StreamCategory.Reuniao).toBe('reuniao');
    });

    it('should have Evento category', () => {
      expect(StreamCategory.Evento).toBe('evento');
    });

    it('should have exactly 4 category values', () => {
      const categoryValues = Object.values(StreamCategory);
      expect(categoryValues).toHaveLength(4);
      expect(categoryValues).toContain('culto');
      expect(categoryValues).toContain('estudo');
      expect(categoryValues).toContain('reuniao');
      expect(categoryValues).toContain('evento');
    });
  });

  describe('isLive', () => {
    it('should return true when status is Live and isLive flag is true', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Live,
        isLive: true
      });
      expect(LiveStreamEntity.isLive(stream)).toBe(true);
    });

    it('should return false when status is Live but isLive flag is false', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Live,
        isLive: false
      });
      expect(LiveStreamEntity.isLive(stream)).toBe(false);
    });

    it('should return false when status is not Live even if isLive flag is true', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        isLive: true
      });
      expect(LiveStreamEntity.isLive(stream)).toBe(false);
    });

    it('should return false for ended streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Ended,
        isLive: false
      });
      expect(LiveStreamEntity.isLive(stream)).toBe(false);
    });

    it('should return false for cancelled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled,
        isLive: false
      });
      expect(LiveStreamEntity.isLive(stream)).toBe(false);
    });
  });

  describe('isScheduled', () => {
    it('should return true when status is Scheduled and date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate: futureDate
      });
      expect(LiveStreamEntity.isScheduled(stream)).toBe(true);
    });

    it('should return false when status is Scheduled but date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate: pastDate
      });
      expect(LiveStreamEntity.isScheduled(stream)).toBe(false);
    });

    it('should return false when status is not Scheduled even if date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const stream = createTestLiveStream({
        status: StreamStatus.Live,
        scheduledDate: futureDate
      });
      expect(LiveStreamEntity.isScheduled(stream)).toBe(false);
    });

    it('should return false for ended streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Ended
      });
      expect(LiveStreamEntity.isScheduled(stream)).toBe(false);
    });

    it('should return false for cancelled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled
      });
      expect(LiveStreamEntity.isScheduled(stream)).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should return true for scheduled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled
      });
      expect(LiveStreamEntity.canEdit(stream)).toBe(true);
    });

    it('should return true for live streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Live
      });
      expect(LiveStreamEntity.canEdit(stream)).toBe(true);
    });

    it('should return false for ended streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Ended
      });
      expect(LiveStreamEntity.canEdit(stream)).toBe(false);
    });

    it('should return false for cancelled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled
      });
      expect(LiveStreamEntity.canEdit(stream)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true for scheduled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled
      });
      expect(LiveStreamEntity.canDelete(stream)).toBe(true);
    });

    it('should return true for cancelled streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled
      });
      expect(LiveStreamEntity.canDelete(stream)).toBe(true);
    });

    it('should return false for live streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Live
      });
      expect(LiveStreamEntity.canDelete(stream)).toBe(false);
    });

    it('should return false for ended streams', () => {
      const stream = createTestLiveStream({
        status: StreamStatus.Ended
      });
      expect(LiveStreamEntity.canDelete(stream)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should return "--" when duration is undefined', () => {
      expect(LiveStreamEntity.formatDuration(undefined)).toBe('--');
    });

    it('should return "--" when duration is 0', () => {
      expect(LiveStreamEntity.formatDuration(0)).toBe('--');
    });

    it('should format duration with hours and minutes', () => {
      expect(LiveStreamEntity.formatDuration(3600)).toBe('1h 0m');
      expect(LiveStreamEntity.formatDuration(3660)).toBe('1h 1m');
      expect(LiveStreamEntity.formatDuration(7200)).toBe('2h 0m');
      expect(LiveStreamEntity.formatDuration(5400)).toBe('1h 30m');
    });

    it('should format duration with only minutes when less than 1 hour', () => {
      expect(LiveStreamEntity.formatDuration(60)).toBe('1m');
      expect(LiveStreamEntity.formatDuration(300)).toBe('5m');
      expect(LiveStreamEntity.formatDuration(1800)).toBe('30m');
      expect(LiveStreamEntity.formatDuration(3540)).toBe('59m');
    });

    it('should handle large durations', () => {
      expect(LiveStreamEntity.formatDuration(36000)).toBe('10h 0m');
      expect(LiveStreamEntity.formatDuration(86400)).toBe('24h 0m');
    });

    it('should truncate seconds and only use whole minutes', () => {
      expect(LiveStreamEntity.formatDuration(90)).toBe('1m');
      expect(LiveStreamEntity.formatDuration(119)).toBe('1m');
      expect(LiveStreamEntity.formatDuration(3661)).toBe('1h 1m');
    });
  });

  describe('getCategoryLabel', () => {
    it('should return "Culto" for Culto category', () => {
      expect(LiveStreamEntity.getCategoryLabel(StreamCategory.Culto)).toBe('Culto');
    });

    it('should return "Estudo Bíblico" for Estudo category', () => {
      expect(LiveStreamEntity.getCategoryLabel(StreamCategory.Estudo)).toBe('Estudo Bíblico');
    });

    it('should return "Reunião" for Reuniao category', () => {
      expect(LiveStreamEntity.getCategoryLabel(StreamCategory.Reuniao)).toBe('Reunião');
    });

    it('should return "Evento Especial" for Evento category', () => {
      expect(LiveStreamEntity.getCategoryLabel(StreamCategory.Evento)).toBe('Evento Especial');
    });

    it('should return the category value for unknown categories', () => {
      const unknownCategory = 'unknown' as StreamCategory;
      expect(LiveStreamEntity.getCategoryLabel(unknownCategory)).toBe('unknown');
    });
  });

  describe('getStatusLabel', () => {
    it('should return "Agendado" for Scheduled status', () => {
      expect(LiveStreamEntity.getStatusLabel(StreamStatus.Scheduled)).toBe('Agendado');
    });

    it('should return "Ao Vivo" for Live status', () => {
      expect(LiveStreamEntity.getStatusLabel(StreamStatus.Live)).toBe('Ao Vivo');
    });

    it('should return "Finalizado" for Ended status', () => {
      expect(LiveStreamEntity.getStatusLabel(StreamStatus.Ended)).toBe('Finalizado');
    });

    it('should return "Cancelado" for Cancelled status', () => {
      expect(LiveStreamEntity.getStatusLabel(StreamStatus.Cancelled)).toBe('Cancelado');
    });

    it('should return the status value for unknown statuses', () => {
      const unknownStatus = 'unknown' as StreamStatus;
      expect(LiveStreamEntity.getStatusLabel(unknownStatus)).toBe('unknown');
    });
  });

  describe('canStart', () => {
    it('should return true when scheduled and within 15 minutes of start time', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 10);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(true);
    });

    it('should return true when scheduled and exactly at start time', () => {
      const scheduledDate = new Date();

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(true);
    });

    it('should return true when scheduled and start time has passed', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() - 5);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(true);
    });

    it('should return false when scheduled but more than 15 minutes until start', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 20);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(false);
    });

    it('should return false when status is not Scheduled even if within time window', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 5);

      const stream = createTestLiveStream({
        status: StreamStatus.Live,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(false);
    });

    it('should return false for ended streams', () => {
      const scheduledDate = new Date();

      const stream = createTestLiveStream({
        status: StreamStatus.Ended,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(false);
    });

    it('should return false for cancelled streams', () => {
      const scheduledDate = new Date();

      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(false);
    });

    it('should return true when exactly 15 minutes before start', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 15);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.canStart(stream)).toBe(true);
    });
  });

  describe('shouldNotifyStart', () => {
    it('should return true when scheduled and within 5 minutes of start time', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 3);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(true);
    });

    it('should return false when scheduled but more than 5 minutes until start', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 10);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return false when start time has passed', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() - 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return false when exactly at start time (0 minutes)', () => {
      const scheduledDate = new Date();

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return false when status is not Scheduled', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 3);

      const stream = createTestLiveStream({
        status: StreamStatus.Live,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return false for ended streams', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 3);

      const stream = createTestLiveStream({
        status: StreamStatus.Ended,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return false for cancelled streams', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 3);

      const stream = createTestLiveStream({
        status: StreamStatus.Cancelled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should return true when exactly 5 minutes before start', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 5);
      scheduledDate.setMilliseconds(scheduledDate.getMilliseconds() - 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(true);
    });

    it('should return true when 1 minute before start', () => {
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate
      });
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(true);
    });
  });

  describe('LiveStream interface', () => {
    it('should allow creating a valid LiveStream object', () => {
      const stream = createTestLiveStream();

      expect(stream.id).toBe('1');
      expect(stream.title).toBe('Culto de Domingo');
      expect(stream.description).toBe('Transmissão ao vivo do culto dominical');
      expect(stream.streamUrl).toBe('https://youtube.com/watch?v=abc123');
      expect(stream.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
      expect(stream.isLive).toBe(false);
      expect(stream.duration).toBe(3600);
      expect(stream.viewCount).toBe(150);
      expect(stream.category).toBe(StreamCategory.Culto);
      expect(stream.status).toBe(StreamStatus.Scheduled);
      expect(stream.createdBy).toBe('admin');
    });

    it('should allow optional thumbnailUrl', () => {
      const stream = createTestLiveStream({ thumbnailUrl: undefined });
      expect(stream.thumbnailUrl).toBeUndefined();
    });

    it('should allow optional duration', () => {
      const stream = createTestLiveStream({ duration: undefined });
      expect(stream.duration).toBeUndefined();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle streams with zero view count', () => {
      const stream = createTestLiveStream({ viewCount: 0 });
      expect(stream.viewCount).toBe(0);
    });

    it('should handle streams with very high view count', () => {
      const stream = createTestLiveStream({ viewCount: 1000000 });
      expect(stream.viewCount).toBe(1000000);
    });

    it('should handle empty title and description', () => {
      const stream = createTestLiveStream({ title: '', description: '' });
      expect(stream.title).toBe('');
      expect(stream.description).toBe('');
    });

    it('should handle very long durations', () => {
      expect(LiveStreamEntity.formatDuration(604800)).toBe('168h 0m'); // 1 week
    });

    it('should handle streams scheduled far in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate: futureDate
      });

      expect(LiveStreamEntity.isScheduled(stream)).toBe(true);
      expect(LiveStreamEntity.canStart(stream)).toBe(false);
      expect(LiveStreamEntity.shouldNotifyStart(stream)).toBe(false);
    });

    it('should handle streams scheduled in the distant past', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const stream = createTestLiveStream({
        status: StreamStatus.Scheduled,
        scheduledDate: pastDate
      });

      expect(LiveStreamEntity.isScheduled(stream)).toBe(false);
      expect(LiveStreamEntity.canStart(stream)).toBe(true);
    });
  });
});
