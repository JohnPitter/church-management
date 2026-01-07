// Presentation Page - Admin Projects Management
// Administrative interface for managing projects and participants

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { format } from 'date-fns';
import { FirebaseProjectRepository } from '@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository';
import { Project as DomainProject, ProjectStatus, ProjectRegistration, RegistrationStatus } from '@modules/content-management/projects/domain/entities/Project';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';

// Presentation interface that maps to domain entities
interface PresentationProject {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  startDate: Date;
  endDate: Date;
  responsible: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  category: string;
  budget?: number;
  maxParticipants?: number;
  currentParticipants: number;
  requiresApproval: boolean;
  imageURL?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Helper functions to map between domain and presentation layers
const mapDomainToPresentation = (domainProject: DomainProject, currentParticipants: number = 0): PresentationProject => {
  return {
    id: domainProject.id,
    name: domainProject.name,
    description: domainProject.description,
    objectives: domainProject.objectives,
    startDate: domainProject.startDate,
    endDate: domainProject.endDate,
    responsible: domainProject.responsible,
    status: domainProject.status as PresentationProject['status'],
    category: domainProject.category,
    budget: domainProject.budget,
    maxParticipants: domainProject.maxParticipants,
    currentParticipants, // This will be calculated from registrations
    requiresApproval: domainProject.requiresApproval,
    imageURL: domainProject.imageURL,
    createdAt: domainProject.createdAt,
    updatedAt: domainProject.updatedAt,
    createdBy: domainProject.createdBy
  };
};

const mapPresentationToDomain = (presentationProject: Partial<PresentationProject>): Partial<DomainProject> => {
  return {
    ...presentationProject,
    status: presentationProject.status as ProjectStatus
  };
};

export const AdminProjectsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifyNewProject } = useNotificationActions();
  const [projects, setProjects] = useState<PresentationProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const projectRepository = useMemo(() => new FirebaseProjectRepository(), []);
  const notificationService = useMemo(() => new NotificationService(), []);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<PresentationProject | null>(null);
  
  // Registration management state
  const [selectedProjectForRegistrations, setSelectedProjectForRegistrations] = useState<PresentationProject | null>(null);
  const [projectRegistrations, setProjectRegistrations] = useState<ProjectRegistration[]>([]);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);

  // Load projects from Firebase on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const domainProjects = await projectRepository.findAll();
        
        // Convert domain projects to presentation interface
        // For now, we'll set currentParticipants to 0, but this could be loaded from registrations
        const presentationProjects: PresentationProject[] = domainProjects.map(project => 
          mapDomainToPresentation(project, 0)
        );
        
        setProjects(presentationProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Keep empty array on error rather than falling back to mock data
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [projectRepository]);

  const statuses = ['all', 'planning', 'active', 'paused', 'completed', 'cancelled'];
  const categories = ['all', 'Ação Social', 'Infraestrutura', 'Evangelismo', 'Educação', 'Juventude'];

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'Planejamento';
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ação Social': return '🤝';
      case 'Infraestrutura': return '🏗️';
      case 'Evangelismo': return '📢';
      case 'Educação': return '📚';
      case 'Juventude': return '🎯';
      default: return '📋';
    }
  };

  const getProgressPercentage = (project: PresentationProject) => {
    const total = project.endDate.getTime() - project.startDate.getTime();
    const elapsed = Date.now() - project.startDate.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return Math.round(progress);
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${getStatusText(newStatus)}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // Update status via repository
      await projectRepository.updateStatus(projectId, newStatus as ProjectStatus);
      
      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId 
            ? { ...project, status: newStatus as PresentationProject['status'], updatedAt: new Date() }
            : project
        )
      );
      
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) {
      return;
    }

    setLoading(true);
    const project = projects.find(p => p.id === projectId);
    try {
      // Delete via repository
      await projectRepository.delete(projectId);
      
      // Update local state
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      
      await loggingService.logDatabase('info', 'Project deleted successfully', 
        `Project: "${project?.name}", ID: ${projectId}`, currentUser);
      
      alert('Projeto excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting project:', error);
      await loggingService.logDatabase('error', 'Failed to delete project', 
        `Project: "${project?.name}", ID: ${projectId}, Error: ${error}`, currentUser);
      alert('Erro ao excluir projeto.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: PresentationProject) => {
    setEditingProject(project);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleUpdateProject = async (formData: Partial<PresentationProject>) => {
    if (!editingProject) return;

    setLoading(true);
    try {
      // Convert presentation data to domain entity for repository
      const domainData = mapPresentationToDomain({
        ...formData,
        id: editingProject.id
      });
      
      // Update project via repository
      const updatedProject = await projectRepository.update(editingProject.id, domainData);
      
      await loggingService.logDatabase('info', 'Project updated successfully', 
        `Project: "${updatedProject.name}", Status: ${updatedProject.status}`, currentUser);
      
      // Convert back to presentation and update state
      const presentationProject = mapDomainToPresentation(updatedProject, editingProject.currentParticipants);
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === editingProject.id ? presentationProject : p)
      );
      
      setEditingProject(null);
      alert('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Erro ao atualizar projeto.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRegistrations = async (project: PresentationProject) => {
    setSelectedProjectForRegistrations(project);
    setLoading(true);
    try {
      const registrations = await projectRepository.findRegistrations(project.id);
      setProjectRegistrations(registrations);
      setShowRegistrationsModal(true);
    } catch (error) {
      console.error('Error loading registrations:', error);
      alert('Erro ao carregar inscrições.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    if (!selectedProjectForRegistrations) return;
    
    try {
      // Find the registration to get user info
      const registration = projectRegistrations.find(r => r.id === registrationId);
      if (!registration) {
        alert('Inscrição não encontrada.');
        return;
      }

      // Update registration status
      await projectRepository.updateRegistrationStatus(registrationId, RegistrationStatus.Approved, currentUser?.email);
      
      // Send notification to the user
      try {
        await notificationService.notifyProjectApproval(
          registration.userId,
          selectedProjectForRegistrations.id,
          selectedProjectForRegistrations.name
        );
        console.log('Notification sent to user for project approval');
      } catch (notificationError) {
        console.warn('Failed to send approval notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      // Reload registrations
      const registrations = await projectRepository.findRegistrations(selectedProjectForRegistrations.id);
      setProjectRegistrations(registrations);
      
      alert('Inscrição aprovada com sucesso! O usuário foi notificado.');
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Erro ao aprovar inscrição.');
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta inscrição?')) return;
    if (!selectedProjectForRegistrations) return;
    
    try {
      // Find the registration to get user info
      const registration = projectRegistrations.find(r => r.id === registrationId);
      if (!registration) {
        alert('Inscrição não encontrada.');
        return;
      }

      // Update registration status
      await projectRepository.updateRegistrationStatus(registrationId, RegistrationStatus.Rejected);
      
      // Send notification to the user
      try {
        await notificationService.notifyProjectRejection(
          registration.userId,
          selectedProjectForRegistrations.id,
          selectedProjectForRegistrations.name
        );
        console.log('Notification sent to user for project rejection');
      } catch (notificationError) {
        console.warn('Failed to send rejection notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      // Reload registrations
      const registrations = await projectRepository.findRegistrations(selectedProjectForRegistrations.id);
      setProjectRegistrations(registrations);
      
      alert('Inscrição rejeitada. O usuário foi notificado.');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Erro ao rejeitar inscrição.');
    }
  };

  const handleSaveProject = async (formData: Partial<PresentationProject>) => {
    setLoading(true);
    try {
      // Convert presentation data to domain entity for repository
      const domainData = mapPresentationToDomain({
        name: formData.name || '',
        description: formData.description || '',
        objectives: formData.objectives || [],
        startDate: formData.startDate || new Date(),
        endDate: formData.endDate || new Date(),
        responsible: formData.responsible || currentUser?.email || 'Admin',
        status: (formData.status as PresentationProject['status']) || 'planning',
        category: formData.category || 'Ação Social',
        budget: formData.budget,
        maxParticipants: formData.maxParticipants,
        requiresApproval: formData.requiresApproval ?? false,
        imageURL: formData.imageURL,
        createdBy: currentUser?.id || 'admin'
      });
      
      // Create project via repository
      const createdProject = await projectRepository.create(domainData as Omit<DomainProject, 'id' | 'createdAt' | 'updatedAt'>);
      
      await loggingService.logDatabase('info', 'Project created successfully', 
        `Project: "${createdProject.name}", Status: ${createdProject.status}, Budget: R$ ${createdProject.budget}`, currentUser);
      
      // Send notification if project is active (public projects are considered active/available)
      if (createdProject.status === ProjectStatus.Active) {
        try {
          const notificationCount = await notifyNewProject(
            createdProject.id,
            createdProject.name
          );
          await loggingService.logApi('info', 'Project notification sent', 
            `Project: "${createdProject.name}", Recipients: ${notificationCount}`, currentUser);
        } catch (error) {
          console.warn('Failed to send project notification:', error);
          await loggingService.logApi('error', 'Failed to send project notification', 
            `Project: "${createdProject.name}", Error: ${error}`, currentUser);
        }
      }
      
      // Convert back to presentation and update state
      const presentationProject = mapDomainToPresentation(createdProject, 0);
      setProjects(prevProjects => [presentationProject, ...prevProjects]);
      setShowCreateModal(false);
      alert('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erro ao criar projeto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Projetos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre projetos da igreja e seus participantes
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              <span className="mr-2">➕</span>
              Novo Projeto
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Todos os Status</option>
                {statuses.slice(1).map(status => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Planejamento</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'planning').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Concluídos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Participantes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.reduce((sum, p) => sum + p.currentParticipants, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Projetos ({filteredProjects.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orçamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && projects.length === 0 ? (
                  // Loading skeleton
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-16 bg-gray-200 rounded"></div>
                          <div className="ml-4">
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    </tr>
                  ))
                ) : (
                  filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded flex items-center justify-center">
                          <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        disabled={loading}
                        className={`text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 ${getStatusColor(project.status)}`}
                      >
                        {statuses.slice(1).map(status => (
                          <option key={status} value={status}>
                            {getStatusText(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.responsible}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>{project.currentParticipants}</span>
                        {project.maxParticipants && (
                          <span className="text-gray-400">/{project.maxParticipants}</span>
                        )}
                      </div>
                      {project.maxParticipants && (
                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className="bg-orange-600 h-1 rounded-full"
                            style={{ width: `${(project.currentParticipants / project.maxParticipants) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.status === 'active' && (
                        <div className="flex items-center">
                          <span className="mr-2">{getProgressPercentage(project)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${getProgressPercentage(project)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {project.status !== 'active' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRegistrations(project)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver inscrições"
                        >
                          Inscrições
                        </button>
                        <button
                          onClick={() => handleEditProject(project)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📁</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {projects.length === 0 ? 'Nenhum projeto cadastrado' : 'Nenhum projeto encontrado'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {projects.length === 0
                  ? 'Comece criando seu primeiro projeto'
                  : 'Tente ajustar os filtros ou fazer uma nova busca.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onSave={handleSaveProject}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
          loading={loading}
        />
      )}

      {/* Project Registrations Modal */}
      {showRegistrationsModal && selectedProjectForRegistrations && (
        <ProjectRegistrationsModal
          project={selectedProjectForRegistrations}
          registrations={projectRegistrations}
          onClose={() => {
            setShowRegistrationsModal(false);
            setSelectedProjectForRegistrations(null);
            setProjectRegistrations([]);
          }}
          onApprove={handleApproveRegistration}
          onReject={handleRejectRegistration}
        />
      )}
    </div>
  );
};

// Modal component for viewing and managing project registrations
interface ProjectRegistrationsModalProps {
  project: PresentationProject;
  registrations: ProjectRegistration[];
  onClose: () => void;
  onApprove: (registrationId: string) => void;
  onReject: (registrationId: string) => void;
}

const ProjectRegistrationsModal: React.FC<ProjectRegistrationsModalProps> = ({ 
  project, 
  registrations, 
  onClose, 
  onApprove, 
  onReject 
}) => {
  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case RegistrationStatus.Approved: return 'bg-green-100 text-green-800';
      case RegistrationStatus.Rejected: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.Pending: return 'Pendente';
      case RegistrationStatus.Approved: return 'Aprovado';
      case RegistrationStatus.Rejected: return 'Rejeitado';
      default: return status;
    }
  };

  const pendingRegistrations = registrations.filter(r => r.status === RegistrationStatus.Pending);
  const approvedRegistrations = registrations.filter(r => r.status === RegistrationStatus.Approved);
  const rejectedRegistrations = registrations.filter(r => r.status === RegistrationStatus.Rejected);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Inscrições do Projeto: {project.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-xl">⏳</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                  <p className="text-xl font-semibold text-yellow-900">{pendingRegistrations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Aprovados</p>
                  <p className="text-xl font-semibold text-green-900">{approvedRegistrations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-xl">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Rejeitados</p>
                  <p className="text-xl font-semibold text-red-900">{rejectedRegistrations.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900">
                Lista de Inscrições ({registrations.length})
              </h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data da Inscrição
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprovado por
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma inscrição encontrada para este projeto.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-white">
                                {registration.userName.split('@')[0].substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {registration.userName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {format(registration.registrationDate, 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                            {getStatusText(registration.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {registration.approvedBy || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {registration.status === RegistrationStatus.Pending ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => onApprove(registration.id)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => onReject(registration.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal component for creating new projects
interface CreateProjectModalProps {
  onSave: (formData: Partial<PresentationProject>) => void;
  onCancel: () => void;
  loading: boolean;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectives: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    responsible: '',
    status: 'planning' as PresentationProject['status'],
    category: 'Ação Social',
    budget: '',
    maxParticipants: '',
    requiresApproval: false,
    imageURL: ''
  });

  const categoryOptions = [
    'Ação Social',
    'Infraestrutura',
    'Evangelismo',
    'Educação',
    'Juventude',
    'Família',
    'Música',
    'Tecnologia',
    'Manutenção'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor, insira o nome do projeto.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Por favor, insira a descrição do projeto.');
      return;
    }

    if (!formData.endDate) {
      alert('Por favor, selecione a data de término do projeto.');
      return;
    }

    // Convert objectives string to array
    const objectivesArray = formData.objectives
      .split('\n')
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0);

    onSave({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      objectives: objectivesArray,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Novo Projeto
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: Cestas Básicas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Descrição detalhada do projeto..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivos
                  </label>
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => handleChange('objectives', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Digite cada objetivo em uma linha separada&#10;Ex:&#10;Distribuir 100 cestas mensalmente&#10;Cadastrar famílias beneficiadas&#10;Promover dignidade às famílias"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Digite cada objetivo em uma linha separada
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.imageURL}
                    onChange={(e) => handleChange('imageURL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => handleChange('responsible', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="planning">Planejamento</option>
                      <option value="active">Ativo</option>
                      <option value="paused">Pausado</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orçamento (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleChange('budget', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="15000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Participantes
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="20"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={formData.requiresApproval}
                    onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="requiresApproval" className="ml-2 text-sm text-gray-700">
                    Requer aprovação para participar
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Projeto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal component for editing projects
interface EditProjectModalProps {
  project: PresentationProject;
  onSave: (formData: Partial<PresentationProject>) => void;
  onCancel: () => void;
  loading: boolean;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    objectives: project.objectives.join('\n'),
    startDate: format(project.startDate, 'yyyy-MM-dd'),
    endDate: format(project.endDate, 'yyyy-MM-dd'),
    responsible: project.responsible,
    status: project.status,
    category: project.category,
    budget: project.budget?.toString() || '',
    maxParticipants: project.maxParticipants?.toString() || '',
    requiresApproval: project.requiresApproval,
    imageURL: project.imageURL || ''
  });

  const categoryOptions = [
    'Ação Social',
    'Infraestrutura',
    'Evangelismo',
    'Educação',
    'Juventude',
    'Família',
    'Música',
    'Tecnologia',
    'Manutenção'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor, insira o nome do projeto.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Por favor, insira a descrição do projeto.');
      return;
    }

    if (!formData.endDate) {
      alert('Por favor, selecione a data de término do projeto.');
      return;
    }

    // Convert objectives string to array
    const objectivesArray = formData.objectives
      .split('\n')
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0);

    onSave({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      objectives: objectivesArray,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Editar Projeto: {project.name}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: Cestas Básicas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Descrição detalhada do projeto..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivos
                  </label>
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => handleChange('objectives', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Digite cada objetivo em uma linha separada&#10;Ex:&#10;Distribuir 100 cestas mensalmente&#10;Cadastrar famílias beneficiadas&#10;Promover dignidade às famílias"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Digite cada objetivo em uma linha separada
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.imageURL}
                    onChange={(e) => handleChange('imageURL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => handleChange('responsible', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="planning">Planejamento</option>
                      <option value="active">Ativo</option>
                      <option value="paused">Pausado</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orçamento (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleChange('budget', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="15000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Participantes
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="20"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editRequiresApproval"
                    checked={formData.requiresApproval}
                    onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="editRequiresApproval" className="ml-2 text-sm text-gray-700">
                    Requer aprovação para participar
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Atualizando...' : 'Atualizar Projeto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};