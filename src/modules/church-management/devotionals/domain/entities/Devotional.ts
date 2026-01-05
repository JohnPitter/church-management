// Domain Entity - Devotional
// Represents daily devotionals for church members

export interface Devotional {
  id: string;
  title: string;
  content: string;
  bibleVerse: string;
  bibleReference: string;
  reflection: string;
  prayer: string;
  author: string;
  publishDate: Date;
  category: DevotionalCategory;
  tags: string[];
  imageUrl?: string;
  audioUrl?: string;
  readingTime: number; // in minutes
  isPublished: boolean;
  viewCount: number;
  likes: string[]; // Array of user IDs who liked
  bookmarks: string[]; // Array of user IDs who bookmarked
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DevotionalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export enum DevotionalCategoryType {
  FAITH = 'faith',
  PRAYER = 'prayer',
  WORSHIP = 'worship',
  LOVE = 'love',
  HOPE = 'hope',
  GRATITUDE = 'gratitude',
  WISDOM = 'wisdom',
  COURAGE = 'courage',
  PEACE = 'peace',
  JOY = 'joy',
  FORGIVENESS = 'forgiveness',
  FAMILY = 'family',
  SERVICE = 'service',
  SPIRITUAL_GROWTH = 'spiritual_growth'
}

export interface DevotionalComment {
  id: string;
  devotionalId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDevotionalProgress {
  id: string;
  userId: string;
  devotionalId: string;
  isRead: boolean;
  readAt?: Date;
  notes?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevotionalPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  devotionals: string[]; // Array of devotional IDs in order
  category: DevotionalCategory;
  targetAudience: string;
  imageUrl?: string;
  isActive: boolean;
  subscribers: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UserPlanProgress {
  id: string;
  userId: string;
  planId: string;
  startDate: Date;
  currentDay: number;
  completedDevotionals: string[]; // Array of completed devotional IDs
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
