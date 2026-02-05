// Infrastructure Service - Reports Service
// Service for generating reports with real Firebase data

import { 
  collection, 
  getDocs, 
  query, 
  where,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export interface ReportData {
  userGrowth: {
    month: string;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
  }[];
  eventStats: {
    totalEvents: number;
    avgAttendance: number;
    popularCategories: { name: string; count: number }[];
    monthlyEvents: { month: string; count: number }[];
  };
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    totalParticipants: number;
  };
  engagementStats: {
    blogViews: number;
    blogPosts: number;
    forumPosts: number;
    avgSessionTime: string;
  };
}

export class ReportsService {
  
  async generateReportData(periodMonths: number = 3): Promise<ReportData> {
    try {
      const [
        userGrowth,
        eventStats,
        projectStats,
        engagementStats
      ] = await Promise.all([
        this.getUserGrowthData(periodMonths),
        this.getEventStats(periodMonths),
        this.getProjectStats(),
        this.getEngagementStats()
      ]);

      return {
        userGrowth,
        eventStats,
        projectStats,
        engagementStats
      };
    } catch (error) {
      console.error('Error generating report data:', error);
      throw new Error('Erro ao gerar dados do relatório');
    }
  }

  private async getUserGrowthData(periodMonths: number) {
    const userGrowth = [];
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Total users up to end of month
      const totalUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '<=', Timestamp.fromDate(monthEnd))
      );
      const totalUsersSnap = await getCountFromServer(totalUsersQuery);
      
      // New users in this month
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', Timestamp.fromDate(monthStart)),
        where('createdAt', '<=', Timestamp.fromDate(monthEnd))
      );
      const newUsersSnap = await getCountFromServer(newUsersQuery);
      
      // Active users (those with recent activity - assume lastLoginAt exists)
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLoginAt', '>=', Timestamp.fromDate(monthStart)),
        where('lastLoginAt', '<=', Timestamp.fromDate(monthEnd))
      );
      const activeUsersSnap = await getCountFromServer(activeUsersQuery);
      
      userGrowth.push({
        month: format(monthDate, 'MMM/yy'),
        totalUsers: totalUsersSnap.data().count,
        newUsers: newUsersSnap.data().count,
        activeUsers: activeUsersSnap.data().count
      });
    }
    
    return userGrowth;
  }

  private async getEventStats(periodMonths: number) {
    const periodStart = startOfMonth(subMonths(new Date(), periodMonths - 1));
    
    // Total events
    const totalEventsQuery = query(
      collection(db, 'events'),
      where('date', '>=', Timestamp.fromDate(periodStart))
    );
    const totalEventsSnap = await getDocs(totalEventsQuery);
    const events = totalEventsSnap.docs.map(doc => doc.data());
    
    // Calculate average attendance
    const eventsWithAttendance = events.filter(event => event.maxParticipants);
    const avgAttendance = eventsWithAttendance.length > 0 
      ? Math.round(eventsWithAttendance.reduce((sum, event) => sum + (event.maxParticipants || 0), 0) / eventsWithAttendance.length)
      : 0;
    
    // Popular categories
    const categoryCount: { [key: string]: number } = {};
    events.forEach(event => {
      // Handle category as object or string
      let categoryName = 'Outros';
      if (event.category) {
        if (typeof event.category === 'string') {
          categoryName = event.category;
        } else if (event.category.name) {
          categoryName = event.category.name;
        }
      }
      
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });
    
    const popularCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Monthly events
    const monthlyEvents = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthlyQuery = query(
        collection(db, 'events'),
        where('date', '>=', Timestamp.fromDate(monthStart)),
        where('date', '<=', Timestamp.fromDate(monthEnd))
      );
      const monthlySnap = await getCountFromServer(monthlyQuery);
      
      monthlyEvents.push({
        month: format(monthDate, 'MMM/yy'),
        count: monthlySnap.data().count
      });
    }
    
    return {
      totalEvents: events.length,
      avgAttendance,
      popularCategories,
      monthlyEvents
    };
  }

  private async getProjectStats() {
    // Total projects
    const totalProjectsSnap = await getCountFromServer(collection(db, 'projects'));
    
    // Active projects
    const activeProjectsQuery = query(
      collection(db, 'projects'),
      where('status', '==', 'Em Andamento')
    );
    const activeProjectsSnap = await getCountFromServer(activeProjectsQuery);
    
    // Completed projects
    const completedProjectsQuery = query(
      collection(db, 'projects'),
      where('status', '==', 'Concluído')
    );
    const completedProjectsSnap = await getCountFromServer(completedProjectsQuery);
    
    // Get all projects for budget and participants calculation
    const allProjectsSnap = await getDocs(collection(db, 'projects'));
    const projects = allProjectsSnap.docs.map(doc => doc.data());
    
    const totalBudget = projects.reduce((sum, project) => {
      return sum + (project.budget || 0);
    }, 0);
    
    const totalParticipants = projects.reduce((sum, project) => {
      return sum + (project.participants?.length || 0);
    }, 0);
    
    return {
      totalProjects: totalProjectsSnap.data().count,
      activeProjects: activeProjectsSnap.data().count,
      completedProjects: completedProjectsSnap.data().count,
      totalBudget,
      totalParticipants
    };
  }

  private async getEngagementStats() {
    // Blog posts count
    const blogPostsSnap = await getCountFromServer(
      query(collection(db, 'blogPosts'), where('visibility', '==', 'public'))
    );
    
    // Get all blog posts for views calculation
    const allBlogPostsSnap = await getDocs(collection(db, 'blogPosts'));
    const blogPosts = allBlogPostsSnap.docs.map(doc => doc.data());
    
    const blogViews = blogPosts.reduce((sum, post) => {
      return sum + (post.views || 0);
    }, 0);
    
    // For now, we'll use placeholder values for forum posts and session time
    // These would need additional tracking implementation
    
    return {
      blogViews,
      blogPosts: blogPostsSnap.data().count,
      forumPosts: 0, // Placeholder - would need forum implementation
      avgSessionTime: 'N/A' // Placeholder - would need session tracking
    };
  }

  async exportReport(format: 'pdf' | 'excel', data: ReportData): Promise<Blob> {
    // This would implement actual PDF/Excel generation
    // For now, return a simple text representation
    const content = JSON.stringify(data, null, 2);
    return new Blob([content], { 
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel' 
    });
  }
}

export const reportsService = new ReportsService();