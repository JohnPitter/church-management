// Presentation Page - Painel (Dashboard)
// Main dashboard for authenticated users

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FirebaseProjectRepository } from '@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository';
import { FirebaseBlogRepository } from '@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository';
import { FirebaseEventRepository } from '@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VerseOfTheDay } from '../components/VerseOfTheDay';
import { EventsCalendar } from '../components/EventsCalendar';

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: 'event' | 'blog' | 'project';
}

export const PainelPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const projectRepository = useMemo(() => new FirebaseProjectRepository(), []);
  const blogRepository = useMemo(() => new FirebaseBlogRepository(), []);
  const eventRepository = useMemo(() => new FirebaseEventRepository(), []);

  // Build features array dynamically based on user role
  const baseFeatures = [
    {
      title: 'Eventos',
      description: 'Próximos eventos e atividades',
      icon: '📅',
      href: '/events',
      color: 'bg-blue-500'
    },
    {
      title: 'Blog',
      description: 'Mensagens e reflexões',
      icon: '📖',
      href: '/blog',
      color: 'bg-green-500'
    },
    {
      title: 'Projetos',
      description: 'Projetos da comunidade',
      icon: '🤝',
      href: '/projects',
      color: 'bg-purple-500'
    },
    {
      title: 'Transmissões',
      description: 'Cultos ao vivo',
      icon: '📺',
      href: '/live',
      color: 'bg-red-500'
    },
    {
      title: 'Devocionais',
      description: 'Reflexões e estudos diários',
      icon: '✝️',
      href: '/devotionals',
      color: 'bg-yellow-500'
    },
    {
      title: 'Fórum',
      description: 'Discussões da comunidade',
      icon: '💬',
      href: '/forum',
      color: 'bg-indigo-500'
    }
  ];

  // Add professional panel only if user has professional role
  const features = useMemo(() => {
    if (currentUser?.role === 'professional') {
      return [
        ...baseFeatures,
        {
          title: 'Profissionais',
          description: 'Painel de atendimento especializado',
          icon: '🩺',
          href: '/professional',
          color: 'bg-teal-500'
        }
      ];
    }
    return baseFeatures;
  }, [currentUser?.role]);

  // Load dashboard data from Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load activities data in parallel
        const [projects, events, blogPosts] = await Promise.all([
          projectRepository.findAll().catch(() => []),
          eventRepository.findAll().catch(() => []),
          blogRepository.findPublished().catch(() => [])
        ]);

        // Create recent activities from latest items
        const activities: RecentActivity[] = [];

        // Add latest events
        events
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .forEach(event => {
            activities.push({
              id: event.id,
              title: `Novo evento criado: ${event.title}`,
              time: format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
              type: 'event'
            });
          });

        // Add latest blog posts
        blogPosts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .forEach(post => {
            activities.push({
              id: post.id,
              title: `Nova postagem no blog: ${post.title}`,
              time: format(new Date(post.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
              type: 'blog'
            });
          });

        // Add latest projects
        projects
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1)
          .forEach(project => {
            activities.push({
              id: project.id,
              title: `Projeto "${project.name}" atualizado`,
              time: format(new Date(project.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
              type: 'project'
            });
          });

        // Sort activities by most recent and take top 5
        setRecentActivities(
          activities
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5)
        );

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [projectRepository, blogRepository, eventRepository]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel Principal
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Bem-vindo, {currentUser?.displayName || 'Usuário'}!
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Meu Perfil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Verse of the Day */}
        <VerseOfTheDay />

        {/* Quick Actions */}
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              to={feature.href}
              className="relative rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
            >
              <div>
                <span
                  className={`inline-flex p-3 ${feature.color} rounded-lg text-white text-2xl`}
                >
                  {feature.icon}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
              <span
                className="absolute top-6 right-6 text-gray-300"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Events and Birthdays Calendar */}
        <div className="mt-8">
          <EventsCalendar />
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Atividades Recentes
          </h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando atividades...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {activity.type === 'event' && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">📅</span>
                          </div>
                        )}
                        {activity.type === 'blog' && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">📖</span>
                          </div>
                        )}
                        {activity.type === 'project' && (
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm">🤝</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">Nenhuma atividade recente encontrada.</p>
                <p className="text-xs text-gray-400 mt-1">
                  As atividades aparecerão aqui quando eventos, posts ou projetos forem criados.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};