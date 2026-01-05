// Infrastructure Service - Visitor Management
// Service for managing church visitors and follow-up

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from 'config/firebase';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  ContactAttempt,
  VisitRecord,
  VisitorStats
} from '../../domain/entities/Visitor';

export interface VisitorFilters {
  status?: VisitorStatus;
  followUpStatus?: FollowUpStatus;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

class VisitorService {
  private collectionName = 'visitors';
  private visitsCollectionName = 'visitRecords';

  // Create a new visitor
  async createVisitor(visitorData: Omit<Visitor, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'contactAttempts'>): Promise<string> {
    try {
      const visitor: Omit<Visitor, 'id'> = {
        ...visitorData,
        totalVisits: 1,
        contactAttempts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Filter out undefined values and prepare data for Firestore
      const firestoreData: any = {
        name: visitor.name,
        status: visitor.status,
        followUpStatus: visitor.followUpStatus,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        totalVisits: visitor.totalVisits,
        contactAttempts: visitor.contactAttempts,
        interests: visitor.interests || [],
        isMember: visitor.isMember,
        createdBy: visitor.createdBy,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt)
      };

      // Only add optional fields if they have values
      if (visitor.email) firestoreData.email = visitor.email;
      if (visitor.phone) firestoreData.phone = visitor.phone;
      if (visitor.address) firestoreData.address = visitor.address;
      if (visitor.birthDate) firestoreData.birthDate = Timestamp.fromDate(visitor.birthDate);
      if (visitor.gender) firestoreData.gender = visitor.gender;
      if (visitor.maritalStatus) firestoreData.maritalStatus = visitor.maritalStatus;
      if (visitor.profession) firestoreData.profession = visitor.profession;
      if (visitor.howDidYouKnow) firestoreData.howDidYouKnow = visitor.howDidYouKnow;
      if (visitor.observations) firestoreData.observations = visitor.observations;
      if (visitor.lastVisitDate) firestoreData.lastVisitDate = Timestamp.fromDate(visitor.lastVisitDate);
      if (visitor.assignedTo) firestoreData.assignedTo = visitor.assignedTo;
      if (visitor.memberId) firestoreData.memberId = visitor.memberId;
      if (visitor.convertedToMemberAt) firestoreData.convertedToMemberAt = Timestamp.fromDate(visitor.convertedToMemberAt);

      const docRef = await addDoc(collection(db, this.collectionName), firestoreData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating visitor:', error);
      throw error;
    }
  }

  // Get visitor by ID
  async getVisitor(id: string): Promise<Visitor | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          firstVisitDate: data.firstVisitDate.toDate(),
          lastVisitDate: data.lastVisitDate?.toDate(),
          birthDate: data.birthDate?.toDate(),
          convertedToMemberAt: data.convertedToMemberAt?.toDate(),
          contactAttempts: data.contactAttempts?.map((attempt: any) => ({
            ...attempt,
            date: attempt.date.toDate(),
            nextContactDate: attempt.nextContactDate?.toDate()
          })) || []
        } as Visitor;
      }

      return null;
    } catch (error) {
      console.error('Error getting visitor:', error);
      throw error;
    }
  }

  // Get visitors with filters and pagination
  async getVisitors(
    filters: VisitorFilters = {},
    pageSize: number = 20,
    lastDoc?: any
  ): Promise<{ visitors: Visitor[]; hasMore: boolean; lastDoc: any }> {
    try {
      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.followUpStatus) {
        q = query(q, where('followUpStatus', '==', filters.followUpStatus));
      }

      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }

      if (filters.dateRange) {
        q = query(
          q,
          where('firstVisitDate', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('firstVisitDate', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      // Order by creation date (most recent first)
      q = query(q, orderBy('createdAt', 'desc'));

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(pageSize + 1));

      const querySnapshot = await getDocs(q);
      const visitors: Visitor[] = [];
      let hasMore = false;
      let newLastDoc = null;

      querySnapshot.docs.forEach((doc, index) => {
        if (index === pageSize) {
          hasMore = true;
          return;
        }

        const data = doc.data();
        const visitor: Visitor = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          firstVisitDate: data.firstVisitDate.toDate(),
          lastVisitDate: data.lastVisitDate?.toDate(),
          birthDate: data.birthDate?.toDate(),
          convertedToMemberAt: data.convertedToMemberAt?.toDate(),
          contactAttempts: data.contactAttempts?.map((attempt: any) => ({
            ...attempt,
            date: attempt.date.toDate(),
            nextContactDate: attempt.nextContactDate?.toDate()
          })) || []
        } as Visitor;

        // Apply text search filter (client-side for simplicity)
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          if (
            visitor.name.toLowerCase().includes(searchTerm) ||
            visitor.email?.toLowerCase().includes(searchTerm) ||
            visitor.phone?.includes(searchTerm)
          ) {
            visitors.push(visitor);
          }
        } else {
          visitors.push(visitor);
        }

        if (index === Math.min(pageSize - 1, querySnapshot.docs.length - 1)) {
          newLastDoc = doc;
        }
      });

      return { visitors, hasMore, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error getting visitors:', error);
      throw error;
    }
  }

  // Update visitor
  async updateVisitor(id: string, updates: Partial<Visitor>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData: any = {
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Handle specific fields with proper type checking
      if (updates.lastVisitDate && updates.lastVisitDate instanceof Date) {
        updateData.lastVisitDate = Timestamp.fromDate(updates.lastVisitDate);
      }
      if (updates.birthDate && updates.birthDate instanceof Date) {
        updateData.birthDate = Timestamp.fromDate(updates.birthDate);
      }
      if (updates.convertedToMemberAt && updates.convertedToMemberAt instanceof Date) {
        updateData.convertedToMemberAt = Timestamp.fromDate(updates.convertedToMemberAt);
      }
      if (updates.contactAttempts && Array.isArray(updates.contactAttempts)) {
        updateData.contactAttempts = updates.contactAttempts.map((attempt: ContactAttempt) => ({
          ...attempt,
          date: Timestamp.fromDate(attempt.date),
          nextContactDate: attempt.nextContactDate ? Timestamp.fromDate(attempt.nextContactDate) : null
        }));
      }

      // Handle other fields
      const fieldsToUpdate = ['name', 'email', 'phone', 'address', 'gender', 'maritalStatus', 
        'profession', 'howDidYouKnow', 'interests', 'observations', 'status', 'followUpStatus',
        'isMember', 'memberId', 'assignedTo', 'totalVisits'];

      fieldsToUpdate.forEach(field => {
        if (updates[field as keyof Visitor] !== undefined) {
          updateData[field] = updates[field as keyof Visitor];
        }
      });

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating visitor:', error);
      throw error;
    }
  }

  // Delete visitor
  async deleteVisitor(id: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete visitor
      const visitorRef = doc(db, this.collectionName, id);
      batch.delete(visitorRef);

      // Delete all visit records for this visitor
      const visitsQuery = query(
        collection(db, this.visitsCollectionName),
        where('visitorId', '==', id)
      );
      const visitsSnapshot = await getDocs(visitsQuery);
      
      visitsSnapshot.docs.forEach((visitDoc) => {
        batch.delete(visitDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      throw error;
    }
  }

  // Add contact attempt
  async addContactAttempt(visitorId: string, contactAttempt: Omit<ContactAttempt, 'id'>): Promise<void> {
    try {
      const visitor = await this.getVisitor(visitorId);
      if (!visitor) throw new Error('Visitor not found');

      const newAttempt: ContactAttempt = {
        ...contactAttempt,
        id: `contact_${Date.now()}`
      };

      const updatedAttempts = [...visitor.contactAttempts, newAttempt];
      
      await this.updateVisitor(visitorId, {
        contactAttempts: updatedAttempts,
        followUpStatus: contactAttempt.successful ? FollowUpStatus.COMPLETED : FollowUpStatus.IN_PROGRESS
      });
    } catch (error) {
      console.error('Error adding contact attempt:', error);
      throw error;
    }
  }

  // Record a visit
  async recordVisit(visitData: Omit<VisitRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Create visit record
      const visitRef = doc(collection(db, this.visitsCollectionName));
      const visit: Omit<VisitRecord, 'id'> = {
        ...visitData,
        createdAt: new Date()
      };

      batch.set(visitRef, {
        ...visit,
        visitDate: Timestamp.fromDate(visit.visitDate),
        createdAt: Timestamp.fromDate(visit.createdAt)
      });

      // Update visitor's visit count and last visit date
      const visitorRef = doc(db, this.collectionName, visitData.visitorId);
      batch.update(visitorRef, {
        totalVisits: increment(1),
        lastVisitDate: Timestamp.fromDate(visitData.visitDate),
        updatedAt: Timestamp.fromDate(new Date())
      });

      await batch.commit();
      return visitRef.id;
    } catch (error) {
      console.error('Error recording visit:', error);
      throw error;
    }
  }

  // Get visit history for a visitor
  async getVisitHistory(visitorId: string): Promise<VisitRecord[]> {
    try {
      // First try with orderBy (requires compound index)
      const qWithOrder = query(
        collection(db, this.visitsCollectionName),
        where('visitorId', '==', visitorId),
        orderBy('visitDate', 'desc')
      );

      const querySnapshot = await getDocs(qWithOrder);
      const visits: VisitRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        visits.push({
          id: doc.id,
          ...data,
          visitDate: data.visitDate.toDate(),
          createdAt: data.createdAt.toDate()
        } as VisitRecord);
      });

      return visits;
    } catch (error: any) {
      // Check if it's an index error
      const isIndexError = error?.message?.includes('index') || 
                          error?.code === 'failed-precondition';

      if (isIndexError) {
        console.warn('Firestore index missing for visit history, using client-side sorting');
        
        try {
          // Fallback: Query without orderBy and sort client-side
          const qFallback = query(
            collection(db, this.visitsCollectionName),
            where('visitorId', '==', visitorId)
          );

          const fallbackSnapshot = await getDocs(qFallback);
          const visits: VisitRecord[] = [];

          fallbackSnapshot.forEach((doc) => {
            const data = doc.data();
            visits.push({
              id: doc.id,
              ...data,
              visitDate: data.visitDate.toDate(),
              createdAt: data.createdAt.toDate()
            } as VisitRecord);
          });

          // Sort client-side by visitDate descending
          return visits.sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());
        } catch (fallbackError) {
          console.error('Error in fallback visit history query:', fallbackError);
          throw fallbackError;
        }
      } else {
        console.error('Error getting visit history:', error);
        throw error;
      }
    }
  }

  // Convert visitor to member
  async convertToMember(visitorId: string, memberId: string): Promise<void> {
    try {
      await this.updateVisitor(visitorId, {
        isMember: true,
        memberId,
        convertedToMemberAt: new Date(),
        status: VisitorStatus.CONVERTED,
        followUpStatus: FollowUpStatus.COMPLETED
      });
    } catch (error) {
      console.error('Error converting visitor to member:', error);
      throw error;
    }
  }

  // Get visitor statistics
  async getVisitorStats(): Promise<VisitorStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all visitors
      const allVisitorsQuery = query(collection(db, this.collectionName));
      const allVisitorsSnapshot = await getDocs(allVisitorsQuery);

      // Get new visitors this month
      const newThisMonthQuery = query(
        collection(db, this.collectionName),
        where('firstVisitDate', '>=', Timestamp.fromDate(startOfMonth))
      );
      const newThisMonthSnapshot = await getDocs(newThisMonthQuery);

      // Get active visitors
      const activeVisitorsQuery = query(
        collection(db, this.collectionName),
        where('status', '==', VisitorStatus.ACTIVE)
      );
      const activeVisitorsSnapshot = await getDocs(activeVisitorsQuery);

      // Get converted visitors
      const convertedQuery = query(
        collection(db, this.collectionName),
        where('status', '==', VisitorStatus.CONVERTED)
      );
      const convertedSnapshot = await getDocs(convertedQuery);

      // Get pending follow-up
      const pendingFollowUpQuery = query(
        collection(db, this.collectionName),
        where('followUpStatus', '==', FollowUpStatus.PENDING)
      );
      const pendingFollowUpSnapshot = await getDocs(pendingFollowUpQuery);

      // Calculate averages
      let totalVisits = 0;
      allVisitorsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalVisits += data.totalVisits || 0;
      });

      const totalVisitors = allVisitorsSnapshot.size;
      const averageVisitsPerVisitor = totalVisitors > 0 ? totalVisits / totalVisitors : 0;

      // Calculate retention rate (visitors with more than 1 visit)
      let retainedVisitors = 0;
      allVisitorsSnapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.totalVisits || 0) > 1) {
          retainedVisitors++;
        }
      });
      const retentionRate = totalVisitors > 0 ? (retainedVisitors / totalVisitors) * 100 : 0;

      // Calculate conversion rate
      const conversionRate = totalVisitors > 0 ? (convertedSnapshot.size / totalVisitors) * 100 : 0;

      return {
        totalVisitors,
        newThisMonth: newThisMonthSnapshot.size,
        activeVisitors: activeVisitorsSnapshot.size,
        convertedToMembers: convertedSnapshot.size,
        pendingFollowUp: pendingFollowUpSnapshot.size,
        averageVisitsPerVisitor: Math.round(averageVisitsPerVisitor * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting visitor stats:', error);
      throw error;
    }
  }
}

export const visitorService = new VisitorService();
