// Infrastructure Service - Devotional Service
// Handles all devotional-related operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  FieldValue,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Devotional,
  DevotionalCategory,
  DevotionalComment,
  UserDevotionalProgress,
  DevotionalPlan,
  UserPlanProgress,
  DevotionalCategoryType
} from '../../domain/entities/Devotional';

export interface DevotionalFilters {
  categoryId?: string;
  tags?: string[];
  author?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  isPublished?: boolean;
}

export interface DevotionalStats {
  totalDevotionals: number;
  publishedDevotionals: number;
  completedDevotionals: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  activePlans: number;
  topCategories: { category: DevotionalCategory; count: number }[];
  recentDevotionals: Devotional[];
}

class DevotionalService {
  private devotionalsCollection = collection(db, 'devotionals');
  private categoriesCollection = collection(db, 'devotionalCategories');
  private commentsCollection = collection(db, 'devotionalComments');
  private progressCollection = collection(db, 'userDevotionalProgress');
  private plansCollection = collection(db, 'devotionalPlans');
  private planProgressCollection = collection(db, 'userPlanProgress');

  // Devotional CRUD Operations
  async createDevotional(devotional: Omit<Devotional, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likes' | 'bookmarks'>): Promise<string> {
    try {
      const docRef = await addDoc(this.devotionalsCollection, {
        ...devotional,
        publishDate: Timestamp.fromDate(devotional.publishDate),
        viewCount: 0,
        likes: [],
        bookmarks: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Created devotional:', devotional.title);

      return docRef.id;
    } catch (error) {
      console.error('Error creating devotional:', error);
      throw error;
    }
  }

  async updateDevotional(id: string, updates: Partial<Devotional>): Promise<void> {
    try {
      const docRef = doc(this.devotionalsCollection, id);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.publishDate) {
        updateData.publishDate = Timestamp.fromDate(updates.publishDate);
      }

      await updateDoc(docRef, updateData);

      console.log('Updated devotional:', id);
    } catch (error) {
      console.error('Error updating devotional:', error);
      throw error;
    }
  }

  async deleteDevotional(id: string, userId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.devotionalsCollection, id));

      console.log('Deleted devotional:', id);
    } catch (error) {
      console.error('Error deleting devotional:', error);
      throw error;
    }
  }

  async getDevotional(id: string): Promise<Devotional | null> {
    try {
      const docSnap = await getDoc(doc(this.devotionalsCollection, id));
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        publishDate: data.publishDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Devotional;
    } catch (error) {
      console.error('Error getting devotional:', error);
      throw error;
    }
  }

  async getDevotionals(filters: DevotionalFilters = {}, pageSize: number = 10, lastDoc?: any): Promise<{ devotionals: Devotional[]; hasMore: boolean }> {
    try {
      let q = query(this.devotionalsCollection);

      // Simplified query to avoid index issues while building
      // Apply only one filter at a time to reduce index requirements
      if (filters.isPublished !== undefined) {
        q = query(q, where('isPublished', '==', filters.isPublished));
      } else if (filters.categoryId) {
        q = query(q, where('category.id', '==', filters.categoryId));
      } else if (filters.author) {
        q = query(q, where('author', '==', filters.author));
      } else if (filters.startDate && filters.endDate) {
        q = query(q, 
          where('publishDate', '>=', Timestamp.fromDate(filters.startDate)),
          where('publishDate', '<=', Timestamp.fromDate(filters.endDate))
        );
      }

      // Order and pagination
      q = query(q, orderBy('publishDate', 'desc'), limit(pageSize + 1));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const devotionals = snapshot.docs.slice(0, pageSize).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          publishDate: data.publishDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Devotional;
      });

      return {
        devotionals,
        hasMore: snapshot.docs.length > pageSize
      };
    } catch (error) {
      console.error('Error getting devotionals:', error);
      throw error;
    }
  }

  async getTodaysDevotional(): Promise<Devotional | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        this.devotionalsCollection,
        where('isPublished', '==', true),
        where('publishDate', '>=', Timestamp.fromDate(today)),
        where('publishDate', '<', Timestamp.fromDate(tomorrow)),
        orderBy('publishDate', 'asc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        publishDate: data.publishDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Devotional;
    } catch (error) {
      console.error('Error getting todays devotional:', error);
      throw error;
    }
  }

  // View and Engagement
  async incrementViewCount(devotionalId: string): Promise<void> {
    try {
      const docRef = doc(this.devotionalsCollection, devotionalId);
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  async toggleLike(devotionalId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.devotionalsCollection, devotionalId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error('Devotional not found');
      
      const likes = docSnap.data().likes || [];
      const isLiked = likes.includes(userId);

      await updateDoc(docRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async toggleBookmark(devotionalId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.devotionalsCollection, devotionalId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error('Devotional not found');
      
      const bookmarks = docSnap.data().bookmarks || [];
      const isBookmarked = bookmarks.includes(userId);

      await updateDoc(docRef, {
        bookmarks: isBookmarked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  // Categories
  async createCategory(category: Omit<DevotionalCategory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.categoriesCollection, category);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async getCategories(): Promise<DevotionalCategory[]> {
    try {
      const snapshot = await getDocs(
        query(this.categoriesCollection, where('isActive', '==', true))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DevotionalCategory));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Comments
  async createComment(comment: Omit<DevotionalComment, 'id' | 'createdAt' | 'updatedAt' | 'isApproved'>): Promise<string> {
    try {
      const docRef = await addDoc(this.commentsCollection, {
        ...comment,
        isApproved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async getComments(devotionalId: string, approvedOnly: boolean = true): Promise<DevotionalComment[]> {
    try {
      let q = query(
        this.commentsCollection,
        where('devotionalId', '==', devotionalId)
      );

      if (approvedOnly) {
        q = query(q, where('isApproved', '==', true));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DevotionalComment;
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async approveComment(commentId: string): Promise<void> {
    try {
      await updateDoc(doc(this.commentsCollection, commentId), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error approving comment:', error);
      throw error;
    }
  }

  // User Progress
  async markAsRead(devotionalId: string, userId: string, notes?: string): Promise<void> {
    console.log('DevotionalService.markAsRead called', { devotionalId, userId, notes });
    try {
      const progressId = `${userId}_${devotionalId}`;
      console.log('Progress ID:', progressId);
      const docRef = doc(this.progressCollection, progressId);

      console.log('Attempting updateDoc...');
      await updateDoc(docRef, {
        userId,
        devotionalId,
        isRead: true,
        readAt: serverTimestamp(),
        notes: notes || '',
        updatedAt: serverTimestamp()
      }).catch(async (updateError) => {
        console.log('UpdateDoc failed, creating new document:', updateError);
        // If document doesn't exist, create it
        const progressId = `${userId}_${devotionalId}`;
        console.log('Creating new progress document with ID:', progressId);
        await setDoc(doc(this.progressCollection, progressId), {
          userId,
          devotionalId,
          isRead: true,
          readAt: serverTimestamp(),
          notes: notes || '',
          isFavorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('New progress document created successfully');
      });
      console.log('markAsRead completed successfully');
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string, devotionalId: string): Promise<UserDevotionalProgress | null> {
    try {
      const progressId = `${userId}_${devotionalId}`;
      const docSnap = await getDoc(doc(this.progressCollection, progressId));
      
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        readAt: data.readAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserDevotionalProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(): Promise<DevotionalStats> {
    try {
      // Get all devotionals for stats
      const allDevotionals = await getDocs(this.devotionalsCollection);
      const devotionals = allDevotionals.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          publishDate: data.publishDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Devotional;
      });

      // Calculate stats
      const totalDevotionals = devotionals.length;
      const publishedDevotionals = devotionals.filter(d => d.isPublished).length;
      const totalViews = devotionals.reduce((sum, d) => sum + d.viewCount, 0);
      const totalLikes = devotionals.reduce((sum, d) => sum + d.likes.length, 0);

      // Get comments count
      const commentsSnapshot = await getDocs(this.commentsCollection);
      const totalComments = commentsSnapshot.size;

      // Get active plans
      const plansSnapshot = await getDocs(
        query(this.plansCollection, where('isActive', '==', true))
      );
      const activePlans = plansSnapshot.size;

      // Get completed devotionals count (total progress records with isRead: true)
      const progressSnapshot = await getDocs(
        query(this.progressCollection, where('isRead', '==', true))
      );
      const completedDevotionals = progressSnapshot.size;

      // Calculate top categories
      const categoryCount = new Map<string, { category: DevotionalCategory; count: number }>();
      devotionals.forEach(d => {
        const catId = d.category.id;
        if (categoryCount.has(catId)) {
          categoryCount.get(catId)!.count++;
        } else {
          categoryCount.set(catId, { category: d.category, count: 1 });
        }
      });

      const topCategories = Array.from(categoryCount.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent devotionals
      const recentDevotionals = devotionals
        .filter(d => d.isPublished)
        .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
        .slice(0, 5);

      return {
        totalDevotionals,
        publishedDevotionals,
        completedDevotionals,
        totalViews,
        totalLikes,
        totalComments,
        activePlans,
        topCategories,
        recentDevotionals
      };
    } catch (error) {
      console.error('Error getting devotional stats:', error);
      throw error;
    }
  }

  // Plans
  async createPlan(plan: Omit<DevotionalPlan, 'id' | 'createdAt' | 'updatedAt' | 'subscribers'>): Promise<string> {
    try {
      const docRef = await addDoc(this.plansCollection, {
        ...plan,
        subscribers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async subscribeToPlan(planId: string, userId: string): Promise<void> {
    try {
      // Update plan subscribers
      await updateDoc(doc(this.plansCollection, planId), {
        subscribers: arrayUnion(userId)
      });

      // Create user progress
      const planProgressId = `${userId}_${planId}`;
      await setDoc(doc(this.planProgressCollection, planProgressId), {
        userId,
        planId,
        startDate: serverTimestamp(),
        currentDay: 1,
        completedDevotionals: [],
        isCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  }

  async getPlans(activeOnly: boolean = true): Promise<DevotionalPlan[]> {
    try {
      let q = query(this.plansCollection);
      
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
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DevotionalPlan;
      });
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  }
}

export const devotionalService = new DevotionalService();
