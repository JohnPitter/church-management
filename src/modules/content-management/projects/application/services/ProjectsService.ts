// Application Service - Projects Service
// Service layer for project-related operations

import {
  Project,
  ProjectStatus,
  ProjectRegistration,
  RegistrationStatus,
  ProjectEntity
} from '@modules/content-management/projects/domain/entities/Project';
import { IProjectRepository } from '@modules/content-management/projects/domain/repositories/IProjectRepository';
import { FirebaseProjectRepository } from '@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository';

export interface ProjectStatistics {
  total: number;
  active: number;
  planning: number;
  completed: number;
  cancelled: number;
  paused: number;
  totalBudget: number;
  totalParticipants: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  category?: string;
  responsible?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export class ProjectsService {
  private projectRepository: IProjectRepository;

  constructor(repository?: IProjectRepository) {
    this.projectRepository = repository || new FirebaseProjectRepository();
  }

  // Project CRUD operations
  async getAllProjects(): Promise<Project[]> {
    return await this.projectRepository.findAll();
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (!id) {
      throw new Error('Project ID is required');
    }
    return await this.projectRepository.findById(id);
  }

  async getProjectByName(name: string): Promise<Project | null> {
    if (!name) {
      throw new Error('Project name is required');
    }
    return await this.projectRepository.findByName(name);
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    // Validate dates
    if (!ProjectEntity.validateDates(projectData.startDate, projectData.endDate)) {
      throw new Error('End date must be after start date');
    }

    // Validate budget if provided
    if (projectData.budget !== undefined && !ProjectEntity.validateBudget(projectData.budget)) {
      throw new Error('Budget must be a positive number');
    }

    // Check for duplicate name
    const existingProject = await this.projectRepository.findByName(projectData.name);
    if (existingProject) {
      throw new Error('A project with this name already exists');
    }

    return await this.projectRepository.create(projectData);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    const existingProject = await this.projectRepository.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Validate dates if both are being updated
    if (updates.startDate || updates.endDate) {
      const startDate = updates.startDate || existingProject.startDate;
      const endDate = updates.endDate || existingProject.endDate;

      if (!ProjectEntity.validateDates(startDate, endDate)) {
        throw new Error('End date must be after start date');
      }
    }

    // Validate budget if provided
    if (updates.budget !== undefined && !ProjectEntity.validateBudget(updates.budget)) {
      throw new Error('Budget must be a positive number');
    }

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== existingProject.name) {
      const duplicateProject = await this.projectRepository.findByName(updates.name);
      if (duplicateProject) {
        throw new Error('A project with this name already exists');
      }
    }

    return await this.projectRepository.update(id, updates);
  }

  async deleteProject(id: string): Promise<void> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if project has registrations
    const registrations = await this.projectRepository.findRegistrations(id);
    if (registrations.length > 0) {
      throw new Error('Cannot delete project with existing registrations');
    }

    return await this.projectRepository.delete(id);
  }

  // Status management
  async updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    return await this.projectRepository.updateStatus(id, status);
  }

  async pauseProject(id: string): Promise<void> {
    return await this.updateProjectStatus(id, ProjectStatus.Paused);
  }

  async resumeProject(id: string): Promise<void> {
    return await this.updateProjectStatus(id, ProjectStatus.Active);
  }

  async completeProject(id: string, completedBy: string): Promise<void> {
    if (!id || !completedBy) {
      throw new Error('Project ID and user ID are required');
    }

    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Use repository's specific complete method if available
    if ('completeProject' in this.projectRepository) {
      return await (this.projectRepository as any).completeProject(id, completedBy);
    }

    return await this.updateProjectStatus(id, ProjectStatus.Completed);
  }

  async cancelProject(id: string, reason: string, cancelledBy: string): Promise<void> {
    if (!id || !reason || !cancelledBy) {
      throw new Error('Project ID, reason, and user ID are required');
    }

    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Use repository's specific cancel method if available
    if ('cancelProject' in this.projectRepository) {
      return await (this.projectRepository as any).cancelProject(id, reason, cancelledBy);
    }

    return await this.updateProjectStatus(id, ProjectStatus.Cancelled);
  }

  // Filtering and search
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    return await this.projectRepository.findByStatus(status);
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    if (!category) {
      throw new Error('Category is required');
    }
    return await this.projectRepository.findByCategory(category);
  }

  async getProjectsByResponsible(userId: string): Promise<Project[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return await this.projectRepository.findByResponsible(userId);
  }

  async getActiveProjects(): Promise<Project[]> {
    return await this.projectRepository.findActive();
  }

  async getUpcomingProjects(limit?: number): Promise<Project[]> {
    // Use repository's specific upcoming method if available
    if ('findUpcoming' in this.projectRepository) {
      return await (this.projectRepository as any).findUpcoming(limit);
    }

    // Fallback: filter all projects
    const allProjects = await this.projectRepository.findAll();
    const now = new Date();
    const upcoming = allProjects
      .filter(p => p.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  async getProjectsByDateRange(startDate: Date, endDate: Date): Promise<Project[]> {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }

    return await this.projectRepository.findByDateRange(startDate, endDate);
  }

  async filterProjects(filters: ProjectFilters): Promise<Project[]> {
    let projects = await this.projectRepository.findAll();

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      projects = projects.filter(p => p.category === filters.category);
    }

    if (filters.responsible) {
      projects = projects.filter(p => p.responsible === filters.responsible);
    }

    if (filters.startDate) {
      projects = projects.filter(p => p.startDate >= filters.startDate!);
    }

    if (filters.endDate) {
      projects = projects.filter(p => p.endDate <= filters.endDate!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    return projects;
  }

  // Registration management
  async registerUserForProject(
    projectId: string,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<ProjectRegistration> {
    if (!projectId || !userId || !userName) {
      throw new Error('Project ID, user ID, and user name are required');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if project allows registrations
    const registrationsCount = await this.projectRepository.countRegistrations(
      projectId,
      RegistrationStatus.Approved
    );

    if (!ProjectEntity.canRegister(project, registrationsCount)) {
      throw new Error('Project is not accepting registrations');
    }

    // Check for existing registration
    const userRegistrations = await this.projectRepository.findUserRegistrations(userId);
    const existingRegistration = userRegistrations.find(r => r.projectId === projectId);

    if (existingRegistration) {
      throw new Error('User is already registered for this project');
    }

    const registrationData = {
      projectId,
      userId,
      userName,
      status: project.requiresApproval ? RegistrationStatus.Pending : RegistrationStatus.Approved,
      notes
    };

    return await this.projectRepository.createRegistration(registrationData);
  }

  async approveRegistration(registrationId: string, approvedBy: string): Promise<void> {
    if (!registrationId || !approvedBy) {
      throw new Error('Registration ID and approver ID are required');
    }

    return await this.projectRepository.updateRegistrationStatus(
      registrationId,
      RegistrationStatus.Approved,
      approvedBy
    );
  }

  async rejectRegistration(registrationId: string): Promise<void> {
    if (!registrationId) {
      throw new Error('Registration ID is required');
    }

    return await this.projectRepository.updateRegistrationStatus(
      registrationId,
      RegistrationStatus.Rejected
    );
  }

  async withdrawRegistration(registrationId: string): Promise<void> {
    if (!registrationId) {
      throw new Error('Registration ID is required');
    }

    return await this.projectRepository.updateRegistrationStatus(
      registrationId,
      RegistrationStatus.Withdrawn
    );
  }

  async removeRegistration(registrationId: string): Promise<void> {
    if (!registrationId) {
      throw new Error('Registration ID is required');
    }

    return await this.projectRepository.deleteRegistration(registrationId);
  }

  async getProjectRegistrations(projectId: string): Promise<ProjectRegistration[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.projectRepository.findRegistrations(projectId);
  }

  async getUserRegistrations(userId: string): Promise<ProjectRegistration[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.projectRepository.findUserRegistrations(userId);
  }

  async countProjectRegistrations(projectId: string, status?: RegistrationStatus): Promise<number> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.projectRepository.countRegistrations(projectId, status);
  }

  // Statistics and reporting
  async getProjectStatistics(): Promise<ProjectStatistics> {
    const [allProjects, activeProjects, planningProjects, completedProjects, cancelledProjects, pausedProjects] =
      await Promise.all([
        this.projectRepository.findAll(),
        this.projectRepository.findByStatus(ProjectStatus.Active),
        this.projectRepository.findByStatus(ProjectStatus.Planning),
        this.projectRepository.findByStatus(ProjectStatus.Completed),
        this.projectRepository.findByStatus(ProjectStatus.Cancelled),
        this.projectRepository.findByStatus(ProjectStatus.Paused)
      ]);

    const totalBudget = allProjects.reduce((sum, project) => sum + (project.budget || 0), 0);

    // Calculate total participants across all projects
    const participantCounts = await Promise.all(
      allProjects.map(p => this.projectRepository.countRegistrations(p.id, RegistrationStatus.Approved))
    );
    const totalParticipants = participantCounts.reduce((sum, count) => sum + count, 0);

    return {
      total: allProjects.length,
      active: activeProjects.length,
      planning: planningProjects.length,
      completed: completedProjects.length,
      cancelled: cancelledProjects.length,
      paused: pausedProjects.length,
      totalBudget,
      totalParticipants
    };
  }

  async getProjectStats(projectId: string): Promise<{
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    completionPercentage: number;
  }> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.projectRepository.getProjectStats(projectId);
  }

  // Utility methods
  async getProjectProgress(projectId: string): Promise<number> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return ProjectEntity.getProgress(project);
  }

  async getProjectDaysRemaining(projectId: string): Promise<number> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return ProjectEntity.getDaysRemaining(project);
  }

  async canUserRegister(projectId: string): Promise<boolean> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      return false;
    }

    const registrationsCount = await this.projectRepository.countRegistrations(
      projectId,
      RegistrationStatus.Approved
    );

    return ProjectEntity.canRegister(project, registrationsCount);
  }

  async exportProjects(): Promise<any[]> {
    const projects = await this.getAllProjects();

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category,
      responsible: project.responsible,
      startDate: project.startDate.toLocaleDateString(),
      endDate: project.endDate.toLocaleDateString(),
      budget: project.budget || 0,
      maxParticipants: project.maxParticipants || 'Unlimited',
      requiresApproval: project.requiresApproval ? 'Yes' : 'No',
      createdAt: project.createdAt.toLocaleDateString()
    }));
  }

  async generateReport(type: 'active' | 'completed' | 'planning' | 'all' = 'all'): Promise<any> {
    const statistics = await this.getProjectStatistics();

    let projects: Project[] = [];
    switch (type) {
      case 'active':
        projects = await this.getProjectsByStatus(ProjectStatus.Active);
        break;
      case 'completed':
        projects = await this.getProjectsByStatus(ProjectStatus.Completed);
        break;
      case 'planning':
        projects = await this.getProjectsByStatus(ProjectStatus.Planning);
        break;
      default:
        projects = await this.getAllProjects();
        break;
    }

    return {
      type,
      generatedAt: new Date(),
      statistics,
      projects,
      count: projects.length
    };
  }
}

export const projectsService = new ProjectsService();
