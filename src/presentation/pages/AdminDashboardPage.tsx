// Presentation Page - Admin Dashboard
// Administrative overview and quick actions dashboard

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomicPermissions } from '../hooks/useAtomicPermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';
import { useAuth } from '../contexts/AuthContext';
import { PermissionService } from '@modules/user-management/permissions/application/services/PermissionService';
import { AdminVerseOfTheDay } from '../components/AdminVerseOfTheDay';
import {
  Users,
  User,
  Lock,
  PenSquare,
  Calendar,
  BookOpen,
  Tv,
  Target,
  MessageSquare,
  DoorOpen,
  CalendarDays,
  Heart,
  HandHeart,
  Bell,
  Hand,
  DollarSign,
  Building2,
  BarChart3,
  Settings,
  FileText,
  Save,
  Package,
  Home,
  Key,
  CheckCircle2,
  Shield,
  Cloud
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = useAtomicPermissions();
  const [roleDisplayName, setRoleDisplayName] = useState<string>('');
  const permissionService = new PermissionService();

  useEffect(() => {
    if (currentUser?.role) {
      const displayName = permissionService.getRoleDisplayNameSync(currentUser.role);
      setRoleDisplayName(displayName);
    }
  }, [currentUser?.role]);
  
  // Organized by category for better UX
  const allActions = [
    // Core Management
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e gerenciar usuários do sistema',
      href: '/admin/users',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'core',
      show: hasPermission(SystemModule.Users, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Membros',
      description: 'Administrar membros da igreja e seus dados',
      href: '/admin/members',
      icon: <User className="w-6 h-6" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'core',
      show: hasPermission(SystemModule.Members, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Permissões',
      description: 'Configurar permissões de funções e usuários',
      href: '/admin/permissions',
      icon: <Lock className="w-6 h-6" />,
      color: 'bg-slate-600 hover:bg-slate-700',
      category: 'core',
      show: currentUser?.role === 'admin' || hasPermission(SystemModule.Permissions, PermissionAction.View)
    },

    // Content Management
    {
      title: 'Gerenciar Blog',
      description: 'Administrar postagens e categorias',
      href: '/admin/blog',
      icon: <PenSquare className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'content',
      show: hasPermission(SystemModule.Blog, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Eventos',
      description: 'Administrar eventos e confirmações',
      href: '/admin/events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      category: 'content',
      show: hasPermission(SystemModule.Events, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Devocionais',
      description: 'Criar e gerenciar devocionais diários',
      href: '/admin/devotionals',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-violet-500 hover:bg-violet-600',
      category: 'content',
      show: hasPermission(SystemModule.Devotionals, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Transmissões',
      description: 'Administrar transmissões ao vivo',
      href: '/admin/live',
      icon: <Tv className="w-6 h-6" />,
      color: 'bg-red-500 hover:bg-red-600',
      category: 'content',
      show: hasPermission(SystemModule.Transmissions, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Projetos',
      description: 'Administrar projetos e participantes',
      href: '/admin/projects',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'content',
      show: hasPermission(SystemModule.Projects, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Fórum',
      description: 'Administrar discussões e categorias do fórum',
      href: '/admin/forum',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      category: 'content',
      show: hasPermission(SystemModule.Forum, PermissionAction.Manage)
    },

    // Church Management
    {
      title: 'Gerenciar Visitantes',
      description: 'Gerenciar visitantes e acompanhamento',
      href: '/admin/visitors',
      icon: <DoorOpen className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'church',
      show: hasPermission(SystemModule.Visitors, PermissionAction.Manage)
    },
    {
      title: 'Calendário',
      description: 'Visualizar e gerenciar calendário da igreja',
      href: '/painel',
      icon: <CalendarDays className="w-6 h-6" />,
      color: 'bg-blue-400 hover:bg-blue-500',
      category: 'church',
      show: hasPermission(SystemModule.Calendar, PermissionAction.Manage)
    },
    {
      title: 'Gerenciamento de Assistências',
      description: 'Gerenciar assistência psicológica, social, jurídica e médica',
      href: '/admin/assistencias',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-rose-500 hover:bg-rose-600',
      category: 'church',
      show: hasPermission(SystemModule.Assistance, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Assistidos',
      description: 'Administrar pessoas assistidas pela igreja',
      href: '/admin/assistidos',
      icon: <HandHeart className="w-6 h-6" />,
      color: 'bg-amber-500 hover:bg-amber-600',
      category: 'church',
      show: hasPermission(SystemModule.Assistidos, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Notificações',
      description: 'Criar e enviar notificações personalizadas',
      href: '/admin/notifications',
      icon: <Bell className="w-6 h-6" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      category: 'church',
      show: hasPermission(SystemModule.Notifications, PermissionAction.Manage)
    },
    {
      title: 'Pedidos de Oração',
      description: 'Gerenciar pedidos de oração recebidos',
      href: '/admin/prayer-requests',
      icon: <Hand className="w-6 h-6" />,
      color: 'bg-indigo-400 hover:bg-indigo-500',
      category: 'church',
      show: hasPermission(SystemModule.Communication, PermissionAction.Manage)
    },

    // Financial
    {
      title: 'Sistema Financeiro',
      description: 'Gerenciar transações financeiras e doações',
      href: '/admin/financial',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      category: 'financial',
      show: hasPermission(SystemModule.Finance, PermissionAction.Manage)
    },
    {
      title: 'Gerenciar Patrimônio',
      description: 'Administrar bens e ativos da igreja',
      href: '/admin/assets',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      category: 'financial',
      show: hasPermission(SystemModule.Assets, PermissionAction.View)
    },
    {
      title: 'Relatórios',
      description: 'Relatórios e análises do sistema',
      href: '/admin/reports',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'financial',
      show: hasPermission(SystemModule.Reports, PermissionAction.View)
    },

    // System
    {
      title: 'Configurações',
      description: 'Configurações gerais do sistema',
      href: '/admin/settings',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      category: 'system',
      show: hasPermission(SystemModule.Settings, PermissionAction.Manage)
    },
    {
      title: 'Logs do Sistema',
      description: 'Visualizar logs e atividades',
      href: '/admin/logs',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      category: 'system',
      show: hasPermission(SystemModule.Logs, PermissionAction.View)
    },
    {
      title: 'Backup & Dados',
      description: 'Gerenciar backups e dados do sistema',
      href: '/admin/backup',
      icon: <Save className="w-6 h-6" />,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      category: 'system',
      show: hasPermission(SystemModule.Backup, PermissionAction.Manage)
    },
    {
      title: 'Migração de Dados',
      description: 'Importar dados do Firebase Realtime Database',
      href: '/admin/migration',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'system',
      show: currentUser?.role === 'admin'
    },
    {
      title: 'Configurar Home Page',
      description: 'Escolher estilo e configurar seções da home',
      href: '/admin/home-settings',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
      category: 'system',
      show: hasPermission(SystemModule.Settings, PermissionAction.Update)
    }
  ];

  // Filter actions based on permissions (only show items where show is true or undefined)
  const quickActions = allActions.filter(action => action.show !== false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="mt-1 text-sm text-gray-600">
                Visão geral do sistema e ações rápidas
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                <Key className="w-4 h-4" />
                {roleDisplayName || 'Carregando...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Verse of the Day */}
        <AdminVerseOfTheDay />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className={`${action.color} text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0">{action.icon}</div>
                    <h4 className="font-medium text-sm">{action.title}</h4>
                  </div>
                  <p className="text-xs opacity-90">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ONG Quick Actions */}
        {hasPermission(SystemModule.ONG, PermissionAction.Manage) && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Ações Rápidas - Gerenciamento ONG
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Acesso rápido às funcionalidades de gestão da ONG
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Link
                  to="/admin/ong/settings"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 text-center transition-colors hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <Settings className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium">Configurações</h4>
                  <p className="text-xs opacity-90 mt-1">Informações da ONG</p>
                </Link>

                <Link
                  to="/admin/ong/volunteers"
                  className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 text-center transition-colors hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <Users className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium">Voluntários</h4>
                  <p className="text-xs opacity-90 mt-1">Gestão de voluntários</p>
                </Link>

                <Link
                  to="/admin/ong/activities"
                  className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 text-center transition-colors hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium">Atividades</h4>
                  <p className="text-xs opacity-90 mt-1">Planejamento de atividades</p>
                </Link>

                <Link
                  to="/admin/ong/financial"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-4 text-center transition-colors hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium">Financeiro</h4>
                  <p className="text-xs opacity-90 mt-1">Controle financeiro</p>
                </Link>

                <Link
                  to="/admin/ong/reports"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-4 text-center transition-colors hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium">Relatórios</h4>
                  <p className="text-xs opacity-90 mt-1">Análises e relatórios</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Status do Sistema</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Banco de Dados</h4>
                <p className="text-sm text-green-600">Funcionando</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Autenticação</h4>
                <p className="text-sm text-green-600">Funcionando</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Cloud className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Armazenamento</h4>
                <p className="text-sm text-green-600">Funcionando</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};