// Presentation Page - Projects
// Projects listing and management page

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Project, ProjectStatus, RegistrationStatus } from '@modules/content-management/projects/domain/entities/Project';
import { FirebaseProjectRepository } from '@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { format } from 'date-fns';
import SocialShareButtons from '../components/SocialShareButtons';
import toast from 'react-hot-toast';

export const ProjectsPage: React.FC = () => {
  const { currentUser, canCreateContent: _canCreateContent } = useAuth();
  const { settings } = useSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState<string | null>(null);

  const projectRepository = useMemo(() => new FirebaseProjectRepository(), []);

  const statuses = ['all', 'planning', 'active', 'paused', 'completed', 'cancelled'];
  const categories = ['all', 'Ação Social', 'Infraestrutura', 'Evangelismo', 'Educação', 'Juventude'];

  // Load projects from Firebase on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const domainProjects = await projectRepository.findAll();
        setProjects(domainProjects);
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

  // Load user registrations when user is available
  useEffect(() => {
    const loadUserRegistrations = async () => {
      if (!currentUser?.id) return;
      
      try {
        const registrations = await projectRepository.findUserRegistrations(currentUser.id);
        const projectIds = registrations.map(reg => reg.projectId);
        setUserRegistrations(projectIds);
      } catch (error) {
        console.error('Error loading user registrations:', error);
        // If index is not ready, continue with empty registrations
        // The user can still register, but won't see existing registrations status
        if (error instanceof Error && error.message?.includes('index')) {
          console.warn('Firestore index not ready yet. User registrations will be loaded after index creation.');
        }
        setUserRegistrations([]);
      }
    };

    loadUserRegistrations();
  }, [currentUser, projectRepository]);

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Planning:
        return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.Active:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.Paused:
        return 'bg-orange-100 text-orange-800';
      case ProjectStatus.Completed:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Planning:
        return 'Planejamento';
      case ProjectStatus.Active:
        return 'Ativo';
      case ProjectStatus.Paused:
        return 'Pausado';
      case ProjectStatus.Completed:
        return 'Concluído';
      case ProjectStatus.Cancelled:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getProgressPercentage = (project: Project) => {
    const total = project.endDate.getTime() - project.startDate.getTime();
    const elapsed = Date.now() - project.startDate.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return Math.round(progress);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedProject(null);
    setShowDetailsModal(false);
  };

  const handleRegisterForProject = async (project: Project) => {
    if (!currentUser?.id || !currentUser?.email) {
      toast.error('Você precisa estar logado para se inscrever em um projeto.');
      return;
    }

    if (userRegistrations.includes(project.id)) {
      toast.error('Você já está inscrito neste projeto.');
      return;
    }

    setRegistrationLoading(project.id);
    
    try {
      await projectRepository.createRegistration({
        projectId: project.id,
        userId: currentUser.id,
        userName: currentUser.email,
        status: project.requiresApproval ? RegistrationStatus.Pending : RegistrationStatus.Approved,
        approvedBy: project.requiresApproval ? undefined : 'auto',
        approvedAt: project.requiresApproval ? undefined : new Date(),
        notes: project.requiresApproval ? 'Aguardando aprovação' : 'Aprovado automaticamente'
      });

      // Update local state
      setUserRegistrations(prev => [...prev, project.id]);

      await loggingService.logDatabase('info', 'User registered for project', 
        `User: ${currentUser.email}, Project: "${project.name}", Status: ${project.requiresApproval ? 'pending' : 'approved'}`, 
        currentUser
      );

      if (project.requiresApproval) {
        toast.success('Inscrição realizada com sucesso! Aguarde a aprovação do responsável pelo projeto.');
      } else {
        toast.success('Inscrição realizada e aprovada automaticamente!');
      }
    } catch (error) {
      console.error('Error registering for project:', error);
      await loggingService.logDatabase('error', 'Failed to register for project', 
        `User: ${currentUser.email}, Project: "${project.name}", Error: ${error}`, 
        currentUser
      );
      toast.error('Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setRegistrationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Acompanhe e participe dos projetos da nossa comunidade
              </p>
            </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2"
                style={{ 
                  '--tw-ring-color': settings?.primaryColor || '#6366F1',
                  borderColor: 'rgb(209 213 219)',
                  '--focus-border-color': settings?.primaryColor || '#6366F1'
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = settings?.primaryColor || '#6366F1'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209 213 219)'}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2"
                style={{ borderColor: 'rgb(209 213 219)' }}
                onFocus={(e) => e.target.style.borderColor = settings?.primaryColor || '#6366F1'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209 213 219)'}
              >
                <option value="all">Todos os Status</option>
                {statuses.slice(1).map(status => (
                  <option key={status} value={status}>
                    {getStatusText(status as ProjectStatus)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2"
                style={{ borderColor: 'rgb(209 213 219)' }}
                onFocus={(e) => e.target.style.borderColor = settings?.primaryColor || '#6366F1'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209 213 219)'}
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

        {/* Projects Grid */}
        {loading && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando projetos...</p>
          </div>
        )}

        {(!loading || projects.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {project.imageURL && (
                <img
                  src={project.imageURL}
                  alt={project.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              {!project.imageURL && (
                <div className="w-full h-48 rounded-t-lg flex items-center justify-center theme-gradient">
                  <div className="text-6xl text-white opacity-50">
                    {project.category === 'Ação Social' && '🤝'}
                    {project.category === 'Infraestrutura' && '🏗️'}
                    {project.category === 'Evangelismo' && '📢'}
                    {project.category === 'Educação' && '📚'}
                    {project.category === 'Juventude' && '🎯'}
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: settings?.primaryColor || '#6366F1' }}
                    >
                      {project.category}
                    </span>
                    {project.requiresApproval && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Requer Aprovação
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Progress Bar (for in-progress projects) */}
                {project.status === ProjectStatus.Active && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{getProgressPercentage(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Project Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Responsável: {project.responsible}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {format(project.startDate, "dd/MM/yyyy")} - {format(project.endDate, "dd/MM/yyyy")}
                  </div>

                  {project.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Orçamento: R$ {project.budget.toLocaleString('pt-BR')}
                    </div>
                  )}

                  {project.maxParticipants && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Máx. participantes: {project.maxParticipants}
                    </div>
                  )}
                </div>

                {/* Objectives Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Principais objetivos:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {project.objectives.slice(0, 2).map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-500 mr-2">•</span>
                        {objective}
                      </li>
                    ))}
                    {project.objectives.length > 2 && (
                      <li className="text-gray-500 italic">
                        +{project.objectives.length - 2} outros objetivos...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => handleViewDetails(project)}
                      className="text-sm font-medium hover:opacity-80"
                      style={{ color: settings?.primaryColor || '#6366F1' }}
                    >
                      Ver detalhes
                    </button>
                    
                    {currentUser && (project.status === ProjectStatus.Active || project.status === ProjectStatus.Planning) && (
                      <div className="flex gap-2">
                        {userRegistrations.includes(project.id) ? (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded text-sm font-medium">
                            ✓ Inscrito
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleRegisterForProject(project)}
                            disabled={registrationLoading === project.id}
                            className="text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: settings?.primaryColor || '#6366F1' }}
                          >
                            {registrationLoading === project.id ? 'Inscrevendo...' : (
                              project.requiresApproval ? 'Solicitar Participação' : 'Participar'
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Social Share Buttons */}
                  <SocialShareButtons
                    url={`${window.location.origin}/projects/${project.id}`}
                    title={project.name}
                    description={project.description}
                    hashtags={['igreja', 'projeto', project.category.toLowerCase().replace(/\s+/g, '')]}
                    imageUrl={project.imageURL}
                    showText={false}
                  />
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum projeto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros ou fazer uma nova busca.
            </p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedProject.name}
                  </h2>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {selectedProject.category}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                      {getStatusText(selectedProject.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Project Image */}
              {selectedProject.imageURL && (
                <img
                  src={selectedProject.imageURL}
                  alt={selectedProject.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* Project Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Detalhes do Projeto</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Data de Início:</dt>
                      <dd className="text-gray-900 font-medium">
                        {format(selectedProject.startDate, 'dd/MM/yyyy')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Data de Término:</dt>
                      <dd className="text-gray-900 font-medium">
                        {format(selectedProject.endDate, 'dd/MM/yyyy')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Responsável:</dt>
                      <dd className="text-gray-900 font-medium">{selectedProject.responsible}</dd>
                    </div>
                    {selectedProject.budget && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Orçamento:</dt>
                        <dd className="text-gray-900 font-medium">
                          R$ {selectedProject.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Inscrição:</dt>
                      <dd className="text-gray-900 font-medium">
                        {selectedProject.requiresApproval ? 'Requer aprovação' : 'Livre'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Objectives */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Objetivos</h3>
                  <ul className="space-y-1 text-gray-600">
                    {selectedProject.objectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Progress Bar (for active projects) */}
              {selectedProject.status === ProjectStatus.Active && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Progresso do Projeto</h3>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(selectedProject)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getProgressPercentage(selectedProject)}% concluído
                  </p>
                </div>
              )}

              {/* Social Share Buttons in Modal */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Compartilhar Projeto</h3>
                <SocialShareButtons
                  url={`${window.location.origin}/projects/${selectedProject.id}`}
                  title={selectedProject.name}
                  description={selectedProject.description}
                  hashtags={['igreja', 'projeto', selectedProject.category.toLowerCase().replace(/\s+/g, '')]}
                  imageUrl={selectedProject.imageURL}
                  showText={true}
                />
              </div>


              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                {currentUser && (selectedProject.status === ProjectStatus.Active || selectedProject.status === ProjectStatus.Planning) && (
                  <>
                    {userRegistrations.includes(selectedProject.id) ? (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-medium">
                        ✓ Você está inscrito
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleRegisterForProject(selectedProject)}
                        disabled={registrationLoading === selectedProject.id}
                        className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: settings?.primaryColor || '#6366F1' }}
                      >
                        {registrationLoading === selectedProject.id ? 'Inscrevendo...' : (
                          selectedProject.requiresApproval ? 'Solicitar Participação' : 'Participar do Projeto'
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};