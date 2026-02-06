// Unit Tests - ProjectsService
// Comprehensive test coverage for project management operations

import { ProjectsService } from '../ProjectsService';
import { IProjectRepository } from '@modules/content-management/projects/domain/repositories/IProjectRepository';
import {
  Project,
  ProjectStatus,
  ProjectRegistration,
  RegistrationStatus
} from '@modules/content-management/projects/domain/entities/Project';

// Mock Firebase to prevent auth/invalid-api-key error in CI
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));
jest.mock('@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository');

// Mock repository
class MockProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map();
  private registrations: Map<string, ProjectRegistration> = new Map();
  private nextId = 1;
  private nextRegId = 1;

  // Helper to reset mock state
  reset() {
    this.projects.clear();
    this.registrations.clear();
    this.nextId = 1;
    this.nextRegId = 1;
  }

  // Helper to add mock data
  addMockProject(project: Partial<Project>): Project {
    const id = `project-${this.nextId++}`;
    const fullProject: Project = {
      id,
      name: project.name || 'Test Project',
      description: project.description || 'Test Description',
      objectives: project.objectives || ['Objective 1'],
      startDate: project.startDate || new Date('2024-01-01'),
      endDate: project.endDate || new Date('2024-12-31'),
      responsible: project.responsible || 'user-1',
      status: project.status || ProjectStatus.Planning,
      category: project.category || 'Community',
      budget: project.budget,
      maxParticipants: project.maxParticipants,
      requiresApproval: project.requiresApproval ?? false,
      imageURL: project.imageURL,
      createdAt: project.createdAt || new Date(),
      updatedAt: project.updatedAt || new Date(),
      createdBy: project.createdBy || 'user-1'
    };
    this.projects.set(id, fullProject);
    return fullProject;
  }

  addMockRegistration(registration: Partial<ProjectRegistration>): ProjectRegistration {
    const id = `reg-${this.nextRegId++}`;
    const fullRegistration: ProjectRegistration = {
      id,
      projectId: registration.projectId || 'project-1',
      userId: registration.userId || 'user-1',
      userName: registration.userName || 'Test User',
      registrationDate: registration.registrationDate || new Date(),
      status: registration.status || RegistrationStatus.Pending,
      approvedBy: registration.approvedBy,
      approvedAt: registration.approvedAt,
      notes: registration.notes
    };
    this.registrations.set(id, fullRegistration);
    return fullRegistration;
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async findByName(name: string): Promise<Project | null> {
    return Array.from(this.projects.values()).find(p => p.name === name) || null;
  }

  async findAll(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.status === status);
  }

  async findByResponsible(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.responsible === userId);
  }

  async findByCategory(category: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.category === category);
  }

  async findActive(): Promise<Project[]> {
    const now = new Date();
    return Array.from(this.projects.values()).filter(
      p => p.status === ProjectStatus.Active && p.startDate <= now && p.endDate >= now
    );
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      p => p.startDate >= startDate && p.startDate <= endDate
    );
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = `project-${this.nextId++}`;
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error('Project not found');
    }
    const updated = { ...project, ...data, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      project.status = status;
      project.updatedAt = new Date();
    }
  }

  async findRegistrations(projectId: string): Promise<ProjectRegistration[]> {
    return Array.from(this.registrations.values()).filter(r => r.projectId === projectId);
  }

  async findUserRegistrations(userId: string): Promise<ProjectRegistration[]> {
    return Array.from(this.registrations.values()).filter(r => r.userId === userId);
  }

  async createRegistration(
    registration: Omit<ProjectRegistration, 'id' | 'registrationDate'>
  ): Promise<ProjectRegistration> {
    const id = `reg-${this.nextRegId++}`;
    const newRegistration: ProjectRegistration = {
      ...registration,
      id,
      registrationDate: new Date()
    };
    this.registrations.set(id, newRegistration);
    return newRegistration;
  }

  async updateRegistrationStatus(
    registrationId: string,
    status: RegistrationStatus,
    approvedBy?: string
  ): Promise<void> {
    const registration = this.registrations.get(registrationId);
    if (registration) {
      registration.status = status;
      if (status === RegistrationStatus.Approved && approvedBy) {
        registration.approvedBy = approvedBy;
        registration.approvedAt = new Date();
      }
    }
  }

  async deleteRegistration(registrationId: string): Promise<void> {
    this.registrations.delete(registrationId);
  }

  async countRegistrations(projectId: string, status?: RegistrationStatus): Promise<number> {
    let regs = Array.from(this.registrations.values()).filter(r => r.projectId === projectId);
    if (status) {
      regs = regs.filter(r => r.status === status);
    }
    return regs.length;
  }

  async getProjectStats(projectId: string): Promise<{
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    completionPercentage: number;
  }> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const totalRegistrations = await this.countRegistrations(projectId);
    const approvedRegistrations = await this.countRegistrations(projectId, RegistrationStatus.Approved);
    const pendingRegistrations = await this.countRegistrations(projectId, RegistrationStatus.Pending);

    const now = new Date();
    const totalDuration = project.endDate.getTime() - project.startDate.getTime();
    const elapsed = Math.max(0, now.getTime() - project.startDate.getTime());
    const completionPercentage = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

    return {
      totalRegistrations,
      approvedRegistrations,
      pendingRegistrations,
      completionPercentage: Math.round(completionPercentage)
    };
  }
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockRepository: MockProjectRepository;

  beforeEach(() => {
    mockRepository = new MockProjectRepository();
    service = new ProjectsService(mockRepository);
  });

  afterEach(() => {
    mockRepository.reset();
  });

  describe('Project CRUD Operations', () => {
    describe('getAllProjects', () => {
      it('should return all projects', async () => {
        mockRepository.addMockProject({ name: 'Project 1' });
        mockRepository.addMockProject({ name: 'Project 2' });

        const projects = await service.getAllProjects();

        expect(projects).toHaveLength(2);
        expect(projects[0].name).toBe('Project 1');
        expect(projects[1].name).toBe('Project 2');
      });

      it('should return empty array when no projects exist', async () => {
        const projects = await service.getAllProjects();

        expect(projects).toHaveLength(0);
      });
    });

    describe('getProjectById', () => {
      it('should return project when found', async () => {
        const project = mockRepository.addMockProject({ name: 'Test Project' });

        const result = await service.getProjectById(project.id);

        expect(result).not.toBeNull();
        expect(result?.id).toBe(project.id);
        expect(result?.name).toBe('Test Project');
      });

      it('should return null when project not found', async () => {
        const result = await service.getProjectById('non-existent');

        expect(result).toBeNull();
      });

      it('should throw error when id is empty', async () => {
        await expect(service.getProjectById('')).rejects.toThrow('Project ID is required');
      });
    });

    describe('getProjectByName', () => {
      it('should return project when found by name', async () => {
        mockRepository.addMockProject({ name: 'Unique Project' });

        const result = await service.getProjectByName('Unique Project');

        expect(result).not.toBeNull();
        expect(result?.name).toBe('Unique Project');
      });

      it('should return null when project name not found', async () => {
        const result = await service.getProjectByName('Non-existent');

        expect(result).toBeNull();
      });

      it('should throw error when name is empty', async () => {
        await expect(service.getProjectByName('')).rejects.toThrow('Project name is required');
      });
    });

    describe('createProject', () => {
      it('should create a new project successfully', async () => {
        const projectData = {
          name: 'New Project',
          description: 'New Description',
          objectives: ['Goal 1', 'Goal 2'],
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          responsible: 'user-1',
          status: ProjectStatus.Planning,
          category: 'Community',
          requiresApproval: false,
          createdBy: 'user-1'
        };

        const result = await service.createProject(projectData);

        expect(result.id).toBeDefined();
        expect(result.name).toBe('New Project');
        expect(result.status).toBe(ProjectStatus.Planning);
      });

      it('should throw error when end date is before start date', async () => {
        const projectData = {
          name: 'Invalid Project',
          description: 'Test',
          objectives: [],
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
          responsible: 'user-1',
          status: ProjectStatus.Planning,
          category: 'Community',
          requiresApproval: false,
          createdBy: 'user-1'
        };

        await expect(service.createProject(projectData)).rejects.toThrow('End date must be after start date');
      });

      it('should throw error when budget is negative', async () => {
        const projectData = {
          name: 'Project with negative budget',
          description: 'Test',
          objectives: [],
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          responsible: 'user-1',
          status: ProjectStatus.Planning,
          category: 'Community',
          budget: -1000,
          requiresApproval: false,
          createdBy: 'user-1'
        };

        await expect(service.createProject(projectData)).rejects.toThrow('Budget must be a positive number');
      });

      it('should throw error when project name already exists', async () => {
        mockRepository.addMockProject({ name: 'Duplicate Project' });

        const projectData = {
          name: 'Duplicate Project',
          description: 'Test',
          objectives: [],
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          responsible: 'user-1',
          status: ProjectStatus.Planning,
          category: 'Community',
          requiresApproval: false,
          createdBy: 'user-1'
        };

        await expect(service.createProject(projectData)).rejects.toThrow('A project with this name already exists');
      });
    });

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const project = mockRepository.addMockProject({ name: 'Original Name' });

        const result = await service.updateProject(project.id, { name: 'Updated Name' });

        expect(result.name).toBe('Updated Name');
      });

      it('should throw error when project not found', async () => {
        await expect(service.updateProject('non-existent', { name: 'New Name' })).rejects.toThrow(
          'Project not found'
        );
      });

      it('should throw error when id is empty', async () => {
        await expect(service.updateProject('', { name: 'New Name' })).rejects.toThrow('Project ID is required');
      });

      it('should validate dates when updating', async () => {
        const project = mockRepository.addMockProject({});

        await expect(
          service.updateProject(project.id, {
            startDate: new Date('2024-12-31'),
            endDate: new Date('2024-01-01')
          })
        ).rejects.toThrow('End date must be after start date');
      });

      it('should throw error when updating to duplicate name', async () => {
        const project1 = mockRepository.addMockProject({ name: 'Project 1' });
        mockRepository.addMockProject({ name: 'Project 2' });

        await expect(service.updateProject(project1.id, { name: 'Project 2' })).rejects.toThrow(
          'A project with this name already exists'
        );
      });

      it('should allow updating with same name', async () => {
        const project = mockRepository.addMockProject({ name: 'Same Name' });

        const result = await service.updateProject(project.id, { name: 'Same Name', description: 'New desc' });

        expect(result.name).toBe('Same Name');
        expect(result.description).toBe('New desc');
      });
    });

    describe('deleteProject', () => {
      it('should delete project successfully', async () => {
        const project = mockRepository.addMockProject({});

        await service.deleteProject(project.id);

        const result = await service.getProjectById(project.id);
        expect(result).toBeNull();
      });

      it('should throw error when project not found', async () => {
        await expect(service.deleteProject('non-existent')).rejects.toThrow('Project not found');
      });

      it('should throw error when id is empty', async () => {
        await expect(service.deleteProject('')).rejects.toThrow('Project ID is required');
      });

      it('should throw error when project has registrations', async () => {
        const project = mockRepository.addMockProject({});
        mockRepository.addMockRegistration({ projectId: project.id });

        await expect(service.deleteProject(project.id)).rejects.toThrow(
          'Cannot delete project with existing registrations'
        );
      });
    });
  });

  describe('Status Management', () => {
    describe('updateProjectStatus', () => {
      it('should update project status', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Planning });

        await service.updateProjectStatus(project.id, ProjectStatus.Active);

        const updated = await service.getProjectById(project.id);
        expect(updated?.status).toBe(ProjectStatus.Active);
      });

      it('should throw error when project not found', async () => {
        await expect(service.updateProjectStatus('non-existent', ProjectStatus.Active)).rejects.toThrow(
          'Project not found'
        );
      });

      it('should throw error when id is empty', async () => {
        await expect(service.updateProjectStatus('', ProjectStatus.Active)).rejects.toThrow('Project ID is required');
      });
    });

    describe('pauseProject', () => {
      it('should pause an active project', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Active });

        await service.pauseProject(project.id);

        const updated = await service.getProjectById(project.id);
        expect(updated?.status).toBe(ProjectStatus.Paused);
      });
    });

    describe('resumeProject', () => {
      it('should resume a paused project', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Paused });

        await service.resumeProject(project.id);

        const updated = await service.getProjectById(project.id);
        expect(updated?.status).toBe(ProjectStatus.Active);
      });
    });

    describe('completeProject', () => {
      it('should complete a project', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Active });

        await service.completeProject(project.id, 'user-1');

        const updated = await service.getProjectById(project.id);
        expect(updated?.status).toBe(ProjectStatus.Completed);
      });

      it('should throw error when project not found', async () => {
        await expect(service.completeProject('non-existent', 'user-1')).rejects.toThrow('Project not found');
      });

      it('should throw error when required parameters are missing', async () => {
        await expect(service.completeProject('', 'user-1')).rejects.toThrow('Project ID and user ID are required');
        await expect(service.completeProject('project-1', '')).rejects.toThrow('Project ID and user ID are required');
      });
    });

    describe('cancelProject', () => {
      it('should cancel a project with reason', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Active });

        await service.cancelProject(project.id, 'Budget constraints', 'user-1');

        const updated = await service.getProjectById(project.id);
        expect(updated?.status).toBe(ProjectStatus.Cancelled);
      });

      it('should throw error when project not found', async () => {
        await expect(service.cancelProject('non-existent', 'reason', 'user-1')).rejects.toThrow('Project not found');
      });

      it('should throw error when required parameters are missing', async () => {
        await expect(service.cancelProject('', 'reason', 'user-1')).rejects.toThrow(
          'Project ID, reason, and user ID are required'
        );
      });
    });
  });

  describe('Filtering and Search', () => {
    describe('getProjectsByStatus', () => {
      it('should return projects by status', async () => {
        mockRepository.addMockProject({ status: ProjectStatus.Active });
        mockRepository.addMockProject({ status: ProjectStatus.Active });
        mockRepository.addMockProject({ status: ProjectStatus.Planning });

        const activeProjects = await service.getProjectsByStatus(ProjectStatus.Active);

        expect(activeProjects).toHaveLength(2);
        expect(activeProjects.every(p => p.status === ProjectStatus.Active)).toBe(true);
      });
    });

    describe('getProjectsByCategory', () => {
      it('should return projects by category', async () => {
        mockRepository.addMockProject({ category: 'Community' });
        mockRepository.addMockProject({ category: 'Community' });
        mockRepository.addMockProject({ category: 'Youth' });

        const communityProjects = await service.getProjectsByCategory('Community');

        expect(communityProjects).toHaveLength(2);
        expect(communityProjects.every(p => p.category === 'Community')).toBe(true);
      });

      it('should throw error when category is empty', async () => {
        await expect(service.getProjectsByCategory('')).rejects.toThrow('Category is required');
      });
    });

    describe('getProjectsByResponsible', () => {
      it('should return projects by responsible user', async () => {
        mockRepository.addMockProject({ responsible: 'user-1' });
        mockRepository.addMockProject({ responsible: 'user-1' });
        mockRepository.addMockProject({ responsible: 'user-2' });

        const userProjects = await service.getProjectsByResponsible('user-1');

        expect(userProjects).toHaveLength(2);
        expect(userProjects.every(p => p.responsible === 'user-1')).toBe(true);
      });

      it('should throw error when userId is empty', async () => {
        await expect(service.getProjectsByResponsible('')).rejects.toThrow('User ID is required');
      });
    });

    describe('getActiveProjects', () => {
      it('should return only active projects within date range', async () => {
        const now = new Date();
        const past = new Date(now.getTime() - 86400000);
        const future = new Date(now.getTime() + 86400000);

        mockRepository.addMockProject({
          status: ProjectStatus.Active,
          startDate: past,
          endDate: future
        });
        mockRepository.addMockProject({
          status: ProjectStatus.Planning,
          startDate: past,
          endDate: future
        });

        const activeProjects = await service.getActiveProjects();

        expect(activeProjects).toHaveLength(1);
        expect(activeProjects[0].status).toBe(ProjectStatus.Active);
      });
    });

    describe('getUpcomingProjects', () => {
      it('should return upcoming projects', async () => {
        const future = new Date(Date.now() + 86400000 * 30);

        mockRepository.addMockProject({
          startDate: future,
          endDate: new Date(future.getTime() + 86400000 * 30)
        });

        const upcomingProjects = await service.getUpcomingProjects();

        expect(upcomingProjects.length).toBeGreaterThan(0);
      });

      it('should limit results when limit is provided', async () => {
        const future = new Date(Date.now() + 86400000 * 30);

        for (let i = 0; i < 5; i++) {
          mockRepository.addMockProject({
            startDate: new Date(future.getTime() + i * 86400000),
            endDate: new Date(future.getTime() + (i + 30) * 86400000)
          });
        }

        const upcomingProjects = await service.getUpcomingProjects(2);

        expect(upcomingProjects).toHaveLength(2);
      });
    });

    describe('getProjectsByDateRange', () => {
      it('should return projects within date range', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-06-30');

        mockRepository.addMockProject({
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-05-01')
        });
        mockRepository.addMockProject({
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-08-01')
        });

        const projects = await service.getProjectsByDateRange(startDate, endDate);

        expect(projects).toHaveLength(1);
      });

      it('should throw error when dates are missing', async () => {
        await expect(service.getProjectsByDateRange(null as any, new Date())).rejects.toThrow(
          'Start date and end date are required'
        );
      });

      it('should throw error when end date is before start date', async () => {
        await expect(
          service.getProjectsByDateRange(new Date('2024-12-31'), new Date('2024-01-01'))
        ).rejects.toThrow('End date must be after start date');
      });
    });

    describe('filterProjects', () => {
      beforeEach(() => {
        mockRepository.addMockProject({
          name: 'Project Alpha',
          description: 'First project',
          status: ProjectStatus.Active,
          category: 'Community',
          responsible: 'user-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        });
        mockRepository.addMockProject({
          name: 'Project Beta',
          description: 'Second project',
          status: ProjectStatus.Planning,
          category: 'Youth',
          responsible: 'user-2',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-12-31')
        });
      });

      it('should filter by status', async () => {
        const projects = await service.filterProjects({ status: ProjectStatus.Active });

        expect(projects).toHaveLength(1);
        expect(projects[0].status).toBe(ProjectStatus.Active);
      });

      it('should filter by category', async () => {
        const projects = await service.filterProjects({ category: 'Youth' });

        expect(projects).toHaveLength(1);
        expect(projects[0].category).toBe('Youth');
      });

      it('should filter by responsible', async () => {
        const projects = await service.filterProjects({ responsible: 'user-1' });

        expect(projects).toHaveLength(1);
        expect(projects[0].responsible).toBe('user-1');
      });

      it('should filter by search query', async () => {
        const projects = await service.filterProjects({ searchQuery: 'alpha' });

        expect(projects).toHaveLength(1);
        expect(projects[0].name).toBe('Project Alpha');
      });

      it('should filter by multiple criteria', async () => {
        const projects = await service.filterProjects({
          status: ProjectStatus.Active,
          category: 'Community',
          searchQuery: 'alpha'
        });

        expect(projects).toHaveLength(1);
        expect(projects[0].name).toBe('Project Alpha');
      });
    });
  });

  describe('Registration Management', () => {
    describe('registerUserForProject', () => {
      it('should register user for project', async () => {
        const now = new Date();
        const future = new Date(now.getTime() + 86400000 * 30);

        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          requiresApproval: false,
          startDate: now,
          endDate: future
        });

        const registration = await service.registerUserForProject(project.id, 'user-1', 'John Doe');

        expect(registration.projectId).toBe(project.id);
        expect(registration.userId).toBe('user-1');
        expect(registration.status).toBe(RegistrationStatus.Approved);
      });

      it('should create pending registration when approval required', async () => {
        const now = new Date();
        const future = new Date(now.getTime() + 86400000 * 30);

        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          requiresApproval: true,
          startDate: now,
          endDate: future
        });

        const registration = await service.registerUserForProject(project.id, 'user-1', 'John Doe');

        expect(registration.status).toBe(RegistrationStatus.Pending);
      });

      it('should throw error when project not found', async () => {
        await expect(service.registerUserForProject('non-existent', 'user-1', 'John Doe')).rejects.toThrow(
          'Project not found'
        );
      });

      it('should throw error when required parameters are missing', async () => {
        await expect(service.registerUserForProject('', 'user-1', 'John Doe')).rejects.toThrow(
          'Project ID, user ID, and user name are required'
        );
      });

      it('should throw error when user already registered', async () => {
        const now = new Date();
        const future = new Date(now.getTime() + 86400000 * 30);

        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          startDate: now,
          endDate: future
        });
        mockRepository.addMockRegistration({ projectId: project.id, userId: 'user-1' });

        await expect(service.registerUserForProject(project.id, 'user-1', 'John Doe')).rejects.toThrow(
          'User is already registered for this project'
        );
      });

      it('should throw error when project is not accepting registrations', async () => {
        const project = mockRepository.addMockProject({ status: ProjectStatus.Completed });

        await expect(service.registerUserForProject(project.id, 'user-1', 'John Doe')).rejects.toThrow(
          'Project is not accepting registrations'
        );
      });

      it('should throw error when project is at max capacity', async () => {
        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          maxParticipants: 1
        });
        mockRepository.addMockRegistration({
          projectId: project.id,
          userId: 'user-2',
          status: RegistrationStatus.Approved
        });

        await expect(service.registerUserForProject(project.id, 'user-1', 'John Doe')).rejects.toThrow(
          'Project is not accepting registrations'
        );
      });
    });

    describe('approveRegistration', () => {
      it('should approve registration', async () => {
        const project = mockRepository.addMockProject({});
        const registration = mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Pending
        });

        await service.approveRegistration(registration.id, 'admin-1');

        const registrations = await service.getProjectRegistrations(project.id);
        expect(registrations[0].status).toBe(RegistrationStatus.Approved);
      });

      it('should throw error when required parameters are missing', async () => {
        await expect(service.approveRegistration('', 'admin-1')).rejects.toThrow(
          'Registration ID and approver ID are required'
        );
      });
    });

    describe('rejectRegistration', () => {
      it('should reject registration', async () => {
        const project = mockRepository.addMockProject({});
        const registration = mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Pending
        });

        await service.rejectRegistration(registration.id);

        const registrations = await service.getProjectRegistrations(project.id);
        expect(registrations[0].status).toBe(RegistrationStatus.Rejected);
      });

      it('should throw error when id is empty', async () => {
        await expect(service.rejectRegistration('')).rejects.toThrow('Registration ID is required');
      });
    });

    describe('withdrawRegistration', () => {
      it('should withdraw registration', async () => {
        const project = mockRepository.addMockProject({});
        const registration = mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Approved
        });

        await service.withdrawRegistration(registration.id);

        const registrations = await service.getProjectRegistrations(project.id);
        expect(registrations[0].status).toBe(RegistrationStatus.Withdrawn);
      });
    });

    describe('removeRegistration', () => {
      it('should remove registration', async () => {
        const project = mockRepository.addMockProject({});
        const registration = mockRepository.addMockRegistration({ projectId: project.id });

        await service.removeRegistration(registration.id);

        const registrations = await service.getProjectRegistrations(project.id);
        expect(registrations).toHaveLength(0);
      });

      it('should throw error when id is empty', async () => {
        await expect(service.removeRegistration('')).rejects.toThrow('Registration ID is required');
      });
    });

    describe('getProjectRegistrations', () => {
      it('should return all registrations for project', async () => {
        const project = mockRepository.addMockProject({});
        mockRepository.addMockRegistration({ projectId: project.id, userId: 'user-1' });
        mockRepository.addMockRegistration({ projectId: project.id, userId: 'user-2' });

        const registrations = await service.getProjectRegistrations(project.id);

        expect(registrations).toHaveLength(2);
      });

      it('should throw error when id is empty', async () => {
        await expect(service.getProjectRegistrations('')).rejects.toThrow('Project ID is required');
      });
    });

    describe('getUserRegistrations', () => {
      it('should return all registrations for user', async () => {
        const project1 = mockRepository.addMockProject({});
        const project2 = mockRepository.addMockProject({});
        mockRepository.addMockRegistration({ projectId: project1.id, userId: 'user-1' });
        mockRepository.addMockRegistration({ projectId: project2.id, userId: 'user-1' });

        const registrations = await service.getUserRegistrations('user-1');

        expect(registrations).toHaveLength(2);
      });

      it('should throw error when id is empty', async () => {
        await expect(service.getUserRegistrations('')).rejects.toThrow('User ID is required');
      });
    });

    describe('countProjectRegistrations', () => {
      it('should count all registrations', async () => {
        const project = mockRepository.addMockProject({});
        mockRepository.addMockRegistration({ projectId: project.id, status: RegistrationStatus.Approved });
        mockRepository.addMockRegistration({ projectId: project.id, status: RegistrationStatus.Pending });

        const count = await service.countProjectRegistrations(project.id);

        expect(count).toBe(2);
      });

      it('should count registrations by status', async () => {
        const project = mockRepository.addMockProject({});
        mockRepository.addMockRegistration({ projectId: project.id, status: RegistrationStatus.Approved });
        mockRepository.addMockRegistration({ projectId: project.id, status: RegistrationStatus.Pending });

        const count = await service.countProjectRegistrations(project.id, RegistrationStatus.Approved);

        expect(count).toBe(1);
      });
    });
  });

  describe('Statistics and Reporting', () => {
    describe('getProjectStatistics', () => {
      it('should return comprehensive statistics', async () => {
        mockRepository.addMockProject({ status: ProjectStatus.Active, budget: 5000 });
        mockRepository.addMockProject({ status: ProjectStatus.Active, budget: 3000 });
        mockRepository.addMockProject({ status: ProjectStatus.Planning, budget: 2000 });
        mockRepository.addMockProject({ status: ProjectStatus.Completed });
        mockRepository.addMockProject({ status: ProjectStatus.Cancelled });

        const stats = await service.getProjectStatistics();

        expect(stats.total).toBe(5);
        expect(stats.active).toBe(2);
        expect(stats.planning).toBe(1);
        expect(stats.completed).toBe(1);
        expect(stats.cancelled).toBe(1);
        expect(stats.totalBudget).toBe(10000);
      });
    });

    describe('getProjectStats', () => {
      it('should return project-specific stats', async () => {
        const project = mockRepository.addMockProject({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        });
        mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Approved
        });
        mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Pending
        });

        const stats = await service.getProjectStats(project.id);

        expect(stats.totalRegistrations).toBe(2);
        expect(stats.approvedRegistrations).toBe(1);
        expect(stats.pendingRegistrations).toBe(1);
        expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
      });

      it('should throw error when id is empty', async () => {
        await expect(service.getProjectStats('')).rejects.toThrow('Project ID is required');
      });
    });

    describe('getProjectProgress', () => {
      it('should calculate project progress', async () => {
        const project = mockRepository.addMockProject({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        });

        const progress = await service.getProjectProgress(project.id);

        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });
    });

    describe('getProjectDaysRemaining', () => {
      it('should calculate days remaining', async () => {
        const future = new Date(Date.now() + 86400000 * 10);
        const project = mockRepository.addMockProject({
          startDate: new Date(),
          endDate: future
        });

        const daysRemaining = await service.getProjectDaysRemaining(project.id);

        expect(daysRemaining).toBeGreaterThan(0);
      });
    });

    describe('canUserRegister', () => {
      it('should return true when user can register', async () => {
        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 30)
        });

        const canRegister = await service.canUserRegister(project.id);

        expect(canRegister).toBe(true);
      });

      it('should return false when project is at capacity', async () => {
        const project = mockRepository.addMockProject({
          status: ProjectStatus.Active,
          maxParticipants: 1,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 30)
        });
        mockRepository.addMockRegistration({
          projectId: project.id,
          status: RegistrationStatus.Approved
        });

        const canRegister = await service.canUserRegister(project.id);

        expect(canRegister).toBe(false);
      });

      it('should return false when project does not exist', async () => {
        const canRegister = await service.canUserRegister('non-existent');

        expect(canRegister).toBe(false);
      });
    });

    describe('exportProjects', () => {
      it('should export projects in correct format', async () => {
        mockRepository.addMockProject({
          name: 'Export Test',
          budget: 5000,
          maxParticipants: 50
        });

        const exported = await service.exportProjects();

        expect(exported).toHaveLength(1);
        expect(exported[0]).toHaveProperty('id');
        expect(exported[0]).toHaveProperty('name');
        expect(exported[0]).toHaveProperty('budget');
        expect(exported[0].name).toBe('Export Test');
      });
    });

    describe('generateReport', () => {
      beforeEach(() => {
        mockRepository.addMockProject({ status: ProjectStatus.Active });
        mockRepository.addMockProject({ status: ProjectStatus.Completed });
        mockRepository.addMockProject({ status: ProjectStatus.Planning });
      });

      it('should generate active projects report', async () => {
        const report = await service.generateReport('active');

        expect(report.type).toBe('active');
        expect(report.projects).toHaveLength(1);
        expect(report.count).toBe(1);
        expect(report.statistics).toBeDefined();
      });

      it('should generate completed projects report', async () => {
        const report = await service.generateReport('completed');

        expect(report.type).toBe('completed');
        expect(report.projects).toHaveLength(1);
      });

      it('should generate all projects report', async () => {
        const report = await service.generateReport('all');

        expect(report.type).toBe('all');
        expect(report.projects).toHaveLength(3);
        expect(report.count).toBe(3);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const errorRepository = {
        ...mockRepository,
        findById: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      const errorService = new ProjectsService(errorRepository as any);

      await expect(errorService.getProjectById('test-id')).rejects.toThrow('Database error');
    });

    it('should handle concurrent operations', async () => {
      const project = mockRepository.addMockProject({});

      const promises = [
        service.updateProject(project.id, { name: 'Update 1' }),
        service.updateProject(project.id, { description: 'Update 2' }),
        service.getProjectById(project.id)
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle empty results', async () => {
      const projects = await service.getProjectsByStatus(ProjectStatus.Active);
      const registrations = await service.getUserRegistrations('non-existent-user');

      expect(projects).toHaveLength(0);
      expect(registrations).toHaveLength(0);
    });

    it('should update project with valid budget of zero', async () => {
      const project = mockRepository.addMockProject({ budget: 1000 });

      const result = await service.updateProject(project.id, { budget: 0 });

      expect(result.budget).toBe(0);
    });

    it('should create project without optional budget', async () => {
      const projectData = {
        name: 'No Budget Project',
        description: 'Test',
        objectives: [],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        responsible: 'user-1',
        status: ProjectStatus.Planning,
        category: 'Community',
        requiresApproval: false,
        createdBy: 'user-1'
      };

      const result = await service.createProject(projectData);

      expect(result.budget).toBeUndefined();
    });

    it('should handle project without registrations when checking capacity', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000 * 30);

      const project = mockRepository.addMockProject({
        status: ProjectStatus.Planning,
        startDate: now,
        endDate: future,
        maxParticipants: 10
      });

      const canRegister = await service.canUserRegister(project.id);

      expect(canRegister).toBe(true);
    });

    it('should filter projects with start date boundary', async () => {
      const startDate = new Date('2024-01-01');
      mockRepository.addMockProject({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30')
      });

      const projects = await service.filterProjects({ startDate });

      expect(projects.length).toBeGreaterThan(0);
    });

    it('should filter projects with end date boundary', async () => {
      const endDate = new Date('2024-12-31');
      mockRepository.addMockProject({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30')
      });

      const projects = await service.filterProjects({ endDate });

      expect(projects.length).toBeGreaterThan(0);
    });

    it('should register user with notes', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000 * 30);

      const project = mockRepository.addMockProject({
        status: ProjectStatus.Active,
        startDate: now,
        endDate: future
      });

      const registration = await service.registerUserForProject(
        project.id,
        'user-1',
        'John Doe',
        'Special requirements'
      );

      expect(registration.notes).toBe('Special requirements');
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should update project with only end date', async () => {
      const project = mockRepository.addMockProject({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30')
      });

      const newEndDate = new Date('2024-12-31');
      const result = await service.updateProject(project.id, { endDate: newEndDate });

      expect(result.endDate).toEqual(newEndDate);
    });

    it('should update project with only start date', async () => {
      const project = mockRepository.addMockProject({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      const newStartDate = new Date('2024-02-01');
      const result = await service.updateProject(project.id, { startDate: newStartDate });

      expect(result.startDate).toEqual(newStartDate);
    });

    it('should export projects without budget or maxParticipants', async () => {
      mockRepository.addMockProject({
        name: 'Minimal Project',
        budget: undefined,
        maxParticipants: undefined
      });

      const exported = await service.exportProjects();

      expect(exported[0].budget).toBe(0);
      expect(exported[0].maxParticipants).toBe('Unlimited');
    });

    it('should generate planning projects report', async () => {
      mockRepository.addMockProject({ status: ProjectStatus.Planning });

      const report = await service.generateReport('planning');

      expect(report.type).toBe('planning');
      expect(report.projects.length).toBeGreaterThan(0);
    });

    it('should get project progress for project not found', async () => {
      await expect(service.getProjectProgress('non-existent')).rejects.toThrow('Project not found');
    });

    it('should get project days remaining for project not found', async () => {
      await expect(service.getProjectDaysRemaining('non-existent')).rejects.toThrow('Project not found');
    });
  });
});
