import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationEntity
} from '../Notification';

describe('Notification Entity', () => {
  // Helper function to create a base notification
  const createMockNotification = (overrides?: Partial<Notification>): Notification => ({
    id: 'notification-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: NotificationType.System,
    priority: NotificationPriority.Medium,
    status: NotificationStatus.Unread,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides
  });

  // Helper function to create notification preferences
  const createMockPreferences = (overrides?: Partial<NotificationPreferences>): NotificationPreferences => ({
    userId: 'user-1',
    email: true,
    push: true,
    sms: false,
    enabledTypes: [NotificationType.System, NotificationType.Event, NotificationType.Alert],
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  });

  describe('NotificationType Enum', () => {
    it('should have all expected notification types', () => {
      expect(NotificationType.System).toBe('system');
      expect(NotificationType.Event).toBe('event');
      expect(NotificationType.Project).toBe('project');
      expect(NotificationType.Blog).toBe('blog');
      expect(NotificationType.LiveStream).toBe('live_stream');
      expect(NotificationType.UserRegistration).toBe('user_registration');
      expect(NotificationType.EventReminder).toBe('event_reminder');
      expect(NotificationType.Birthday).toBe('birthday');
      expect(NotificationType.Announcement).toBe('announcement');
      expect(NotificationType.Alert).toBe('alert');
      expect(NotificationType.Custom).toBe('custom');
      expect(NotificationType.HelpRequest).toBe('help_request');
    });

    it('should have exactly 12 notification types', () => {
      const typeValues = Object.values(NotificationType);
      expect(typeValues).toHaveLength(12);
    });
  });

  describe('NotificationStatus Enum', () => {
    it('should have all expected status values', () => {
      expect(NotificationStatus.Unread).toBe('unread');
      expect(NotificationStatus.Read).toBe('read');
      expect(NotificationStatus.Archived).toBe('archived');
      expect(NotificationStatus.Deleted).toBe('deleted');
    });

    it('should have exactly 4 status values', () => {
      const statusValues = Object.values(NotificationStatus);
      expect(statusValues).toHaveLength(4);
    });
  });

  describe('NotificationPriority Enum', () => {
    it('should have all expected priority values', () => {
      expect(NotificationPriority.Low).toBe('low');
      expect(NotificationPriority.Medium).toBe('medium');
      expect(NotificationPriority.High).toBe('high');
      expect(NotificationPriority.Urgent).toBe('urgent');
    });

    it('should have exactly 4 priority values', () => {
      const priorityValues = Object.values(NotificationPriority);
      expect(priorityValues).toHaveLength(4);
    });
  });

  describe('NotificationEntity.isUnread', () => {
    it('should return true for unread notifications', () => {
      const notification = createMockNotification({ status: NotificationStatus.Unread });
      expect(NotificationEntity.isUnread(notification)).toBe(true);
    });

    it('should return false for read notifications', () => {
      const notification = createMockNotification({ status: NotificationStatus.Read });
      expect(NotificationEntity.isUnread(notification)).toBe(false);
    });

    it('should return false for archived notifications', () => {
      const notification = createMockNotification({ status: NotificationStatus.Archived });
      expect(NotificationEntity.isUnread(notification)).toBe(false);
    });

    it('should return false for deleted notifications', () => {
      const notification = createMockNotification({ status: NotificationStatus.Deleted });
      expect(NotificationEntity.isUnread(notification)).toBe(false);
    });
  });

  describe('NotificationEntity.isExpired', () => {
    it('should return false when expiresAt is not set', () => {
      const notification = createMockNotification({ expiresAt: undefined });
      expect(NotificationEntity.isExpired(notification)).toBe(false);
    });

    it('should return false when notification has not expired', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in future
      const notification = createMockNotification({ expiresAt: futureDate });
      expect(NotificationEntity.isExpired(notification)).toBe(false);
    });

    it('should return true when notification has expired', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past
      const notification = createMockNotification({ expiresAt: pastDate });
      expect(NotificationEntity.isExpired(notification)).toBe(true);
    });
  });

  describe('NotificationEntity.canDisplay', () => {
    it('should return true for valid unread notification', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Unread,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(true);
    });

    it('should return true for valid read notification', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Read,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(true);
    });

    it('should return true for archived notification that is not expired', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Archived,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(true);
    });

    it('should return false for deleted notification', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Deleted
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(false);
    });

    it('should return false for expired notification', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Unread,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(false);
    });

    it('should return false for deleted and expired notification', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Deleted,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(false);
    });

    it('should return true for notification without expiration', () => {
      const notification = createMockNotification({
        status: NotificationStatus.Unread,
        expiresAt: undefined
      });
      expect(NotificationEntity.canDisplay(notification)).toBe(true);
    });
  });

  describe('NotificationEntity.getPriorityColor', () => {
    it('should return gray for low priority', () => {
      expect(NotificationEntity.getPriorityColor(NotificationPriority.Low)).toBe('gray');
    });

    it('should return blue for medium priority', () => {
      expect(NotificationEntity.getPriorityColor(NotificationPriority.Medium)).toBe('blue');
    });

    it('should return yellow for high priority', () => {
      expect(NotificationEntity.getPriorityColor(NotificationPriority.High)).toBe('yellow');
    });

    it('should return red for urgent priority', () => {
      expect(NotificationEntity.getPriorityColor(NotificationPriority.Urgent)).toBe('red');
    });
  });

  describe('NotificationEntity.getPriorityIcon', () => {
    it('should return info icon for low priority', () => {
      expect(NotificationEntity.getPriorityIcon(NotificationPriority.Low)).toBe('ℹ️');
    });

    it('should return pin icon for medium priority', () => {
      expect(NotificationEntity.getPriorityIcon(NotificationPriority.Medium)).toBe('📌');
    });

    it('should return warning icon for high priority', () => {
      expect(NotificationEntity.getPriorityIcon(NotificationPriority.High)).toBe('⚠️');
    });

    it('should return siren icon for urgent priority', () => {
      expect(NotificationEntity.getPriorityIcon(NotificationPriority.Urgent)).toBe('🚨');
    });
  });

  describe('NotificationEntity.getTypeIcon', () => {
    it('should return correct icon for System type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.System)).toBe('⚙️');
    });

    it('should return correct icon for Event type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Event)).toBe('📅');
    });

    it('should return correct icon for Project type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Project)).toBe('🎯');
    });

    it('should return correct icon for Blog type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Blog)).toBe('📖');
    });

    it('should return correct icon for LiveStream type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.LiveStream)).toBe('📺');
    });

    it('should return correct icon for UserRegistration type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.UserRegistration)).toBe('👤');
    });

    it('should return correct icon for EventReminder type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.EventReminder)).toBe('⏰');
    });

    it('should return correct icon for Birthday type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Birthday)).toBe('🎂');
    });

    it('should return correct icon for Announcement type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Announcement)).toBe('📢');
    });

    it('should return correct icon for Alert type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Alert)).toBe('🔔');
    });

    it('should return correct icon for Custom type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.Custom)).toBe('💬');
    });

    it('should return correct icon for HelpRequest type', () => {
      expect(NotificationEntity.getTypeIcon(NotificationType.HelpRequest)).toBe('🤝');
    });
  });

  describe('NotificationEntity.shouldSendEmail', () => {
    it('should return false when email is disabled', () => {
      const notification = createMockNotification({
        type: NotificationType.System,
        priority: NotificationPriority.High
      });
      const preferences = createMockPreferences({ email: false });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(false);
    });

    it('should return false when notification type is not enabled', () => {
      const notification = createMockNotification({
        type: NotificationType.Blog,
        priority: NotificationPriority.High
      });
      const preferences = createMockPreferences({
        email: true,
        enabledTypes: [NotificationType.System]
      });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(false);
    });

    it('should return false for low priority notifications', () => {
      const notification = createMockNotification({
        type: NotificationType.System,
        priority: NotificationPriority.Low
      });
      const preferences = createMockPreferences({
        email: true,
        enabledTypes: [NotificationType.System]
      });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(false);
    });

    it('should return true for medium priority enabled notification', () => {
      const notification = createMockNotification({
        type: NotificationType.System,
        priority: NotificationPriority.Medium
      });
      const preferences = createMockPreferences({
        email: true,
        enabledTypes: [NotificationType.System]
      });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(true);
    });

    it('should return true for high priority enabled notification', () => {
      const notification = createMockNotification({
        type: NotificationType.Event,
        priority: NotificationPriority.High
      });
      const preferences = createMockPreferences({
        email: true,
        enabledTypes: [NotificationType.Event]
      });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(true);
    });

    it('should return true for urgent priority enabled notification', () => {
      const notification = createMockNotification({
        type: NotificationType.Alert,
        priority: NotificationPriority.Urgent
      });
      const preferences = createMockPreferences({
        email: true,
        enabledTypes: [NotificationType.Alert]
      });
      expect(NotificationEntity.shouldSendEmail(notification, preferences)).toBe(true);
    });
  });

  describe('NotificationEntity.isInQuietHours', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return false when quiet hours are not set', () => {
      const preferences = createMockPreferences({
        quietHoursStart: undefined,
        quietHoursEnd: undefined
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(false);
    });

    it('should return false when only start is set', () => {
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: undefined
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(false);
    });

    it('should return false when only end is set', () => {
      const preferences = createMockPreferences({
        quietHoursStart: undefined,
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(false);
    });

    it('should return true when current time is within quiet hours (same day)', () => {
      // Set time to 14:00
      jest.setSystemTime(new Date('2024-01-15T14:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '12:00',
        quietHoursEnd: '18:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(true);
    });

    it('should return false when current time is outside quiet hours (same day)', () => {
      // Set time to 10:00
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '12:00',
        quietHoursEnd: '18:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(false);
    });

    it('should handle quiet hours spanning midnight - during quiet hours (before midnight)', () => {
      // Set time to 23:00
      jest.setSystemTime(new Date('2024-01-15T23:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(true);
    });

    it('should handle quiet hours spanning midnight - during quiet hours (after midnight)', () => {
      // Set time to 05:00
      jest.setSystemTime(new Date('2024-01-15T05:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(true);
    });

    it('should handle quiet hours spanning midnight - outside quiet hours', () => {
      // Set time to 12:00
      jest.setSystemTime(new Date('2024-01-15T12:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(false);
    });

    it('should return true at exact start time', () => {
      // Set time to 22:00
      jest.setSystemTime(new Date('2024-01-15T22:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(true);
    });

    it('should return true at exact end time', () => {
      // Set time to 07:00
      jest.setSystemTime(new Date('2024-01-15T07:00:00'));
      const preferences = createMockPreferences({
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });
      expect(NotificationEntity.isInQuietHours(preferences)).toBe(true);
    });
  });

  describe('NotificationEntity.groupByDate', () => {
    it('should return empty map for empty array', () => {
      const result = NotificationEntity.groupByDate([]);
      expect(result.size).toBe(0);
    });

    it('should group notifications by date', () => {
      const notifications = [
        createMockNotification({ id: '1', createdAt: new Date('2024-01-15T10:00:00Z') }),
        createMockNotification({ id: '2', createdAt: new Date('2024-01-15T14:00:00Z') }),
        createMockNotification({ id: '3', createdAt: new Date('2024-01-16T09:00:00Z') })
      ];
      const result = NotificationEntity.groupByDate(notifications);
      expect(result.size).toBe(2);
    });

    it('should include all notifications in their respective groups', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T14:00:00Z');
      const notifications = [
        createMockNotification({ id: '1', createdAt: date1 }),
        createMockNotification({ id: '2', createdAt: date2 })
      ];
      const result = NotificationEntity.groupByDate(notifications);
      const key = date1.toLocaleDateString('pt-BR');
      expect(result.get(key)).toHaveLength(2);
    });

    it('should format date keys in pt-BR locale', () => {
      const notifications = [
        createMockNotification({ createdAt: new Date('2024-01-15T10:00:00Z') })
      ];
      const result = NotificationEntity.groupByDate(notifications);
      const keys = Array.from(result.keys());
      expect(keys.length).toBe(1);
      // pt-BR format is DD/MM/YYYY
      expect(keys[0]).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });
  });

  describe('NotificationEntity.sortByPriority', () => {
    it('should return empty array for empty input', () => {
      const result = NotificationEntity.sortByPriority([]);
      expect(result).toEqual([]);
    });

    it('should sort notifications by priority (urgent first)', () => {
      const notifications = [
        createMockNotification({ id: 'low', priority: NotificationPriority.Low }),
        createMockNotification({ id: 'urgent', priority: NotificationPriority.Urgent }),
        createMockNotification({ id: 'medium', priority: NotificationPriority.Medium }),
        createMockNotification({ id: 'high', priority: NotificationPriority.High })
      ];
      const result = NotificationEntity.sortByPriority(notifications);
      expect(result[0].id).toBe('urgent');
      expect(result[1].id).toBe('high');
      expect(result[2].id).toBe('medium');
      expect(result[3].id).toBe('low');
    });

    it('should sort by date (newest first) when priority is the same', () => {
      const olderDate = new Date('2024-01-10T10:00:00Z');
      const newerDate = new Date('2024-01-15T10:00:00Z');
      const notifications = [
        createMockNotification({ id: 'older', priority: NotificationPriority.Medium, createdAt: olderDate }),
        createMockNotification({ id: 'newer', priority: NotificationPriority.Medium, createdAt: newerDate })
      ];
      const result = NotificationEntity.sortByPriority(notifications);
      expect(result[0].id).toBe('newer');
      expect(result[1].id).toBe('older');
    });

    it('should not modify the original array', () => {
      const notifications = [
        createMockNotification({ id: 'low', priority: NotificationPriority.Low }),
        createMockNotification({ id: 'high', priority: NotificationPriority.High })
      ];
      const originalOrder = [...notifications];
      NotificationEntity.sortByPriority(notifications);
      expect(notifications[0].id).toBe(originalOrder[0].id);
      expect(notifications[1].id).toBe(originalOrder[1].id);
    });
  });

  describe('NotificationEntity.countUnread', () => {
    it('should return 0 for empty array', () => {
      expect(NotificationEntity.countUnread([])).toBe(0);
    });

    it('should count only unread notifications', () => {
      const notifications = [
        createMockNotification({ id: '1', status: NotificationStatus.Unread }),
        createMockNotification({ id: '2', status: NotificationStatus.Read }),
        createMockNotification({ id: '3', status: NotificationStatus.Unread }),
        createMockNotification({ id: '4', status: NotificationStatus.Archived })
      ];
      expect(NotificationEntity.countUnread(notifications)).toBe(2);
    });

    it('should not count expired unread notifications', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notifications = [
        createMockNotification({ id: '1', status: NotificationStatus.Unread, expiresAt: pastDate }),
        createMockNotification({ id: '2', status: NotificationStatus.Unread, expiresAt: futureDate })
      ];
      expect(NotificationEntity.countUnread(notifications)).toBe(1);
    });

    it('should not count deleted unread notifications', () => {
      const notifications = [
        createMockNotification({ id: '1', status: NotificationStatus.Unread }),
        createMockNotification({ id: '2', status: NotificationStatus.Deleted })
      ];
      expect(NotificationEntity.countUnread(notifications)).toBe(1);
    });

    it('should count unread notifications without expiration', () => {
      const notifications = [
        createMockNotification({ id: '1', status: NotificationStatus.Unread, expiresAt: undefined }),
        createMockNotification({ id: '2', status: NotificationStatus.Unread, expiresAt: undefined })
      ];
      expect(NotificationEntity.countUnread(notifications)).toBe(2);
    });
  });

  describe('Factory Methods', () => {
    describe('createFromEvent', () => {
      it('should create notification with correct properties', () => {
        const eventDate = new Date('2024-03-15T18:00:00Z');
        const result = NotificationEntity.createFromEvent('event-123', 'Culto de Domingo', eventDate);

        expect(result.title).toBe('Novo Evento Disponível');
        expect(result.message).toContain('Culto de Domingo');
        expect(result.type).toBe(NotificationType.Event);
        expect(result.priority).toBe(NotificationPriority.Medium);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/events');
        expect(result.actionText).toBe('Ver Evento');
        expect(result.targetId).toBe('event-123');
        expect(result.targetType).toBe('event');
        expect(result.metadata?.eventTitle).toBe('Culto de Domingo');
      });

      it('should set expiration to 24h after event date', () => {
        const eventDate = new Date('2024-03-15T18:00:00Z');
        const result = NotificationEntity.createFromEvent('event-123', 'Test Event', eventDate);
        const expectedExpiration = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
        expect(result.expiresAt?.getTime()).toBe(expectedExpiration.getTime());
      });
    });

    describe('createFromBlogPost', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromBlogPost('post-123', 'New Blog Post', 'http://image.url');

        expect(result.title).toBe('Nova Postagem no Blog');
        expect(result.message).toContain('New Blog Post');
        expect(result.type).toBe(NotificationType.Blog);
        expect(result.priority).toBe(NotificationPriority.Low);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/blog');
        expect(result.actionText).toBe('Ler Postagem');
        expect(result.imageUrl).toBe('http://image.url');
        expect(result.targetId).toBe('post-123');
        expect(result.targetType).toBe('blog_post');
        expect(result.metadata?.postTitle).toBe('New Blog Post');
      });

      it('should set expiration to 7 days', () => {
        const beforeCreate = Date.now();
        const result = NotificationEntity.createFromBlogPost('post-123', 'Test Post');
        const afterCreate = Date.now();

        const minExpected = beforeCreate + 7 * 24 * 60 * 60 * 1000;
        const maxExpected = afterCreate + 7 * 24 * 60 * 60 * 1000;

        expect(result.expiresAt!.getTime()).toBeGreaterThanOrEqual(minExpected);
        expect(result.expiresAt!.getTime()).toBeLessThanOrEqual(maxExpected);
      });

      it('should handle missing image URL', () => {
        const result = NotificationEntity.createFromBlogPost('post-123', 'Test Post');
        expect(result.imageUrl).toBeUndefined();
      });
    });

    describe('createFromProject', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromProject('project-123', 'Mission Trip');

        expect(result.title).toBe('Novo Projeto Disponível');
        expect(result.message).toContain('Mission Trip');
        expect(result.type).toBe(NotificationType.Project);
        expect(result.priority).toBe(NotificationPriority.Medium);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/projects');
        expect(result.actionText).toBe('Ver Projeto');
        expect(result.targetId).toBe('project-123');
        expect(result.targetType).toBe('project');
        expect(result.metadata?.projectName).toBe('Mission Trip');
      });

      it('should set expiration to 30 days', () => {
        const beforeCreate = Date.now();
        const result = NotificationEntity.createFromProject('project-123', 'Test Project');
        const afterCreate = Date.now();

        const minExpected = beforeCreate + 30 * 24 * 60 * 60 * 1000;
        const maxExpected = afterCreate + 30 * 24 * 60 * 60 * 1000;

        expect(result.expiresAt!.getTime()).toBeGreaterThanOrEqual(minExpected);
        expect(result.expiresAt!.getTime()).toBeLessThanOrEqual(maxExpected);
      });
    });

    describe('createFromLiveStream', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromLiveStream('stream-123', 'Sunday Service', 'http://thumbnail.url');

        expect(result.title).toBe('Nova Transmissão Ao Vivo');
        expect(result.message).toContain('Sunday Service');
        expect(result.type).toBe(NotificationType.LiveStream);
        expect(result.priority).toBe(NotificationPriority.High);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/live');
        expect(result.actionText).toBe('Assistir');
        expect(result.imageUrl).toBe('http://thumbnail.url');
        expect(result.targetId).toBe('stream-123');
        expect(result.targetType).toBe('live_stream');
        expect(result.metadata?.streamTitle).toBe('Sunday Service');
      });

      it('should set expiration to 3 days', () => {
        const beforeCreate = Date.now();
        const result = NotificationEntity.createFromLiveStream('stream-123', 'Test Stream');
        const afterCreate = Date.now();

        const minExpected = beforeCreate + 3 * 24 * 60 * 60 * 1000;
        const maxExpected = afterCreate + 3 * 24 * 60 * 60 * 1000;

        expect(result.expiresAt!.getTime()).toBeGreaterThanOrEqual(minExpected);
        expect(result.expiresAt!.getTime()).toBeLessThanOrEqual(maxExpected);
      });
    });

    describe('createFromProjectApproval', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromProjectApproval('project-123', 'Volunteer Program');

        expect(result.title).toBe('Inscrição Aprovada!');
        expect(result.message).toContain('Volunteer Program');
        expect(result.message).toContain('aprovada');
        expect(result.type).toBe(NotificationType.Project);
        expect(result.priority).toBe(NotificationPriority.High);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/projects');
        expect(result.actionText).toBe('Ver Projeto');
        expect(result.targetId).toBe('project-123');
        expect(result.targetType).toBe('project_approval');
        expect(result.metadata?.projectName).toBe('Volunteer Program');
        expect(result.metadata?.approvalType).toBe('approved');
      });
    });

    describe('createFromProjectRejection', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromProjectRejection('project-123', 'Volunteer Program');

        expect(result.title).toBe('Inscrição Rejeitada');
        expect(result.message).toContain('Volunteer Program');
        expect(result.message).toContain('rejeitada');
        expect(result.type).toBe(NotificationType.Project);
        expect(result.priority).toBe(NotificationPriority.Medium);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/projects');
        expect(result.actionText).toBe('Ver Projetos');
        expect(result.targetId).toBe('project-123');
        expect(result.targetType).toBe('project_rejection');
        expect(result.metadata?.projectName).toBe('Volunteer Program');
        expect(result.metadata?.approvalType).toBe('rejected');
      });
    });

    describe('createFromHelpRequest', () => {
      it('should create notification with correct properties', () => {
        const result = NotificationEntity.createFromHelpRequest(
          'request-123',
          'John Doe',
          'Psicologia',
          'Preciso de orientação',
          'alta'
        );

        expect(result.title).toBe('Novo Pedido de Ajuda Profissional');
        expect(result.message).toContain('John Doe');
        expect(result.message).toContain('Psicologia');
        expect(result.message).toContain('Preciso de orientação');
        expect(result.type).toBe(NotificationType.HelpRequest);
        expect(result.priority).toBe(NotificationPriority.High);
        expect(result.status).toBe(NotificationStatus.Unread);
        expect(result.actionUrl).toBe('/professional/help-requests');
        expect(result.actionText).toBe('Ver Pedido');
        expect(result.targetId).toBe('request-123');
        expect(result.targetType).toBe('help_request');
        expect(result.metadata?.requesterName).toBe('John Doe');
        expect(result.metadata?.requesterSpecialty).toBe('Psicologia');
        expect(result.metadata?.requestTitle).toBe('Preciso de orientação');
        expect(result.metadata?.requestPriority).toBe('alta');
      });

      it('should map priority urgente to Urgent', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'urgente');
        expect(result.priority).toBe(NotificationPriority.Urgent);
      });

      it('should map priority alta to High', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'alta');
        expect(result.priority).toBe(NotificationPriority.High);
      });

      it('should map priority media to Medium', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'media');
        expect(result.priority).toBe(NotificationPriority.Medium);
      });

      it('should map priority baixa to Low', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'baixa');
        expect(result.priority).toBe(NotificationPriority.Low);
      });

      it('should default to Medium for unknown priority', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'unknown');
        expect(result.priority).toBe(NotificationPriority.Medium);
      });

      it('should handle case-insensitive priority', () => {
        const result = NotificationEntity.createFromHelpRequest('1', 'Name', 'Spec', 'Title', 'URGENTE');
        expect(result.priority).toBe(NotificationPriority.Urgent);
      });
    });

    describe('createCustom', () => {
      it('should create notification with required properties', () => {
        const result = NotificationEntity.createCustom('Custom Title', 'Custom Message');

        expect(result.title).toBe('Custom Title');
        expect(result.message).toBe('Custom Message');
        expect(result.type).toBe(NotificationType.Custom);
        expect(result.priority).toBe(NotificationPriority.Medium);
        expect(result.status).toBe(NotificationStatus.Unread);
      });

      it('should accept custom priority', () => {
        const result = NotificationEntity.createCustom('Title', 'Message', NotificationPriority.Urgent);
        expect(result.priority).toBe(NotificationPriority.Urgent);
      });

      it('should accept optional options', () => {
        const customExpiration = new Date('2024-12-31T23:59:59Z');
        const result = NotificationEntity.createCustom('Title', 'Message', NotificationPriority.High, {
          actionUrl: '/custom-action',
          actionText: 'Take Action',
          imageUrl: 'http://custom-image.url',
          expiresAt: customExpiration,
          metadata: { customKey: 'customValue' }
        });

        expect(result.actionUrl).toBe('/custom-action');
        expect(result.actionText).toBe('Take Action');
        expect(result.imageUrl).toBe('http://custom-image.url');
        expect(result.expiresAt).toBe(customExpiration);
        expect(result.metadata?.customKey).toBe('customValue');
      });

      it('should set default expiration to 7 days when not provided', () => {
        const beforeCreate = Date.now();
        const result = NotificationEntity.createCustom('Title', 'Message');
        const afterCreate = Date.now();

        const minExpected = beforeCreate + 7 * 24 * 60 * 60 * 1000;
        const maxExpected = afterCreate + 7 * 24 * 60 * 60 * 1000;

        expect(result.expiresAt!.getTime()).toBeGreaterThanOrEqual(minExpected);
        expect(result.expiresAt!.getTime()).toBeLessThanOrEqual(maxExpected);
      });

      it('should handle empty options object', () => {
        const result = NotificationEntity.createCustom('Title', 'Message', NotificationPriority.Low, {});

        expect(result.actionUrl).toBeUndefined();
        expect(result.actionText).toBeUndefined();
        expect(result.imageUrl).toBeUndefined();
        expect(result.metadata).toBeUndefined();
        // Should still have default expiration
        expect(result.expiresAt).toBeDefined();
      });
    });
  });

  describe('Notification Interface', () => {
    it('should support all optional fields', () => {
      const notification: Notification = {
        id: 'test-1',
        userId: 'user-1',
        title: 'Test',
        message: 'Test message',
        type: NotificationType.Custom,
        priority: NotificationPriority.Medium,
        status: NotificationStatus.Unread,
        createdAt: new Date(),
        actionUrl: '/test',
        actionText: 'Test Action',
        imageUrl: 'http://image.url',
        targetId: 'target-1',
        targetType: 'test',
        metadata: { key: 'value' },
        readAt: new Date(),
        expiresAt: new Date()
      };

      expect(notification).toBeDefined();
      expect(notification.actionUrl).toBe('/test');
      expect(notification.actionText).toBe('Test Action');
      expect(notification.imageUrl).toBe('http://image.url');
      expect(notification.targetId).toBe('target-1');
      expect(notification.targetType).toBe('test');
      expect(notification.metadata?.key).toBe('value');
      expect(notification.readAt).toBeDefined();
      expect(notification.expiresAt).toBeDefined();
    });

    it('should work with minimal required fields', () => {
      const notification: Notification = {
        id: 'test-1',
        userId: 'user-1',
        title: 'Test',
        message: 'Test message',
        type: NotificationType.System,
        priority: NotificationPriority.Low,
        status: NotificationStatus.Unread,
        createdAt: new Date()
      };

      expect(notification).toBeDefined();
      expect(notification.id).toBe('test-1');
    });
  });

  describe('NotificationPreferences Interface', () => {
    it('should support all notification channels', () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        email: true,
        push: true,
        sms: true,
        enabledTypes: [NotificationType.System],
        updatedAt: new Date()
      };

      expect(preferences.email).toBe(true);
      expect(preferences.push).toBe(true);
      expect(preferences.sms).toBe(true);
    });

    it('should support quiet hours configuration', () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        email: true,
        push: true,
        sms: false,
        enabledTypes: [NotificationType.System],
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        updatedAt: new Date()
      };

      expect(preferences.quietHoursStart).toBe('22:00');
      expect(preferences.quietHoursEnd).toBe('07:00');
    });

    it('should support multiple enabled types', () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        email: true,
        push: true,
        sms: false,
        enabledTypes: [
          NotificationType.System,
          NotificationType.Event,
          NotificationType.Alert,
          NotificationType.Birthday
        ],
        updatedAt: new Date()
      };

      expect(preferences.enabledTypes).toHaveLength(4);
      expect(preferences.enabledTypes).toContain(NotificationType.System);
      expect(preferences.enabledTypes).toContain(NotificationType.Event);
      expect(preferences.enabledTypes).toContain(NotificationType.Alert);
      expect(preferences.enabledTypes).toContain(NotificationType.Birthday);
    });

    it('should support empty enabled types', () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        email: false,
        push: false,
        sms: false,
        enabledTypes: [],
        updatedAt: new Date()
      };

      expect(preferences.enabledTypes).toHaveLength(0);
    });
  });
});
