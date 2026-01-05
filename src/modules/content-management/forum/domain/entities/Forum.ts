// Domain Entity - Forum
// Represents forum discussions and topics for church community

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  category: ForumCategory;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  tags: string[];
  status: TopicStatus;
  priority: TopicPriority;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastReplyAt?: Date;
  lastReplyBy?: string;
  likes: string[]; // Array of user IDs who liked
  attachments: ForumAttachment[];
  createdAt: Date;
  updatedAt: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  parentReplyId?: string; // For threaded replies
  status: ReplyStatus;
  likes: string[]; // Array of user IDs who liked
  attachments: ForumAttachment[];
  isAcceptedAnswer: boolean;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  slug: string;
  parentId?: string; // For subcategories
  isActive: boolean;
  requiresApproval: boolean;
  allowedRoles: string[]; // Which user roles can post
  topicCount: number;
  replyCount: number;
  lastTopicAt?: Date;
  lastTopicBy?: string;
  moderators: string[]; // Array of user IDs who can moderate
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumAttachment {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ForumNotification {
  id: string;
  userId: string;
  type: NotificationType;
  topicId?: string;
  replyId?: string;
  triggeredBy: string;
  triggeredByName: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface UserForumProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  signature?: string;
  title?: string; // Custom title like "Helper", "Moderator"
  reputation: number;
  totalTopics: number;
  totalReplies: number;
  totalLikes: number;
  joinedAt: Date;
  lastActiveAt: Date;
  badges: ForumBadge[];
  preferences: ForumPreferences;
}

export interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: BadgeCriteria;
  earnedAt: Date;
}

export interface ForumPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  digestFrequency: DigestFrequency;
  subscribedCategories: string[];
  blockedUsers: string[];
}

export interface ForumStats {
  totalTopics: number;
  totalReplies: number;
  totalUsers: number;
  totalViews: number;
  activeUsers: number; // Last 30 days
  topContributors: UserContribution[];
  popularTopics: ForumTopic[];
  recentActivity: ForumActivity[];
}

export interface UserContribution {
  userId: string;
  userName: string;
  avatar?: string;
  topicCount: number;
  replyCount: number;
  totalLikes: number;
  reputation: number;
}

export interface ForumActivity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userAvatar?: string;
  topicId?: string;
  topicTitle?: string;
  replyId?: string;
  categoryId?: string;
  categoryName?: string;
  description: string;
  timestamp: Date;
}

// Enums
export enum TopicStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  SPAM = 'spam'
}

export enum TopicPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ReplyStatus {
  PUBLISHED = 'published',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EDITED = 'edited',
  SPAM = 'spam'
}

export enum NotificationType {
  NEW_REPLY = 'new_reply',
  NEW_TOPIC = 'new_topic',
  TOPIC_LIKED = 'topic_liked',
  REPLY_LIKED = 'reply_liked',
  MENTION = 'mention',
  TOPIC_APPROVED = 'topic_approved',
  TOPIC_REJECTED = 'topic_rejected',
  REPLY_APPROVED = 'reply_approved',
  REPLY_REJECTED = 'reply_rejected',
  MODERATOR_ACTION = 'moderator_action'
}

export enum ActivityType {
  TOPIC_CREATED = 'topic_created',
  REPLY_CREATED = 'reply_created',
  TOPIC_LIKED = 'topic_liked',
  REPLY_LIKED = 'reply_liked',
  TOPIC_PINNED = 'topic_pinned',
  TOPIC_LOCKED = 'topic_locked',
  USER_JOINED = 'user_joined',
  BADGE_EARNED = 'badge_earned'
}

export enum DigestFrequency {
  NEVER = 'never',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface BadgeCriteria {
  type: BadgeType;
  threshold: number;
  description: string;
}

export enum BadgeType {
  TOPICS_CREATED = 'topics_created',
  REPLIES_POSTED = 'replies_posted',
  LIKES_RECEIVED = 'likes_received',
  DAYS_ACTIVE = 'days_active',
  HELPFUL_REPLIES = 'helpful_replies',
  FIRST_TOPIC = 'first_topic',
  FIRST_REPLY = 'first_reply'
}
