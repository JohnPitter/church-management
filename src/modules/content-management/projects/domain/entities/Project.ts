// Domain Entity - Project
// Represents church projects with business rules

export interface Project {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  startDate: Date;
  endDate: Date;
  responsible: string;
  status: ProjectStatus;
  category: string;
  budget?: number;
  maxParticipants?: number;
  requiresApproval: boolean;
  imageURL?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum ProjectStatus {
  Planning = 'planning',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface ProjectRegistration {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  registrationDate: Date;
  status: RegistrationStatus;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

export enum RegistrationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn'
}

// Business Rules
export class ProjectEntity {
  static isActive(project: Project): boolean {
    return project.status === ProjectStatus.Active && 
           new Date() >= project.startDate && 
           new Date() <= project.endDate;
  }

  static isPast(project: Project): boolean {
    return new Date() > project.endDate;
  }

  static isFuture(project: Project): boolean {
    return new Date() < project.startDate;
  }

  static canRegister(project: Project, currentParticipants: number): boolean {
    if (project.status !== ProjectStatus.Active && project.status !== ProjectStatus.Planning) {
      return false;
    }

    if (this.isPast(project)) {
      return false;
    }

    if (project.maxParticipants && currentParticipants >= project.maxParticipants) {
      return false;
    }

    return true;
  }

  static getProgress(project: Project): number {
    if (this.isFuture(project)) return 0;
    if (this.isPast(project)) return 100;

    const totalDuration = project.endDate.getTime() - project.startDate.getTime();
    const elapsed = new Date().getTime() - project.startDate.getTime();
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  static getDaysRemaining(project: Project): number {
    if (this.isPast(project)) return 0;
    
    const today = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  static validateDates(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  }

  static validateBudget(budget?: number): boolean {
    if (!budget) return true;
    return budget > 0;
  }

  static getStatusColor(status: ProjectStatus): string {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.Planning]: 'yellow',
      [ProjectStatus.Active]: 'green',
      [ProjectStatus.Paused]: 'orange',
      [ProjectStatus.Completed]: 'blue',
      [ProjectStatus.Cancelled]: 'red'
    };
    return colors[status];
  }

  static canEditProject(project: Project, userId: string): boolean {
    return project.responsible === userId || project.createdBy === userId;
  }
}
