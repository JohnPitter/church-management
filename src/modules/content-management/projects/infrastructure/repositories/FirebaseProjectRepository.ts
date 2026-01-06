// Data Repository Implementation - Firebase Project Repository
// Complete implementation for project data operations

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
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IProjectRepository } from '@modules/content-management/projects/domain/repositories/IProjectRepository';
import { Project, ProjectStatus, ProjectRegistration, RegistrationStatus } from '@modules/content-management/projects/domain/entities/Project';

export class FirebaseProjectRepository implements IProjectRepository {
  private readonly projectsCollection = 'projects';
  private readonly registrationsCollection = 'projectRegistrations';

  async findByName(name: string): Promise<Project | null> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('name', '==', name),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToProject(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding project by name:', error);
      throw new Error('Erro ao buscar projeto por nome');
    }
  }

  async findById(id: string): Promise<Project | null> {
    try {
      const docRef = doc(db, this.projectsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToProject(id, docSnap.data());
    } catch (error) {
      console.error('Error finding project by id:', error);
      throw new Error('Erro ao buscar projeto');
    }
  }

  async findAll(): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all projects:', error);
      throw new Error('Erro ao buscar projetos');
    }
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('status', '==', status),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding projects by status:', error);
      throw new Error('Erro ao buscar projetos por status');
    }
  }

  async findByCategory(category: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('category', '==', category),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding projects by category:', error);
      throw new Error('Erro ao buscar projetos por categoria');
    }
  }

  async findByResponsible(responsible: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('responsible', '==', responsible),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding projects by responsible:', error);
      throw new Error('Erro ao buscar projetos por responsável');
    }
  }

  async findActive(): Promise<Project[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.projectsCollection),
        where('status', '==', ProjectStatus.Active),
        where('startDate', '<=', Timestamp.fromDate(now)),
        where('endDate', '>=', Timestamp.fromDate(now)),
        orderBy('startDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding active projects:', error);
      throw new Error('Erro ao buscar projetos ativos');
    }
  }

  async findUpcoming(limit?: number): Promise<Project[]> {
    try {
      const now = new Date();
      let q = query(
        collection(db, this.projectsCollection),
        where('startDate', '>', Timestamp.fromDate(now)),
        where('status', 'in', [ProjectStatus.Planning, ProjectStatus.Active]),
        orderBy('startDate', 'asc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding upcoming projects:', error);
      throw new Error('Erro ao buscar próximos projetos');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('startDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProject(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding projects by date range:', error);
      throw new Error('Erro ao buscar projetos por período');
    }
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const projectData = {
        ...project,
        startDate: Timestamp.fromDate(project.startDate),
        endDate: Timestamp.fromDate(project.endDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.projectsCollection), projectData);
      
      return {
        id: docRef.id,
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Erro ao criar projeto');
    }
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.projectsCollection, id), updateData);

      const updatedProject = await this.findById(id);
      if (!updatedProject) {
        throw new Error('Projeto não encontrado após atualização');
      }

      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Erro ao atualizar projeto');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.projectsCollection, id));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Erro ao deletar projeto');
    }
  }

  async updateStatus(projectId: string, status: ProjectStatus): Promise<void> {
    try {
      await updateDoc(doc(db, this.projectsCollection, projectId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw new Error('Erro ao atualizar status do projeto');
    }
  }

  async cancelProject(projectId: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.projectsCollection, projectId), {
        status: ProjectStatus.Cancelled,
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error cancelling project:', error);
      throw new Error('Erro ao cancelar projeto');
    }
  }

  async completeProject(projectId: string, completedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.projectsCollection, projectId), {
        status: ProjectStatus.Completed,
        completedBy,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error completing project:', error);
      throw new Error('Erro ao finalizar projeto');
    }
  }

  // Registration methods
  async findRegistrations(projectId: string): Promise<ProjectRegistration[]> {
    try {
      // Temporarily simplify the query to avoid index issues
      const q = query(
        collection(db, this.registrationsCollection),
        where('projectId', '==', projectId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort manually in memory for now
      const registrations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate()
      } as ProjectRegistration));

      // Sort by registrationDate descending
      registrations.sort((a, b) => {
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      });

      return registrations;
    } catch (error) {
      console.error('Error finding project registrations:', error);
      
      // If still fails, provide fallback
      console.warn('Fallback: returning empty registrations array');
      return [];
    }
  }

  async findUserRegistrations(userId: string): Promise<ProjectRegistration[]> {
    try {
      const q = query(
        collection(db, this.registrationsCollection),
        where('userId', '==', userId),
        orderBy('registrationDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate()
      } as ProjectRegistration));
    } catch (error) {
      console.error('Error finding user registrations:', error);
      throw new Error('Erro ao buscar inscrições do usuário');
    }
  }

  async createRegistration(registration: Omit<ProjectRegistration, 'id' | 'registrationDate'>): Promise<ProjectRegistration> {
    try {
      const registrationData: any = {
        projectId: registration.projectId,
        userId: registration.userId,
        userName: registration.userName,
        status: registration.status,
        registrationDate: Timestamp.now()
      };

      // Only add optional fields if they are not undefined
      if (registration.approvedBy !== undefined) {
        registrationData.approvedBy = registration.approvedBy;
      }
      if (registration.approvedAt !== undefined) {
        registrationData.approvedAt = Timestamp.fromDate(registration.approvedAt);
      }
      if (registration.notes !== undefined) {
        registrationData.notes = registration.notes;
      }

      const docRef = await addDoc(collection(db, this.registrationsCollection), registrationData);
      
      return {
        id: docRef.id,
        projectId: registration.projectId,
        userId: registration.userId,
        userName: registration.userName,
        status: registration.status,
        registrationDate: new Date(),
        ...(registration.approvedBy && { approvedBy: registration.approvedBy }),
        ...(registration.approvedAt && { approvedAt: registration.approvedAt }),
        ...(registration.notes && { notes: registration.notes })
      };
    } catch (error) {
      console.error('Error registering user for project:', error);
      throw new Error('Erro ao inscrever usuário no projeto');
    }
  }

  async updateRegistrationStatus(registrationId: string, status: RegistrationStatus, approvedBy?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === RegistrationStatus.Approved && approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = Timestamp.now();
      }

      await updateDoc(doc(db, this.registrationsCollection, registrationId), updateData);
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw new Error('Erro ao atualizar status da inscrição');
    }
  }

  async deleteRegistration(registrationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.registrationsCollection, registrationId));
    } catch (error) {
      console.error('Error deleting registration:', error);
      throw new Error('Erro ao deletar inscrição');
    }
  }

  async countRegistrations(projectId: string, status?: RegistrationStatus): Promise<number> {
    try {
      let q = query(
        collection(db, this.registrationsCollection),
        where('projectId', '==', projectId)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting registrations:', error);
      throw new Error('Erro ao contar inscrições');
    }
  }

  async getProjectStats(projectId: string): Promise<{
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    completionPercentage: number;
  }> {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      const totalRegistrations = await this.countRegistrations(projectId);
      const approvedRegistrations = await this.countRegistrations(projectId, RegistrationStatus.Approved);
      const pendingRegistrations = await this.countRegistrations(projectId, RegistrationStatus.Pending);

      // Calculate completion percentage based on project dates
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
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw new Error('Erro ao obter estatísticas do projeto');
    }
  }

  private mapToProject(id: string, data: any): Project {
    return {
      id,
      name: data.name,
      description: data.description,
      objectives: data.objectives || [],
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      responsible: data.responsible,
      status: data.status as ProjectStatus,
      category: data.category,
      budget: data.budget,
      maxParticipants: data.maxParticipants,
      requiresApproval: data.requiresApproval || false,
      imageURL: data.imageURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }
}