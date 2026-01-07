// Presentation Component - Public Layout
// Simple layout for non-authenticated users

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Church Name */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              {settings?.logoURL ? (
                <img
                  src={settings.logoURL}
                  alt={settings.churchName || 'Logo da Igreja'}
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const icon = document.createElement('div');
                      icon.className = 'fallback-icon text-2xl';
                      icon.textContent = '⛪';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <div className="text-2xl">⛪</div>
              )}
              <h1 className="text-xl font-bold text-gray-800">
                {settings?.churchName || 'Igreja'}
              </h1>
            </button>

            {/* Login Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors"
                style={{ backgroundColor: settings?.primaryColor || '#2563EB' }}
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4 px-4">
              <span className="block sm:inline">{settings?.churchName || 'Igreja'}</span>
              <span className="hidden sm:inline"> - </span>
              <span className="block sm:inline text-sm sm:text-base">
                {settings?.churchTagline || 'Conectados pela fé'}
              </span>
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <button 
                onClick={() => navigate('/')}
                className="hover:text-blue-600 transition-colors"
              >
                Início
              </button>
              <button 
                onClick={() => navigate('/live')}
                className="hover:text-blue-600 transition-colors"
              >
                Transmissões
              </button>
              <button 
                onClick={() => navigate('/blog')}
                className="hover:text-blue-600 transition-colors"
              >
                Blog
              </button>
              <button 
                onClick={() => navigate('/events')}
                className="hover:text-blue-600 transition-colors"
              >
                Eventos
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};