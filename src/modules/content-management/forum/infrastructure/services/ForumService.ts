// Infrastructure Service - Forum Service
// Handles all forum-related operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  ForumTopic,
  ForumReply,
  ForumCategory,
  ForumNotification,
  UserForumProfile,
  ForumStats,
  TopicStatus,
  ReplyStatus,
  NotificationType,
  ActivityType,
  ForumActivity
} from '../../domain/entities/Forum';

export interface ForumFilters {
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  status?: TopicStatus;
  searchTerm?: string;
  isPinned?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface TopicFilters extends ForumFilters {
  sortBy?: 'latest' | 'popular' | 'oldest' | 'most_replies';
}

class ForumService {
  private topicsCollection = collection(db, 'forumTopics');
  private repliesCollection = collection(db, 'forumReplies');
  private categoriesCollection = collection(db, 'forumCategories');
  private notificationsCollection = collection(db, 'forumNotifications');
  private profilesCollection = collection(db, 'userForumProfiles');
  private activitiesCollection = collection(db, 'forumActivities');

  // Topic CRUD Operations
  async createTopic(topic: Omit<ForumTopic, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'replyCount' | 'likes'>): Promise<string> {
    try {
      // Clean the category object to remove undefined fields
      const cleanCategory = {
        id: topic.category.id,
        name: topic.category.name,
        description: topic.category.description,
        slug: topic.category.slug,
        icon: topic.category.icon,
        color: topic.category.color,
        isActive: topic.category.isActive,
        requiresApproval: topic.category.requiresApproval,
        allowedRoles: topic.category.allowedRoles,
        topicCount: topic.category.topicCount || 0,
        replyCount: topic.category.replyCount || 0,
        ...(topic.category.lastTopicAt && { lastTopicAt: topic.category.lastTopicAt }),
        ...(topic.category.lastTopicBy && { lastTopicBy: topic.category.lastTopicBy }),
        moderators: topic.category.moderators || [],
        displayOrder: topic.category.displayOrder || 0,
        createdAt: topic.category.createdAt,
        updatedAt: topic.category.updatedAt
      };

      const docRef = await addDoc(this.topicsCollection, {
        ...topic,
        category: cleanCategory,
        viewCount: 0,
        replyCount: 0,
        likes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update category topic count
      await this.updateCategoryStats(topic.categoryId, 'topicCount', 1);

      // Create activity
      await this.createActivity({
        type: ActivityType.TOPIC_CREATED,
        userId: topic.authorId,
        userName: topic.authorName,
        topicId: docRef.id,
        topicTitle: topic.title,
        categoryId: topic.categoryId,
        categoryName: topic.category.name,
        description: `Created new topic: ${topic.title}`
      });

      console.log('Created forum topic:', topic.title);
      return docRef.id;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async updateTopic(id: string, updates: Partial<ForumTopic>): Promise<void> {
    try {
      const docRef = doc(this.topicsCollection, id);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      console.log('Updated topic:', id);
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  async deleteTopic(id: string): Promise<void> {
    try {
      // Get topic for category update
      const topicDoc = await this.getTopic(id);
      if (topicDoc) {
        // Update category topic count
        await this.updateCategoryStats(topicDoc.categoryId, 'topicCount', -1);
        
        // Delete all replies
        const repliesQuery = query(this.repliesCollection, where('topicId', '==', id));
        const repliesSnapshot = await getDocs(repliesQuery);
        
        for (const replyDoc of repliesSnapshot.docs) {
          await deleteDoc(replyDoc.ref);
        }
      }

      await deleteDoc(doc(this.topicsCollection, id));
      console.log('Deleted topic:', id);
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }

  async getTopic(id: string): Promise<ForumTopic | null> {
    try {
      const docSnap = await getDoc(doc(this.topicsCollection, id));
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastReplyAt: data.lastReplyAt?.toDate(),
        moderatedAt: data.moderatedAt?.toDate()
      } as ForumTopic;
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  }

  async getTopics(filters: TopicFilters = {}, pageSize: number = 20, lastDoc?: any): Promise<{ topics: ForumTopic[]; hasMore: boolean }> {
    try {
      let q = query(this.topicsCollection);

      // Apply filters
      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId));
      }

      if (filters.authorId) {
        q = query(q, where('authorId', '==', filters.authorId));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.isPinned !== undefined) {
        q = query(q, where('isPinned', '==', filters.isPinned));
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'latest';
      switch (sortBy) {
        case 'popular':
          q = query(q, orderBy('viewCount', 'desc'));
          break;
        case 'most_replies':
          q = query(q, orderBy('replyCount', 'desc'));
          break;
        case 'oldest':
          q = query(q, orderBy('createdAt', 'asc'));
          break;
        default:
          q = query(q, orderBy('updatedAt', 'desc'));
      }

      q = query(q, limit(pageSize + 1));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const topics = snapshot.docs.slice(0, pageSize).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastReplyAt: data.lastReplyAt?.toDate(),
          moderatedAt: data.moderatedAt?.toDate()
        } as ForumTopic;
      });

      return {
        topics,
        hasMore: snapshot.docs.length > pageSize
      };
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  async incrementViewCount(topicId: string): Promise<void> {
    try {
      const docRef = doc(this.topicsCollection, topicId);
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  async toggleTopicLike(topicId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.topicsCollection, topicId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error('Topic not found');
      
      const likes = docSnap.data().likes || [];
      const isLiked = likes.includes(userId);

      await updateDoc(docRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });

      // Create notification if liked
      if (!isLiked) {
        const topicData = docSnap.data() as ForumTopic;
        if (topicData.authorId !== userId) {
          await this.createNotification({
            userId: topicData.authorId,
            type: NotificationType.TOPIC_LIKED,
            topicId: topicId,
            triggeredBy: userId,
            triggeredByName: 'Someone', // Would need user name
            title: 'Topic Liked',
            message: `Someone liked your topic: ${topicData.title}`
          });
        }
      }
    } catch (error) {
      console.error('Error toggling topic like:', error);
      throw error;
    }
  }

  // Reply CRUD Operations
  async createReply(reply: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isAcceptedAnswer'>): Promise<string> {
    try {
      const docRef = await addDoc(this.repliesCollection, {
        ...reply,
        likes: [],
        isAcceptedAnswer: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update topic reply count and last reply
      const topicRef = doc(this.topicsCollection, reply.topicId);
      await updateDoc(topicRef, {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
        lastReplyBy: reply.authorName
      });

      // Update category reply count
      const topic = await this.getTopic(reply.topicId);
      if (topic) {
        await this.updateCategoryStats(topic.categoryId, 'replyCount', 1);
      }

      // Create activity
      await this.createActivity({
        type: ActivityType.REPLY_CREATED,
        userId: reply.authorId,
        userName: reply.authorName,
        topicId: reply.topicId,
        replyId: docRef.id,
        description: `Replied to topic`
      });

      console.log('Created reply for topic:', reply.topicId);
      return docRef.id;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  }

  async getReplies(topicId: string, pageSize: number = 20, lastDoc?: any): Promise<{ replies: ForumReply[]; hasMore: boolean }> {
    try {
      let q = query(
        this.repliesCollection,
        where('topicId', '==', topicId),
        orderBy('createdAt', 'asc'),
        limit(pageSize + 1)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const replies = snapshot.docs.slice(0, pageSize).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
          moderatedAt: data.moderatedAt?.toDate()
        } as ForumReply;
      });

      return {
        replies,
        hasMore: snapshot.docs.length > pageSize
      };
    } catch (error) {
      console.error('Error getting replies:', error);
      throw error;
    }
  }

  async toggleReplyLike(replyId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.repliesCollection, replyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error('Reply not found');
      
      const likes = docSnap.data().likes || [];
      const isLiked = likes.includes(userId);

      await updateDoc(docRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error toggling reply like:', error);
      throw error;
    }
  }

  // Category Management
  async createCategory(category: Omit<ForumCategory, 'id' | 'createdAt' | 'updatedAt' | 'topicCount' | 'replyCount'>): Promise<string> {
    try {
      const docRef = await addDoc(this.categoriesCollection, {
        ...category,
        topicCount: 0,
        replyCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Created forum category:', category.name);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async getCategories(activeOnly: boolean = true): Promise<ForumCategory[]> {
    try {
      let q = query(this.categoriesCollection, orderBy('displayOrder', 'asc'));
      
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastTopicAt: data.lastTopicAt?.toDate()
        } as ForumCategory;
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  private async updateCategoryStats(categoryId: string, field: 'topicCount' | 'replyCount', value: number): Promise<void> {
    try {
      const docRef = doc(this.categoriesCollection, categoryId);

      // Se estiver decrementando, verificar se não vai ficar negativo
      if (value < 0) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentValue = docSnap.data()[field] || 0;
          if (currentValue + value < 0) {
            // Não permitir valores negativos - apenas zera
            const updateData: any = {};
            updateData[field] = 0;
            await updateDoc(docRef, updateData);
            return;
          }
        }
      }

      const updateData: any = {};
      updateData[field] = increment(value);

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating category stats:', error);
    }
  }

  // Notifications
  async createNotification(notification: Omit<ForumNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    try {
      await addDoc(this.notificationsCollection, {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<ForumNotification[]> {
    try {
      let q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (unreadOnly) {
        q = query(q, where('isRead', '==', false));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as ForumNotification;
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Activities
  async createActivity(activity: Omit<ForumActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(this.activitiesCollection, {
        ...activity,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  }

  async getRecentActivities(limitCount: number = 10): Promise<ForumActivity[]> {
    try {
      const q = query(
        this.activitiesCollection,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ForumActivity;
      });
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw error;
    }
  }

  // Statistics
  async getForumStats(): Promise<ForumStats> {
    try {
      // Get topic count
      const topicsSnapshot = await getDocs(this.topicsCollection);
      const totalTopics = topicsSnapshot.size;

      // Get reply count
      const repliesSnapshot = await getDocs(this.repliesCollection);
      const totalReplies = repliesSnapshot.size;

      // Get user count
      const usersSnapshot = await getDocs(this.profilesCollection);
      const totalUsers = usersSnapshot.size;

      // Calculate total views
      const topics = topicsSnapshot.docs.map(doc => doc.data() as ForumTopic);
      const totalViews = topics.reduce((sum, topic) => sum + (topic.viewCount || 0), 0);

      // Get recent activities
      const recentActivity = await this.getRecentActivities(10);

      // Get popular topics (simplified) - convert Firestore Timestamps to Date
      const popularTopics = topicsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastReplyAt: data.lastReplyAt?.toDate(),
            moderatedAt: data.moderatedAt?.toDate()
          } as ForumTopic;
        })
        .filter(t => t.status === TopicStatus.PUBLISHED)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5);

      return {
        totalTopics,
        totalReplies,
        totalUsers,
        totalViews,
        activeUsers: 0, // Would need more complex query
        topContributors: [], // Would need more complex aggregation
        popularTopics,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting forum stats:', error);
      throw error;
    }
  }
}

export const forumService = new ForumService();
