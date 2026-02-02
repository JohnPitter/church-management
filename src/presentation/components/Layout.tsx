// Presentation Component - Layout
// Main layout wrapper that chooses between authenticated and public layouts

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAtomicPermissions } from '../hooks/useAtomicPermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';
import { PublicLayout } from './PublicLayout';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { settings } = useSettings();
  const { hasPermission, hasAnyPermission } = useAtomicPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to check if user has any manage permission
  const hasAnyManagePermission = () => {
    const modules = [
      SystemModule.Users, SystemModule.Members, SystemModule.Events,
      SystemModule.Blog, SystemModule.Finance, SystemModule.Assistance,
      SystemModule.Leadership, SystemModule.Transmissions, SystemModule.Projects,
      SystemModule.Devotionals, SystemModule.Forum, SystemModule.Visitors,
      SystemModule.Notifications, SystemModule.Settings, SystemModule.ONG
    ];
    return modules.some(module => hasPermission(module, PermissionAction.Manage));
  };

  // If user is not logged in, use public layout
  if (!currentUser) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const navigation = [
    { 
      name: 'Painel', 
      href: currentUser?.role === 'professional' ? '/professional' : '/painel',
      show: hasPermission(SystemModule.Dashboard, PermissionAction.View)
    },
    { 
      name: 'Eventos', 
      href: '/events',
      show: hasPermission(SystemModule.Events, PermissionAction.View)
    },
    { 
      name: 'Blog', 
      href: '/blog',
      show: hasPermission(SystemModule.Blog, PermissionAction.View)
    },
    { 
      name: 'Projetos', 
      href: '/projects',
      show: hasPermission(SystemModule.Projects, PermissionAction.View)
    },
    { 
      name: 'Transmissões', 
      href: '/live',
      show: hasPermission(SystemModule.Transmissions, PermissionAction.View)
    },
    { 
      name: 'Devocionais', 
      href: '/devotionals',
      show: hasPermission(SystemModule.Devotionals, PermissionAction.View)
    },
    {
      name: 'Fórum',
      href: '/forum',
      show: hasPermission(SystemModule.Forum, PermissionAction.View)
    },
    {
      name: 'Liderança',
      href: '/leadership',
      show: hasPermission(SystemModule.Leadership, PermissionAction.View)
    },
  ];

  const adminNavigation = [
    {
      name: 'Painel Admin',
      href: '/admin',
      // Only show if user has at least one Manage permission
      show: hasAnyManagePermission()
    },
  ];

  const isActive = (href: string) => {
    // Special case for professional painel - consider both painel routes active
    if (currentUser?.role === 'professional' && href === '/professional') {
      return location.pathname === '/professional';
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center space-x-3">
                {/* Church Logo */}
                {settings?.logoURL && (
                  <img
                    src={settings.logoURL}
                    alt={settings.churchName || 'Logo da Igreja'}
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}

                <h1
                  className="text-sm md:text-lg lg:text-xl font-bold leading-tight max-w-xs md:max-w-sm lg:max-w-none"
                  style={{ color: settings?.primaryColor || '#6366F1' }}
                >
                  <span className="block md:hidden">
                    {/* Versão mobile - mais compacta */}
                    {(settings?.churchTagline || 'Conectados pela fé').length > 15
                      ? `${(settings?.churchTagline || 'Conectados pela fé').substring(0, 15)}...`
                      : (settings?.churchTagline || 'Conectados pela fé')
                    }
                  </span>
                  <span className="hidden md:block lg:hidden">
                    {/* Versão tablet - média */}
                    {(settings?.churchTagline || 'Conectados pela fé').length > 25
                      ? `${(settings?.churchTagline || 'Conectados pela fé').substring(0, 25)}...`
                      : (settings?.churchTagline || 'Conectados pela fé')
                    }
                  </span>
                  <span className="hidden lg:block">
                    {/* Versão desktop - completa */}
                    {settings?.churchTagline || 'Conectados pela fé'}
                  </span>
                </h1>
              </div>
              <div className="hidden lg:ml-8 lg:flex lg:space-x-3 lg:flex-1 lg:max-w-4xl">
                {navigation.filter(item => item.show).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                      isActive(item.href)
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Admin Navigation */}
                {adminNavigation.some(item => item.show) && (
                  <>
                    <div className="border-l border-gray-300 h-6 self-center mx-6"></div>
                    {adminNavigation.filter(item => item.show).map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                          isActive(item.href)
                            ? 'border-red-500 text-gray-900'
                            : 'border-transparent text-red-600 hover:border-red-300 hover:text-red-700'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Desktop Right Menu */}
            <div className="hidden lg:flex items-center gap-8 flex-shrink-0 ml-20">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile dropdown would go here */}
              <div className="relative">
                <Link
                  to="/profile"
                  className="text-sm text-gray-700 hover:text-gray-900 flex items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center mr-2 overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'Usuário'}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-avatar')) {
                            const span = document.createElement('span');
                            span.className = 'fallback-avatar text-xs font-medium text-white';
                            span.textContent = currentUser?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {currentUser?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                      </span>
                    )}
                  </div>
                  {currentUser?.displayName || 'Usuário'}
                  {hasPermission(SystemModule.Dashboard, PermissionAction.Manage) && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  )}
                </Link>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>

            {/* Mobile and Tablet Hamburger Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                style={{ color: settings?.primaryColor || '#374151' }}
                aria-expanded="false"
              >
                <span className="sr-only">Abrir menu principal</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile and Tablet menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {navigation.filter(item => item.show).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Mobile Navigation */}
              {adminNavigation.some(item => item.show) && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="pl-3 pr-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Administração
                  </div>
                  {adminNavigation.filter(item => item.show).map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                        isActive(item.href)
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-transparent text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </>
              )}

              {/* Mobile Profile & Actions */}
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Usuário'}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-avatar')) {
                              const span = document.createElement('span');
                              span.className = 'fallback-avatar text-sm font-medium text-white';
                              span.textContent = currentUser?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {currentUser?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {currentUser?.displayName || 'Usuário'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentUser?.email}
                    </div>
                    {hasPermission(SystemModule.Dashboard, PermissionAction.Manage) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Perfil
                  </Link>
                  <div className="px-4 py-2">
                    <NotificationBell />
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};