// Unit Tests - Forum Entity
// Comprehensive tests for forum domain interfaces and enums

import {
  ForumTopic,
  ForumReply,
  ForumCategory,
  ForumAttachment,
  ForumNotification,
  UserForumProfile,
  ForumBadge,
  ForumPreferences,
  ForumStats,
  UserContribution,
  ForumActivity,
  BadgeCriteria,
  TopicStatus,
  TopicPriority,
  ReplyStatus,
  NotificationType,
  ActivityType,
  DigestFrequency,
  BadgeType
} from '../Forum';

// ============================================================================
// Test Fixtures - Factory Functions
// ============================================================================

const createMockForumCategory = (overrides: Partial<ForumCategory> = {}): ForumCategory => ({
  id: 'category-1',
  name: 'General Discussion',
  description: 'A place for general church discussions',
  icon: 'message-circle',
  color: '#4A90D9',
  slug: 'general-discussion',
  parentId: undefined,
  isActive: true,
  requiresApproval: false,
  allowedRoles: ['admin', 'member', 'leader'],
  topicCount: 10,
  replyCount: 50,
  lastTopicAt: new Date('2024-01-15T10:00:00Z'),
  lastTopicBy: 'user-1',
  moderators: ['mod-1', 'mod-2'],
  displayOrder: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  ...overrides
});

const createMockForumAttachment = (overrides: Partial<ForumAttachment> = {}): ForumAttachment => ({
  id: 'attachment-1',
  fileName: 'document-abc123.pdf',
  originalName: 'church-bulletin.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000,
  downloadUrl: 'https://storage.example.com/attachments/document-abc123.pdf',
  uploadedBy: 'user-1',
  uploadedAt: new Date('2024-01-10T09:00:00Z'),
  ...overrides
});

const createMockForumTopic = (overrides: Partial<ForumTopic> = {}): ForumTopic => ({
  id: 'topic-1',
  title: 'Welcome to our church forum',
  content: '<p>This is the first topic in our community forum. Feel free to discuss any church-related matters here.</p>',
  categoryId: 'category-1',
  category: createMockForumCategory(),
  authorId: 'user-1',
  authorName: 'John Doe',
  authorEmail: 'john.doe@example.com',
  authorAvatar: 'https://example.com/avatars/john.jpg',
  tags: ['welcome', 'introduction'],
  status: TopicStatus.PUBLISHED,
  priority: TopicPriority.NORMAL,
  isPinned: false,
  isLocked: false,
  viewCount: 100,
  replyCount: 5,
  lastReplyAt: new Date('2024-01-20T14:30:00Z'),
  lastReplyBy: 'Jane Smith',
  likes: ['user-2', 'user-3', 'user-4'],
  attachments: [],
  createdAt: new Date('2024-01-10T09:00:00Z'),
  updatedAt: new Date('2024-01-20T14:30:00Z'),
  moderatedAt: undefined,
  moderatedBy: undefined,
  ...overrides
});

const createMockForumReply = (overrides: Partial<ForumReply> = {}): ForumReply => ({
  id: 'reply-1',
  topicId: 'topic-1',
  content: '<p>Thank you for the warm welcome! Looking forward to participating in discussions.</p>',
  authorId: 'user-2',
  authorName: 'Jane Smith',
  authorEmail: 'jane.smith@example.com',
  authorAvatar: 'https://example.com/avatars/jane.jpg',
  parentReplyId: undefined,
  status: ReplyStatus.PUBLISHED,
  likes: ['user-1', 'user-3'],
  attachments: [],
  isAcceptedAnswer: false,
  createdAt: new Date('2024-01-10T10:00:00Z'),
  updatedAt: new Date('2024-01-10T10:00:00Z'),
  editedAt: undefined,
  moderatedAt: undefined,
  moderatedBy: undefined,
  ...overrides
});

const createMockForumNotification = (overrides: Partial<ForumNotification> = {}): ForumNotification => ({
  id: 'notification-1',
  userId: 'user-1',
  type: NotificationType.NEW_REPLY,
  topicId: 'topic-1',
  replyId: 'reply-1',
  triggeredBy: 'user-2',
  triggeredByName: 'Jane Smith',
  title: 'New Reply',
  message: 'Jane Smith replied to your topic: Welcome to our church forum',
  isRead: false,
  createdAt: new Date('2024-01-10T10:00:00Z'),
  ...overrides
});

const createMockBadgeCriteria = (overrides: Partial<BadgeCriteria> = {}): BadgeCriteria => ({
  type: BadgeType.TOPICS_CREATED,
  threshold: 10,
  description: 'Create 10 topics to earn this badge',
  ...overrides
});

const createMockForumBadge = (overrides: Partial<ForumBadge> = {}): ForumBadge => ({
  id: 'badge-1',
  name: 'Topic Starter',
  description: 'Created 10 topics in the forum',
  icon: 'star',
  color: '#FFD700',
  criteria: createMockBadgeCriteria(),
  earnedAt: new Date('2024-01-15T12:00:00Z'),
  ...overrides
});

const createMockForumPreferences = (overrides: Partial<ForumPreferences> = {}): ForumPreferences => ({
  emailNotifications: true,
  pushNotifications: false,
  digestFrequency: DigestFrequency.WEEKLY,
  subscribedCategories: ['category-1', 'category-2'],
  blockedUsers: [],
  ...overrides
});

const createMockUserForumProfile = (overrides: Partial<UserForumProfile> = {}): UserForumProfile => ({
  id: 'profile-1',
  userId: 'user-1',
  displayName: 'John Doe',
  avatar: 'https://example.com/avatars/john.jpg',
  signature: 'God bless you all!',
  title: 'Active Member',
  reputation: 150,
  totalTopics: 10,
  totalReplies: 50,
  totalLikes: 75,
  joinedAt: new Date('2023-06-01T00:00:00Z'),
  lastActiveAt: new Date('2024-01-20T15:00:00Z'),
  badges: [createMockForumBadge()],
  preferences: createMockForumPreferences(),
  ...overrides
});

const createMockUserContribution = (overrides: Partial<UserContribution> = {}): UserContribution => ({
  userId: 'user-1',
  userName: 'John Doe',
  avatar: 'https://example.com/avatars/john.jpg',
  topicCount: 10,
  replyCount: 50,
  totalLikes: 75,
  reputation: 150,
  ...overrides
});

const createMockForumActivity = (overrides: Partial<ForumActivity> = {}): ForumActivity => ({
  id: 'activity-1',
  type: ActivityType.TOPIC_CREATED,
  userId: 'user-1',
  userName: 'John Doe',
  userAvatar: 'https://example.com/avatars/john.jpg',
  topicId: 'topic-1',
  topicTitle: 'Welcome to our church forum',
  replyId: undefined,
  categoryId: 'category-1',
  categoryName: 'General Discussion',
  description: 'Created new topic: Welcome to our church forum',
  timestamp: new Date('2024-01-10T09:00:00Z'),
  ...overrides
});

const createMockForumStats = (overrides: Partial<ForumStats> = {}): ForumStats => ({
  totalTopics: 100,
  totalReplies: 500,
  totalUsers: 50,
  totalViews: 10000,
  activeUsers: 25,
  topContributors: [createMockUserContribution()],
  popularTopics: [createMockForumTopic()],
  recentActivity: [createMockForumActivity()],
  ...overrides
});

// ============================================================================
// Enum Tests
// ============================================================================

describe('TopicStatus Enum', () => {
  it('should have DRAFT status', () => {
    expect(TopicStatus.DRAFT).toBe('draft');
  });

  it('should have PUBLISHED status', () => {
    expect(TopicStatus.PUBLISHED).toBe('published');
  });

  it('should have PENDING_APPROVAL status', () => {
    expect(TopicStatus.PENDING_APPROVAL).toBe('pending_approval');
  });

  it('should have APPROVED status', () => {
    expect(TopicStatus.APPROVED).toBe('approved');
  });

  it('should have REJECTED status', () => {
    expect(TopicStatus.REJECTED).toBe('rejected');
  });

  it('should have ARCHIVED status', () => {
    expect(TopicStatus.ARCHIVED).toBe('archived');
  });

  it('should have SPAM status', () => {
    expect(TopicStatus.SPAM).toBe('spam');
  });

  it('should have exactly 7 status values', () => {
    const statusValues = Object.values(TopicStatus);
    expect(statusValues).toHaveLength(7);
    expect(statusValues).toContain('draft');
    expect(statusValues).toContain('published');
    expect(statusValues).toContain('pending_approval');
    expect(statusValues).toContain('approved');
    expect(statusValues).toContain('rejected');
    expect(statusValues).toContain('archived');
    expect(statusValues).toContain('spam');
  });
});

describe('TopicPriority Enum', () => {
  it('should have LOW priority', () => {
    expect(TopicPriority.LOW).toBe('low');
  });

  it('should have NORMAL priority', () => {
    expect(TopicPriority.NORMAL).toBe('normal');
  });

  it('should have HIGH priority', () => {
    expect(TopicPriority.HIGH).toBe('high');
  });

  it('should have URGENT priority', () => {
    expect(TopicPriority.URGENT).toBe('urgent');
  });

  it('should have exactly 4 priority values', () => {
    const priorityValues = Object.values(TopicPriority);
    expect(priorityValues).toHaveLength(4);
    expect(priorityValues).toContain('low');
    expect(priorityValues).toContain('normal');
    expect(priorityValues).toContain('high');
    expect(priorityValues).toContain('urgent');
  });
});

describe('ReplyStatus Enum', () => {
  it('should have PUBLISHED status', () => {
    expect(ReplyStatus.PUBLISHED).toBe('published');
  });

  it('should have PENDING_APPROVAL status', () => {
    expect(ReplyStatus.PENDING_APPROVAL).toBe('pending_approval');
  });

  it('should have APPROVED status', () => {
    expect(ReplyStatus.APPROVED).toBe('approved');
  });

  it('should have REJECTED status', () => {
    expect(ReplyStatus.REJECTED).toBe('rejected');
  });

  it('should have EDITED status', () => {
    expect(ReplyStatus.EDITED).toBe('edited');
  });

  it('should have SPAM status', () => {
    expect(ReplyStatus.SPAM).toBe('spam');
  });

  it('should have exactly 6 status values', () => {
    const statusValues = Object.values(ReplyStatus);
    expect(statusValues).toHaveLength(6);
    expect(statusValues).toContain('published');
    expect(statusValues).toContain('pending_approval');
    expect(statusValues).toContain('approved');
    expect(statusValues).toContain('rejected');
    expect(statusValues).toContain('edited');
    expect(statusValues).toContain('spam');
  });
});

describe('NotificationType Enum', () => {
  it('should have NEW_REPLY type', () => {
    expect(NotificationType.NEW_REPLY).toBe('new_reply');
  });

  it('should have NEW_TOPIC type', () => {
    expect(NotificationType.NEW_TOPIC).toBe('new_topic');
  });

  it('should have TOPIC_LIKED type', () => {
    expect(NotificationType.TOPIC_LIKED).toBe('topic_liked');
  });

  it('should have REPLY_LIKED type', () => {
    expect(NotificationType.REPLY_LIKED).toBe('reply_liked');
  });

  it('should have MENTION type', () => {
    expect(NotificationType.MENTION).toBe('mention');
  });

  it('should have TOPIC_APPROVED type', () => {
    expect(NotificationType.TOPIC_APPROVED).toBe('topic_approved');
  });

  it('should have TOPIC_REJECTED type', () => {
    expect(NotificationType.TOPIC_REJECTED).toBe('topic_rejected');
  });

  it('should have REPLY_APPROVED type', () => {
    expect(NotificationType.REPLY_APPROVED).toBe('reply_approved');
  });

  it('should have REPLY_REJECTED type', () => {
    expect(NotificationType.REPLY_REJECTED).toBe('reply_rejected');
  });

  it('should have MODERATOR_ACTION type', () => {
    expect(NotificationType.MODERATOR_ACTION).toBe('moderator_action');
  });

  it('should have exactly 10 notification types', () => {
    const typeValues = Object.values(NotificationType);
    expect(typeValues).toHaveLength(10);
    expect(typeValues).toContain('new_reply');
    expect(typeValues).toContain('new_topic');
    expect(typeValues).toContain('topic_liked');
    expect(typeValues).toContain('reply_liked');
    expect(typeValues).toContain('mention');
    expect(typeValues).toContain('topic_approved');
    expect(typeValues).toContain('topic_rejected');
    expect(typeValues).toContain('reply_approved');
    expect(typeValues).toContain('reply_rejected');
    expect(typeValues).toContain('moderator_action');
  });
});

describe('ActivityType Enum', () => {
  it('should have TOPIC_CREATED type', () => {
    expect(ActivityType.TOPIC_CREATED).toBe('topic_created');
  });

  it('should have REPLY_CREATED type', () => {
    expect(ActivityType.REPLY_CREATED).toBe('reply_created');
  });

  it('should have TOPIC_LIKED type', () => {
    expect(ActivityType.TOPIC_LIKED).toBe('topic_liked');
  });

  it('should have REPLY_LIKED type', () => {
    expect(ActivityType.REPLY_LIKED).toBe('reply_liked');
  });

  it('should have TOPIC_PINNED type', () => {
    expect(ActivityType.TOPIC_PINNED).toBe('topic_pinned');
  });

  it('should have TOPIC_LOCKED type', () => {
    expect(ActivityType.TOPIC_LOCKED).toBe('topic_locked');
  });

  it('should have USER_JOINED type', () => {
    expect(ActivityType.USER_JOINED).toBe('user_joined');
  });

  it('should have BADGE_EARNED type', () => {
    expect(ActivityType.BADGE_EARNED).toBe('badge_earned');
  });

  it('should have exactly 8 activity types', () => {
    const typeValues = Object.values(ActivityType);
    expect(typeValues).toHaveLength(8);
    expect(typeValues).toContain('topic_created');
    expect(typeValues).toContain('reply_created');
    expect(typeValues).toContain('topic_liked');
    expect(typeValues).toContain('reply_liked');
    expect(typeValues).toContain('topic_pinned');
    expect(typeValues).toContain('topic_locked');
    expect(typeValues).toContain('user_joined');
    expect(typeValues).toContain('badge_earned');
  });
});

describe('DigestFrequency Enum', () => {
  it('should have NEVER frequency', () => {
    expect(DigestFrequency.NEVER).toBe('never');
  });

  it('should have DAILY frequency', () => {
    expect(DigestFrequency.DAILY).toBe('daily');
  });

  it('should have WEEKLY frequency', () => {
    expect(DigestFrequency.WEEKLY).toBe('weekly');
  });

  it('should have MONTHLY frequency', () => {
    expect(DigestFrequency.MONTHLY).toBe('monthly');
  });

  it('should have exactly 4 frequency values', () => {
    const frequencyValues = Object.values(DigestFrequency);
    expect(frequencyValues).toHaveLength(4);
    expect(frequencyValues).toContain('never');
    expect(frequencyValues).toContain('daily');
    expect(frequencyValues).toContain('weekly');
    expect(frequencyValues).toContain('monthly');
  });
});

describe('BadgeType Enum', () => {
  it('should have TOPICS_CREATED type', () => {
    expect(BadgeType.TOPICS_CREATED).toBe('topics_created');
  });

  it('should have REPLIES_POSTED type', () => {
    expect(BadgeType.REPLIES_POSTED).toBe('replies_posted');
  });

  it('should have LIKES_RECEIVED type', () => {
    expect(BadgeType.LIKES_RECEIVED).toBe('likes_received');
  });

  it('should have DAYS_ACTIVE type', () => {
    expect(BadgeType.DAYS_ACTIVE).toBe('days_active');
  });

  it('should have HELPFUL_REPLIES type', () => {
    expect(BadgeType.HELPFUL_REPLIES).toBe('helpful_replies');
  });

  it('should have FIRST_TOPIC type', () => {
    expect(BadgeType.FIRST_TOPIC).toBe('first_topic');
  });

  it('should have FIRST_REPLY type', () => {
    expect(BadgeType.FIRST_REPLY).toBe('first_reply');
  });

  it('should have exactly 7 badge types', () => {
    const typeValues = Object.values(BadgeType);
    expect(typeValues).toHaveLength(7);
    expect(typeValues).toContain('topics_created');
    expect(typeValues).toContain('replies_posted');
    expect(typeValues).toContain('likes_received');
    expect(typeValues).toContain('days_active');
    expect(typeValues).toContain('helpful_replies');
    expect(typeValues).toContain('first_topic');
    expect(typeValues).toContain('first_reply');
  });
});

// ============================================================================
// Interface Type Checking Tests
// ============================================================================

describe('ForumTopic Interface', () => {
  it('should accept a valid ForumTopic object', () => {
    const topic: ForumTopic = createMockForumTopic();
    expect(topic.id).toBeDefined();
    expect(topic.title).toBeDefined();
    expect(topic.content).toBeDefined();
    expect(topic.authorId).toBeDefined();
    expect(topic.status).toBeDefined();
    expect(topic.category).toBeDefined();
  });

  it('should have all required fields', () => {
    const topic = createMockForumTopic();
    expect(topic.id).toBe('topic-1');
    expect(topic.title).toBe('Welcome to our church forum');
    expect(topic.categoryId).toBe('category-1');
    expect(topic.authorId).toBe('user-1');
    expect(topic.authorName).toBe('John Doe');
    expect(topic.authorEmail).toBe('john.doe@example.com');
    expect(topic.status).toBe(TopicStatus.PUBLISHED);
    expect(topic.priority).toBe(TopicPriority.NORMAL);
    expect(topic.isPinned).toBe(false);
    expect(topic.isLocked).toBe(false);
    expect(topic.viewCount).toBe(100);
    expect(topic.replyCount).toBe(5);
    expect(topic.tags).toEqual(['welcome', 'introduction']);
    expect(topic.likes).toEqual(['user-2', 'user-3', 'user-4']);
    expect(topic.attachments).toEqual([]);
  });

  it('should allow optional fields to be undefined', () => {
    const topic = createMockForumTopic({
      authorAvatar: undefined,
      lastReplyAt: undefined,
      lastReplyBy: undefined,
      moderatedAt: undefined,
      moderatedBy: undefined
    });
    expect(topic.authorAvatar).toBeUndefined();
    expect(topic.lastReplyAt).toBeUndefined();
    expect(topic.lastReplyBy).toBeUndefined();
    expect(topic.moderatedAt).toBeUndefined();
    expect(topic.moderatedBy).toBeUndefined();
  });

  it('should handle pinned topics', () => {
    const pinnedTopic = createMockForumTopic({ isPinned: true });
    expect(pinnedTopic.isPinned).toBe(true);
  });

  it('should handle locked topics', () => {
    const lockedTopic = createMockForumTopic({ isLocked: true });
    expect(lockedTopic.isLocked).toBe(true);
  });

  it('should handle topics with attachments', () => {
    const topicWithAttachments = createMockForumTopic({
      attachments: [createMockForumAttachment()]
    });
    expect(topicWithAttachments.attachments).toHaveLength(1);
    expect(topicWithAttachments.attachments[0].fileName).toBe('document-abc123.pdf');
  });

  it('should handle moderated topics', () => {
    const moderatedTopic = createMockForumTopic({
      status: TopicStatus.REJECTED,
      moderatedAt: new Date('2024-01-15T12:00:00Z'),
      moderatedBy: 'moderator-1'
    });
    expect(moderatedTopic.status).toBe(TopicStatus.REJECTED);
    expect(moderatedTopic.moderatedAt).toBeDefined();
    expect(moderatedTopic.moderatedBy).toBe('moderator-1');
  });

  it('should handle different topic statuses', () => {
    const draftTopic = createMockForumTopic({ status: TopicStatus.DRAFT });
    const pendingTopic = createMockForumTopic({ status: TopicStatus.PENDING_APPROVAL });
    const approvedTopic = createMockForumTopic({ status: TopicStatus.APPROVED });
    const archivedTopic = createMockForumTopic({ status: TopicStatus.ARCHIVED });
    const spamTopic = createMockForumTopic({ status: TopicStatus.SPAM });

    expect(draftTopic.status).toBe(TopicStatus.DRAFT);
    expect(pendingTopic.status).toBe(TopicStatus.PENDING_APPROVAL);
    expect(approvedTopic.status).toBe(TopicStatus.APPROVED);
    expect(archivedTopic.status).toBe(TopicStatus.ARCHIVED);
    expect(spamTopic.status).toBe(TopicStatus.SPAM);
  });

  it('should handle different topic priorities', () => {
    const lowPriority = createMockForumTopic({ priority: TopicPriority.LOW });
    const highPriority = createMockForumTopic({ priority: TopicPriority.HIGH });
    const urgentPriority = createMockForumTopic({ priority: TopicPriority.URGENT });

    expect(lowPriority.priority).toBe(TopicPriority.LOW);
    expect(highPriority.priority).toBe(TopicPriority.HIGH);
    expect(urgentPriority.priority).toBe(TopicPriority.URGENT);
  });
});

describe('ForumReply Interface', () => {
  it('should accept a valid ForumReply object', () => {
    const reply: ForumReply = createMockForumReply();
    expect(reply.id).toBeDefined();
    expect(reply.topicId).toBeDefined();
    expect(reply.content).toBeDefined();
    expect(reply.authorId).toBeDefined();
    expect(reply.status).toBeDefined();
  });

  it('should have all required fields', () => {
    const reply = createMockForumReply();
    expect(reply.id).toBe('reply-1');
    expect(reply.topicId).toBe('topic-1');
    expect(reply.authorId).toBe('user-2');
    expect(reply.authorName).toBe('Jane Smith');
    expect(reply.authorEmail).toBe('jane.smith@example.com');
    expect(reply.status).toBe(ReplyStatus.PUBLISHED);
    expect(reply.likes).toEqual(['user-1', 'user-3']);
    expect(reply.attachments).toEqual([]);
    expect(reply.isAcceptedAnswer).toBe(false);
  });

  it('should allow optional fields to be undefined', () => {
    const reply = createMockForumReply({
      authorAvatar: undefined,
      parentReplyId: undefined,
      editedAt: undefined,
      moderatedAt: undefined,
      moderatedBy: undefined
    });
    expect(reply.authorAvatar).toBeUndefined();
    expect(reply.parentReplyId).toBeUndefined();
    expect(reply.editedAt).toBeUndefined();
    expect(reply.moderatedAt).toBeUndefined();
    expect(reply.moderatedBy).toBeUndefined();
  });

  it('should handle threaded replies with parentReplyId', () => {
    const threadedReply = createMockForumReply({
      id: 'reply-2',
      parentReplyId: 'reply-1'
    });
    expect(threadedReply.parentReplyId).toBe('reply-1');
  });

  it('should handle accepted answers', () => {
    const acceptedReply = createMockForumReply({ isAcceptedAnswer: true });
    expect(acceptedReply.isAcceptedAnswer).toBe(true);
  });

  it('should handle edited replies', () => {
    const editedReply = createMockForumReply({
      status: ReplyStatus.EDITED,
      editedAt: new Date('2024-01-10T12:00:00Z')
    });
    expect(editedReply.status).toBe(ReplyStatus.EDITED);
    expect(editedReply.editedAt).toBeDefined();
  });

  it('should handle moderated replies', () => {
    const moderatedReply = createMockForumReply({
      status: ReplyStatus.REJECTED,
      moderatedAt: new Date('2024-01-15T12:00:00Z'),
      moderatedBy: 'moderator-1'
    });
    expect(moderatedReply.status).toBe(ReplyStatus.REJECTED);
    expect(moderatedReply.moderatedAt).toBeDefined();
    expect(moderatedReply.moderatedBy).toBe('moderator-1');
  });

  it('should handle different reply statuses', () => {
    const pendingReply = createMockForumReply({ status: ReplyStatus.PENDING_APPROVAL });
    const approvedReply = createMockForumReply({ status: ReplyStatus.APPROVED });
    const rejectedReply = createMockForumReply({ status: ReplyStatus.REJECTED });
    const spamReply = createMockForumReply({ status: ReplyStatus.SPAM });

    expect(pendingReply.status).toBe(ReplyStatus.PENDING_APPROVAL);
    expect(approvedReply.status).toBe(ReplyStatus.APPROVED);
    expect(rejectedReply.status).toBe(ReplyStatus.REJECTED);
    expect(spamReply.status).toBe(ReplyStatus.SPAM);
  });
});

describe('ForumCategory Interface', () => {
  it('should accept a valid ForumCategory object', () => {
    const category: ForumCategory = createMockForumCategory();
    expect(category.id).toBeDefined();
    expect(category.name).toBeDefined();
    expect(category.slug).toBeDefined();
    expect(category.isActive).toBeDefined();
  });

  it('should have all required fields', () => {
    const category = createMockForumCategory();
    expect(category.id).toBe('category-1');
    expect(category.name).toBe('General Discussion');
    expect(category.description).toBe('A place for general church discussions');
    expect(category.icon).toBe('message-circle');
    expect(category.color).toBe('#4A90D9');
    expect(category.slug).toBe('general-discussion');
    expect(category.isActive).toBe(true);
    expect(category.requiresApproval).toBe(false);
    expect(category.allowedRoles).toEqual(['admin', 'member', 'leader']);
    expect(category.topicCount).toBe(10);
    expect(category.replyCount).toBe(50);
    expect(category.moderators).toEqual(['mod-1', 'mod-2']);
    expect(category.displayOrder).toBe(1);
  });

  it('should allow optional fields to be undefined', () => {
    const category = createMockForumCategory({
      parentId: undefined,
      lastTopicAt: undefined,
      lastTopicBy: undefined
    });
    expect(category.parentId).toBeUndefined();
    expect(category.lastTopicAt).toBeUndefined();
    expect(category.lastTopicBy).toBeUndefined();
  });

  it('should handle subcategories with parentId', () => {
    const subcategory = createMockForumCategory({
      id: 'category-2',
      name: 'Prayer Requests',
      slug: 'prayer-requests',
      parentId: 'category-1'
    });
    expect(subcategory.parentId).toBe('category-1');
  });

  it('should handle categories requiring approval', () => {
    const approvalRequired = createMockForumCategory({ requiresApproval: true });
    expect(approvalRequired.requiresApproval).toBe(true);
  });

  it('should handle inactive categories', () => {
    const inactiveCategory = createMockForumCategory({ isActive: false });
    expect(inactiveCategory.isActive).toBe(false);
  });

  it('should handle categories with restricted roles', () => {
    const restrictedCategory = createMockForumCategory({
      allowedRoles: ['admin', 'leader']
    });
    expect(restrictedCategory.allowedRoles).toEqual(['admin', 'leader']);
    expect(restrictedCategory.allowedRoles).not.toContain('member');
  });
});

describe('ForumAttachment Interface', () => {
  it('should accept a valid ForumAttachment object', () => {
    const attachment: ForumAttachment = createMockForumAttachment();
    expect(attachment.id).toBeDefined();
    expect(attachment.fileName).toBeDefined();
    expect(attachment.downloadUrl).toBeDefined();
  });

  it('should have all required fields', () => {
    const attachment = createMockForumAttachment();
    expect(attachment.id).toBe('attachment-1');
    expect(attachment.fileName).toBe('document-abc123.pdf');
    expect(attachment.originalName).toBe('church-bulletin.pdf');
    expect(attachment.fileType).toBe('application/pdf');
    expect(attachment.fileSize).toBe(1024000);
    expect(attachment.downloadUrl).toBe('https://storage.example.com/attachments/document-abc123.pdf');
    expect(attachment.uploadedBy).toBe('user-1');
    expect(attachment.uploadedAt).toBeDefined();
  });

  it('should handle different file types', () => {
    const imageAttachment = createMockForumAttachment({
      fileName: 'photo-123.jpg',
      originalName: 'church-event.jpg',
      fileType: 'image/jpeg'
    });
    expect(imageAttachment.fileType).toBe('image/jpeg');

    const docAttachment = createMockForumAttachment({
      fileName: 'doc-456.docx',
      originalName: 'sermon-notes.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    expect(docAttachment.fileType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
});

describe('ForumNotification Interface', () => {
  it('should accept a valid ForumNotification object', () => {
    const notification: ForumNotification = createMockForumNotification();
    expect(notification.id).toBeDefined();
    expect(notification.userId).toBeDefined();
    expect(notification.type).toBeDefined();
    expect(notification.isRead).toBeDefined();
  });

  it('should have all required fields', () => {
    const notification = createMockForumNotification();
    expect(notification.id).toBe('notification-1');
    expect(notification.userId).toBe('user-1');
    expect(notification.type).toBe(NotificationType.NEW_REPLY);
    expect(notification.triggeredBy).toBe('user-2');
    expect(notification.triggeredByName).toBe('Jane Smith');
    expect(notification.title).toBe('New Reply');
    expect(notification.isRead).toBe(false);
  });

  it('should allow optional fields to be undefined', () => {
    const notification = createMockForumNotification({
      topicId: undefined,
      replyId: undefined
    });
    expect(notification.topicId).toBeUndefined();
    expect(notification.replyId).toBeUndefined();
  });

  it('should handle different notification types', () => {
    const topicLikedNotif = createMockForumNotification({
      type: NotificationType.TOPIC_LIKED,
      title: 'Topic Liked',
      message: 'Someone liked your topic'
    });
    expect(topicLikedNotif.type).toBe(NotificationType.TOPIC_LIKED);

    const mentionNotif = createMockForumNotification({
      type: NotificationType.MENTION,
      title: 'You were mentioned',
      message: 'Someone mentioned you in a topic'
    });
    expect(mentionNotif.type).toBe(NotificationType.MENTION);

    const moderatorNotif = createMockForumNotification({
      type: NotificationType.MODERATOR_ACTION,
      title: 'Moderator Action',
      message: 'A moderator took action on your content'
    });
    expect(moderatorNotif.type).toBe(NotificationType.MODERATOR_ACTION);
  });

  it('should handle read notifications', () => {
    const readNotification = createMockForumNotification({ isRead: true });
    expect(readNotification.isRead).toBe(true);
  });
});

describe('UserForumProfile Interface', () => {
  it('should accept a valid UserForumProfile object', () => {
    const profile: UserForumProfile = createMockUserForumProfile();
    expect(profile.id).toBeDefined();
    expect(profile.userId).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.preferences).toBeDefined();
  });

  it('should have all required fields', () => {
    const profile = createMockUserForumProfile();
    expect(profile.id).toBe('profile-1');
    expect(profile.userId).toBe('user-1');
    expect(profile.displayName).toBe('John Doe');
    expect(profile.reputation).toBe(150);
    expect(profile.totalTopics).toBe(10);
    expect(profile.totalReplies).toBe(50);
    expect(profile.totalLikes).toBe(75);
    expect(profile.badges).toHaveLength(1);
    expect(profile.preferences).toBeDefined();
  });

  it('should allow optional fields to be undefined', () => {
    const profile = createMockUserForumProfile({
      avatar: undefined,
      signature: undefined,
      title: undefined
    });
    expect(profile.avatar).toBeUndefined();
    expect(profile.signature).toBeUndefined();
    expect(profile.title).toBeUndefined();
  });

  it('should handle profiles with multiple badges', () => {
    const profileWithBadges = createMockUserForumProfile({
      badges: [
        createMockForumBadge({ id: 'badge-1', name: 'Topic Starter' }),
        createMockForumBadge({ id: 'badge-2', name: 'Helpful Member' }),
        createMockForumBadge({ id: 'badge-3', name: 'Active Contributor' })
      ]
    });
    expect(profileWithBadges.badges).toHaveLength(3);
  });

  it('should handle profiles with no badges', () => {
    const profileNoBadges = createMockUserForumProfile({ badges: [] });
    expect(profileNoBadges.badges).toHaveLength(0);
  });
});

describe('ForumBadge Interface', () => {
  it('should accept a valid ForumBadge object', () => {
    const badge: ForumBadge = createMockForumBadge();
    expect(badge.id).toBeDefined();
    expect(badge.name).toBeDefined();
    expect(badge.criteria).toBeDefined();
  });

  it('should have all required fields', () => {
    const badge = createMockForumBadge();
    expect(badge.id).toBe('badge-1');
    expect(badge.name).toBe('Topic Starter');
    expect(badge.description).toBe('Created 10 topics in the forum');
    expect(badge.icon).toBe('star');
    expect(badge.color).toBe('#FFD700');
    expect(badge.earnedAt).toBeDefined();
    expect(badge.criteria.type).toBe(BadgeType.TOPICS_CREATED);
    expect(badge.criteria.threshold).toBe(10);
  });

  it('should handle different badge criteria', () => {
    const replyBadge = createMockForumBadge({
      name: 'Reply Master',
      criteria: createMockBadgeCriteria({
        type: BadgeType.REPLIES_POSTED,
        threshold: 100
      })
    });
    expect(replyBadge.criteria.type).toBe(BadgeType.REPLIES_POSTED);

    const likesBadge = createMockForumBadge({
      name: 'Popular Member',
      criteria: createMockBadgeCriteria({
        type: BadgeType.LIKES_RECEIVED,
        threshold: 50
      })
    });
    expect(likesBadge.criteria.type).toBe(BadgeType.LIKES_RECEIVED);
  });
});

describe('ForumPreferences Interface', () => {
  it('should accept a valid ForumPreferences object', () => {
    const preferences: ForumPreferences = createMockForumPreferences();
    expect(preferences.emailNotifications).toBeDefined();
    expect(preferences.pushNotifications).toBeDefined();
    expect(preferences.digestFrequency).toBeDefined();
  });

  it('should have all required fields', () => {
    const preferences = createMockForumPreferences();
    expect(preferences.emailNotifications).toBe(true);
    expect(preferences.pushNotifications).toBe(false);
    expect(preferences.digestFrequency).toBe(DigestFrequency.WEEKLY);
    expect(preferences.subscribedCategories).toEqual(['category-1', 'category-2']);
    expect(preferences.blockedUsers).toEqual([]);
  });

  it('should handle different digest frequencies', () => {
    const dailyDigest = createMockForumPreferences({ digestFrequency: DigestFrequency.DAILY });
    const monthlyDigest = createMockForumPreferences({ digestFrequency: DigestFrequency.MONTHLY });
    const neverDigest = createMockForumPreferences({ digestFrequency: DigestFrequency.NEVER });

    expect(dailyDigest.digestFrequency).toBe(DigestFrequency.DAILY);
    expect(monthlyDigest.digestFrequency).toBe(DigestFrequency.MONTHLY);
    expect(neverDigest.digestFrequency).toBe(DigestFrequency.NEVER);
  });

  it('should handle blocked users', () => {
    const prefsWithBlocked = createMockForumPreferences({
      blockedUsers: ['user-5', 'user-6', 'user-7']
    });
    expect(prefsWithBlocked.blockedUsers).toHaveLength(3);
  });
});

describe('ForumStats Interface', () => {
  it('should accept a valid ForumStats object', () => {
    const stats: ForumStats = createMockForumStats();
    expect(stats.totalTopics).toBeDefined();
    expect(stats.totalReplies).toBeDefined();
    expect(stats.totalUsers).toBeDefined();
  });

  it('should have all required fields', () => {
    const stats = createMockForumStats();
    expect(stats.totalTopics).toBe(100);
    expect(stats.totalReplies).toBe(500);
    expect(stats.totalUsers).toBe(50);
    expect(stats.totalViews).toBe(10000);
    expect(stats.activeUsers).toBe(25);
    expect(stats.topContributors).toHaveLength(1);
    expect(stats.popularTopics).toHaveLength(1);
    expect(stats.recentActivity).toHaveLength(1);
  });

  it('should handle empty stats', () => {
    const emptyStats = createMockForumStats({
      totalTopics: 0,
      totalReplies: 0,
      totalUsers: 0,
      totalViews: 0,
      activeUsers: 0,
      topContributors: [],
      popularTopics: [],
      recentActivity: []
    });
    expect(emptyStats.totalTopics).toBe(0);
    expect(emptyStats.topContributors).toHaveLength(0);
    expect(emptyStats.popularTopics).toHaveLength(0);
    expect(emptyStats.recentActivity).toHaveLength(0);
  });
});

describe('UserContribution Interface', () => {
  it('should accept a valid UserContribution object', () => {
    const contribution: UserContribution = createMockUserContribution();
    expect(contribution.userId).toBeDefined();
    expect(contribution.userName).toBeDefined();
    expect(contribution.reputation).toBeDefined();
  });

  it('should have all required fields', () => {
    const contribution = createMockUserContribution();
    expect(contribution.userId).toBe('user-1');
    expect(contribution.userName).toBe('John Doe');
    expect(contribution.topicCount).toBe(10);
    expect(contribution.replyCount).toBe(50);
    expect(contribution.totalLikes).toBe(75);
    expect(contribution.reputation).toBe(150);
  });

  it('should allow optional avatar to be undefined', () => {
    const contribution = createMockUserContribution({ avatar: undefined });
    expect(contribution.avatar).toBeUndefined();
  });
});

describe('ForumActivity Interface', () => {
  it('should accept a valid ForumActivity object', () => {
    const activity: ForumActivity = createMockForumActivity();
    expect(activity.id).toBeDefined();
    expect(activity.type).toBeDefined();
    expect(activity.userId).toBeDefined();
    expect(activity.description).toBeDefined();
  });

  it('should have all required fields', () => {
    const activity = createMockForumActivity();
    expect(activity.id).toBe('activity-1');
    expect(activity.type).toBe(ActivityType.TOPIC_CREATED);
    expect(activity.userId).toBe('user-1');
    expect(activity.userName).toBe('John Doe');
    expect(activity.description).toBe('Created new topic: Welcome to our church forum');
    expect(activity.timestamp).toBeDefined();
  });

  it('should allow optional fields to be undefined', () => {
    const activity = createMockForumActivity({
      userAvatar: undefined,
      topicId: undefined,
      topicTitle: undefined,
      replyId: undefined,
      categoryId: undefined,
      categoryName: undefined
    });
    expect(activity.userAvatar).toBeUndefined();
    expect(activity.topicId).toBeUndefined();
    expect(activity.topicTitle).toBeUndefined();
    expect(activity.replyId).toBeUndefined();
    expect(activity.categoryId).toBeUndefined();
    expect(activity.categoryName).toBeUndefined();
  });

  it('should handle different activity types', () => {
    const replyActivity = createMockForumActivity({
      type: ActivityType.REPLY_CREATED,
      replyId: 'reply-1',
      description: 'Replied to topic'
    });
    expect(replyActivity.type).toBe(ActivityType.REPLY_CREATED);

    const topicPinnedActivity = createMockForumActivity({
      type: ActivityType.TOPIC_PINNED,
      description: 'Pinned topic: Welcome to our church forum'
    });
    expect(topicPinnedActivity.type).toBe(ActivityType.TOPIC_PINNED);

    const userJoinedActivity = createMockForumActivity({
      type: ActivityType.USER_JOINED,
      topicId: undefined,
      topicTitle: undefined,
      description: 'Joined the forum'
    });
    expect(userJoinedActivity.type).toBe(ActivityType.USER_JOINED);

    const badgeEarnedActivity = createMockForumActivity({
      type: ActivityType.BADGE_EARNED,
      description: 'Earned badge: Topic Starter'
    });
    expect(badgeEarnedActivity.type).toBe(ActivityType.BADGE_EARNED);
  });
});

describe('BadgeCriteria Interface', () => {
  it('should accept a valid BadgeCriteria object', () => {
    const criteria: BadgeCriteria = createMockBadgeCriteria();
    expect(criteria.type).toBeDefined();
    expect(criteria.threshold).toBeDefined();
    expect(criteria.description).toBeDefined();
  });

  it('should have all required fields', () => {
    const criteria = createMockBadgeCriteria();
    expect(criteria.type).toBe(BadgeType.TOPICS_CREATED);
    expect(criteria.threshold).toBe(10);
    expect(criteria.description).toBe('Create 10 topics to earn this badge');
  });

  it('should handle different badge types', () => {
    const topicsCriteria = createMockBadgeCriteria({ type: BadgeType.TOPICS_CREATED });
    const repliesCriteria = createMockBadgeCriteria({ type: BadgeType.REPLIES_POSTED });
    const likesCriteria = createMockBadgeCriteria({ type: BadgeType.LIKES_RECEIVED });
    const daysActiveCriteria = createMockBadgeCriteria({ type: BadgeType.DAYS_ACTIVE });
    const helpfulCriteria = createMockBadgeCriteria({ type: BadgeType.HELPFUL_REPLIES });
    const firstTopicCriteria = createMockBadgeCriteria({ type: BadgeType.FIRST_TOPIC });
    const firstReplyCriteria = createMockBadgeCriteria({ type: BadgeType.FIRST_REPLY });

    expect(topicsCriteria.type).toBe(BadgeType.TOPICS_CREATED);
    expect(repliesCriteria.type).toBe(BadgeType.REPLIES_POSTED);
    expect(likesCriteria.type).toBe(BadgeType.LIKES_RECEIVED);
    expect(daysActiveCriteria.type).toBe(BadgeType.DAYS_ACTIVE);
    expect(helpfulCriteria.type).toBe(BadgeType.HELPFUL_REPLIES);
    expect(firstTopicCriteria.type).toBe(BadgeType.FIRST_TOPIC);
    expect(firstReplyCriteria.type).toBe(BadgeType.FIRST_REPLY);
  });
});

// ============================================================================
// Reply Management Tests
// ============================================================================

describe('Reply Management', () => {
  describe('Threaded Replies', () => {
    it('should support creating reply chains', () => {
      const parentReply = createMockForumReply({
        id: 'reply-1',
        parentReplyId: undefined
      });

      const childReply = createMockForumReply({
        id: 'reply-2',
        parentReplyId: 'reply-1'
      });

      const grandchildReply = createMockForumReply({
        id: 'reply-3',
        parentReplyId: 'reply-2'
      });

      expect(parentReply.parentReplyId).toBeUndefined();
      expect(childReply.parentReplyId).toBe('reply-1');
      expect(grandchildReply.parentReplyId).toBe('reply-2');
    });

    it('should track accepted answers', () => {
      const replies: ForumReply[] = [
        createMockForumReply({ id: 'reply-1', isAcceptedAnswer: false }),
        createMockForumReply({ id: 'reply-2', isAcceptedAnswer: true }),
        createMockForumReply({ id: 'reply-3', isAcceptedAnswer: false })
      ];

      const acceptedAnswer = replies.find(r => r.isAcceptedAnswer);
      expect(acceptedAnswer).toBeDefined();
      expect(acceptedAnswer?.id).toBe('reply-2');
    });
  });

  describe('Reply Status Workflow', () => {
    it('should support pending to approved workflow', () => {
      const pendingReply = createMockForumReply({
        status: ReplyStatus.PENDING_APPROVAL
      });
      expect(pendingReply.status).toBe(ReplyStatus.PENDING_APPROVAL);

      const approvedReply = { ...pendingReply, status: ReplyStatus.APPROVED };
      expect(approvedReply.status).toBe(ReplyStatus.APPROVED);
    });

    it('should support pending to rejected workflow', () => {
      const pendingReply = createMockForumReply({
        status: ReplyStatus.PENDING_APPROVAL
      });

      const rejectedReply = {
        ...pendingReply,
        status: ReplyStatus.REJECTED,
        moderatedAt: new Date(),
        moderatedBy: 'moderator-1'
      };

      expect(rejectedReply.status).toBe(ReplyStatus.REJECTED);
      expect(rejectedReply.moderatedAt).toBeDefined();
      expect(rejectedReply.moderatedBy).toBe('moderator-1');
    });

    it('should support editing published replies', () => {
      const publishedReply = createMockForumReply({
        status: ReplyStatus.PUBLISHED,
        content: 'Original content'
      });

      const editedReply = {
        ...publishedReply,
        content: 'Edited content',
        status: ReplyStatus.EDITED,
        editedAt: new Date()
      };

      expect(editedReply.status).toBe(ReplyStatus.EDITED);
      expect(editedReply.content).toBe('Edited content');
      expect(editedReply.editedAt).toBeDefined();
    });
  });
});

// ============================================================================
// Moderation Features Tests
// ============================================================================

describe('Moderation Features', () => {
  describe('Topic Moderation', () => {
    it('should support marking topics as spam', () => {
      const spamTopic = createMockForumTopic({
        status: TopicStatus.SPAM,
        moderatedAt: new Date(),
        moderatedBy: 'moderator-1'
      });

      expect(spamTopic.status).toBe(TopicStatus.SPAM);
      expect(spamTopic.moderatedAt).toBeDefined();
      expect(spamTopic.moderatedBy).toBe('moderator-1');
    });

    it('should support rejecting topics', () => {
      const rejectedTopic = createMockForumTopic({
        status: TopicStatus.REJECTED,
        moderatedAt: new Date(),
        moderatedBy: 'moderator-1'
      });

      expect(rejectedTopic.status).toBe(TopicStatus.REJECTED);
    });

    it('should support archiving topics', () => {
      const archivedTopic = createMockForumTopic({
        status: TopicStatus.ARCHIVED
      });

      expect(archivedTopic.status).toBe(TopicStatus.ARCHIVED);
    });

    it('should support locking topics', () => {
      const lockedTopic = createMockForumTopic({
        isLocked: true
      });

      expect(lockedTopic.isLocked).toBe(true);
    });

    it('should support pinning topics', () => {
      const pinnedTopic = createMockForumTopic({
        isPinned: true
      });

      expect(pinnedTopic.isPinned).toBe(true);
    });
  });

  describe('Reply Moderation', () => {
    it('should support marking replies as spam', () => {
      const spamReply = createMockForumReply({
        status: ReplyStatus.SPAM,
        moderatedAt: new Date(),
        moderatedBy: 'moderator-1'
      });

      expect(spamReply.status).toBe(ReplyStatus.SPAM);
      expect(spamReply.moderatedAt).toBeDefined();
      expect(spamReply.moderatedBy).toBe('moderator-1');
    });

    it('should support rejecting replies', () => {
      const rejectedReply = createMockForumReply({
        status: ReplyStatus.REJECTED,
        moderatedAt: new Date(),
        moderatedBy: 'moderator-1'
      });

      expect(rejectedReply.status).toBe(ReplyStatus.REJECTED);
    });
  });

  describe('Category Moderation', () => {
    it('should support categories requiring approval', () => {
      const moderatedCategory = createMockForumCategory({
        requiresApproval: true
      });

      expect(moderatedCategory.requiresApproval).toBe(true);
    });

    it('should support assigning moderators to categories', () => {
      const categoryWithModerators = createMockForumCategory({
        moderators: ['mod-1', 'mod-2', 'mod-3']
      });

      expect(categoryWithModerators.moderators).toHaveLength(3);
      expect(categoryWithModerators.moderators).toContain('mod-1');
      expect(categoryWithModerators.moderators).toContain('mod-2');
      expect(categoryWithModerators.moderators).toContain('mod-3');
    });

    it('should support role-based access control', () => {
      const restrictedCategory = createMockForumCategory({
        allowedRoles: ['admin', 'leader']
      });

      expect(restrictedCategory.allowedRoles).toContain('admin');
      expect(restrictedCategory.allowedRoles).toContain('leader');
      expect(restrictedCategory.allowedRoles).not.toContain('member');
    });

    it('should support deactivating categories', () => {
      const inactiveCategory = createMockForumCategory({
        isActive: false
      });

      expect(inactiveCategory.isActive).toBe(false);
    });
  });

  describe('Moderator Notifications', () => {
    it('should create moderator action notifications', () => {
      const moderatorNotification = createMockForumNotification({
        type: NotificationType.MODERATOR_ACTION,
        title: 'Content Removed',
        message: 'A moderator has removed your topic for violating community guidelines'
      });

      expect(moderatorNotification.type).toBe(NotificationType.MODERATOR_ACTION);
    });

    it('should notify about topic approval', () => {
      const approvalNotification = createMockForumNotification({
        type: NotificationType.TOPIC_APPROVED,
        title: 'Topic Approved',
        message: 'Your topic has been approved and is now visible'
      });

      expect(approvalNotification.type).toBe(NotificationType.TOPIC_APPROVED);
    });

    it('should notify about topic rejection', () => {
      const rejectionNotification = createMockForumNotification({
        type: NotificationType.TOPIC_REJECTED,
        title: 'Topic Rejected',
        message: 'Your topic has been rejected by a moderator'
      });

      expect(rejectionNotification.type).toBe(NotificationType.TOPIC_REJECTED);
    });

    it('should notify about reply approval', () => {
      const approvalNotification = createMockForumNotification({
        type: NotificationType.REPLY_APPROVED,
        title: 'Reply Approved',
        message: 'Your reply has been approved'
      });

      expect(approvalNotification.type).toBe(NotificationType.REPLY_APPROVED);
    });

    it('should notify about reply rejection', () => {
      const rejectionNotification = createMockForumNotification({
        type: NotificationType.REPLY_REJECTED,
        title: 'Reply Rejected',
        message: 'Your reply has been rejected by a moderator'
      });

      expect(rejectionNotification.type).toBe(NotificationType.REPLY_REJECTED);
    });
  });
});

// ============================================================================
// Vote/Like Counting Tests
// ============================================================================

describe('Vote/Like Counting', () => {
  describe('Topic Likes', () => {
    it('should count topic likes correctly', () => {
      const topic = createMockForumTopic({
        likes: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
      });

      expect(topic.likes).toHaveLength(5);
    });

    it('should handle topics with no likes', () => {
      const topic = createMockForumTopic({
        likes: []
      });

      expect(topic.likes).toHaveLength(0);
    });

    it('should track unique users who liked', () => {
      const topic = createMockForumTopic({
        likes: ['user-1', 'user-2', 'user-3']
      });

      expect(topic.likes).toContain('user-1');
      expect(topic.likes).toContain('user-2');
      expect(topic.likes).toContain('user-3');
      expect(topic.likes).not.toContain('user-4');
    });

    it('should support adding likes', () => {
      const topic = createMockForumTopic({ likes: ['user-1'] });
      const updatedTopic = {
        ...topic,
        likes: [...topic.likes, 'user-2']
      };

      expect(updatedTopic.likes).toHaveLength(2);
      expect(updatedTopic.likes).toContain('user-2');
    });

    it('should support removing likes (unlike)', () => {
      const topic = createMockForumTopic({
        likes: ['user-1', 'user-2', 'user-3']
      });
      const updatedTopic = {
        ...topic,
        likes: topic.likes.filter(id => id !== 'user-2')
      };

      expect(updatedTopic.likes).toHaveLength(2);
      expect(updatedTopic.likes).not.toContain('user-2');
    });
  });

  describe('Reply Likes', () => {
    it('should count reply likes correctly', () => {
      const reply = createMockForumReply({
        likes: ['user-1', 'user-2', 'user-3']
      });

      expect(reply.likes).toHaveLength(3);
    });

    it('should handle replies with no likes', () => {
      const reply = createMockForumReply({
        likes: []
      });

      expect(reply.likes).toHaveLength(0);
    });

    it('should track unique users who liked', () => {
      const reply = createMockForumReply({
        likes: ['user-1', 'user-2']
      });

      expect(reply.likes).toContain('user-1');
      expect(reply.likes).toContain('user-2');
    });
  });

  describe('User Total Likes', () => {
    it('should track user total likes in profile', () => {
      const profile = createMockUserForumProfile({
        totalLikes: 150
      });

      expect(profile.totalLikes).toBe(150);
    });

    it('should track user total likes in contribution', () => {
      const contribution = createMockUserContribution({
        totalLikes: 75
      });

      expect(contribution.totalLikes).toBe(75);
    });
  });

  describe('Like Notifications', () => {
    it('should notify when topic is liked', () => {
      const notification = createMockForumNotification({
        type: NotificationType.TOPIC_LIKED,
        title: 'Topic Liked',
        message: 'Jane Smith liked your topic'
      });

      expect(notification.type).toBe(NotificationType.TOPIC_LIKED);
    });

    it('should notify when reply is liked', () => {
      const notification = createMockForumNotification({
        type: NotificationType.REPLY_LIKED,
        title: 'Reply Liked',
        message: 'Jane Smith liked your reply'
      });

      expect(notification.type).toBe(NotificationType.REPLY_LIKED);
    });
  });

  describe('Like Activities', () => {
    it('should track topic like activity', () => {
      const activity = createMockForumActivity({
        type: ActivityType.TOPIC_LIKED,
        topicId: 'topic-1',
        description: 'Liked a topic'
      });

      expect(activity.type).toBe(ActivityType.TOPIC_LIKED);
    });

    it('should track reply like activity', () => {
      const activity = createMockForumActivity({
        type: ActivityType.REPLY_LIKED,
        replyId: 'reply-1',
        description: 'Liked a reply'
      });

      expect(activity.type).toBe(ActivityType.REPLY_LIKED);
    });
  });
});

// ============================================================================
// View Count Tests
// ============================================================================

describe('View Count', () => {
  it('should track topic view count', () => {
    const topic = createMockForumTopic({
      viewCount: 500
    });

    expect(topic.viewCount).toBe(500);
  });

  it('should handle topics with zero views', () => {
    const topic = createMockForumTopic({
      viewCount: 0
    });

    expect(topic.viewCount).toBe(0);
  });

  it('should support incrementing view count', () => {
    const topic = createMockForumTopic({ viewCount: 100 });
    const updatedTopic = {
      ...topic,
      viewCount: topic.viewCount + 1
    };

    expect(updatedTopic.viewCount).toBe(101);
  });

  it('should track total views in forum stats', () => {
    const stats = createMockForumStats({
      totalViews: 50000
    });

    expect(stats.totalViews).toBe(50000);
  });
});

// ============================================================================
// Reply Count Tests
// ============================================================================

describe('Reply Count', () => {
  it('should track topic reply count', () => {
    const topic = createMockForumTopic({
      replyCount: 25
    });

    expect(topic.replyCount).toBe(25);
  });

  it('should handle topics with no replies', () => {
    const topic = createMockForumTopic({
      replyCount: 0
    });

    expect(topic.replyCount).toBe(0);
  });

  it('should track category reply count', () => {
    const category = createMockForumCategory({
      replyCount: 500
    });

    expect(category.replyCount).toBe(500);
  });

  it('should track total replies in forum stats', () => {
    const stats = createMockForumStats({
      totalReplies: 10000
    });

    expect(stats.totalReplies).toBe(10000);
  });

  it('should track user total replies', () => {
    const profile = createMockUserForumProfile({
      totalReplies: 100
    });

    expect(profile.totalReplies).toBe(100);
  });
});

// ============================================================================
// Topic Count Tests
// ============================================================================

describe('Topic Count', () => {
  it('should track category topic count', () => {
    const category = createMockForumCategory({
      topicCount: 50
    });

    expect(category.topicCount).toBe(50);
  });

  it('should track total topics in forum stats', () => {
    const stats = createMockForumStats({
      totalTopics: 1000
    });

    expect(stats.totalTopics).toBe(1000);
  });

  it('should track user total topics', () => {
    const profile = createMockUserForumProfile({
      totalTopics: 25
    });

    expect(profile.totalTopics).toBe(25);
  });
});

// ============================================================================
// Last Activity Tracking Tests
// ============================================================================

describe('Last Activity Tracking', () => {
  describe('Topic Last Activity', () => {
    it('should track last reply timestamp', () => {
      const lastReplyDate = new Date('2024-01-20T14:30:00Z');
      const topic = createMockForumTopic({
        lastReplyAt: lastReplyDate,
        lastReplyBy: 'Jane Smith'
      });

      expect(topic.lastReplyAt).toEqual(lastReplyDate);
      expect(topic.lastReplyBy).toBe('Jane Smith');
    });

    it('should handle topics with no replies', () => {
      const topic = createMockForumTopic({
        lastReplyAt: undefined,
        lastReplyBy: undefined,
        replyCount: 0
      });

      expect(topic.lastReplyAt).toBeUndefined();
      expect(topic.lastReplyBy).toBeUndefined();
    });
  });

  describe('Category Last Activity', () => {
    it('should track last topic timestamp', () => {
      const lastTopicDate = new Date('2024-01-15T10:00:00Z');
      const category = createMockForumCategory({
        lastTopicAt: lastTopicDate,
        lastTopicBy: 'user-1'
      });

      expect(category.lastTopicAt).toEqual(lastTopicDate);
      expect(category.lastTopicBy).toBe('user-1');
    });
  });

  describe('User Last Activity', () => {
    it('should track user last active timestamp', () => {
      const lastActiveDate = new Date('2024-01-20T15:00:00Z');
      const profile = createMockUserForumProfile({
        lastActiveAt: lastActiveDate
      });

      expect(profile.lastActiveAt).toEqual(lastActiveDate);
    });
  });
});
