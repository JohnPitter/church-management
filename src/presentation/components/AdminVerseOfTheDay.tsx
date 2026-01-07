// Admin Verse of the Day Component - For administrative dashboard
// Focused on leadership, management, and responsibility themes
// No API calls, no database queries - just local admin verses

import React, { useState, useEffect } from 'react';
import { adminVerseService } from '../../services/AdminVerseService';
import { AdminVerse } from '../../data/admin-verses';
import { useSettings } from '../contexts/SettingsContext';

export const AdminVerseOfTheDay: React.FC = () => {
  const { settings } = useSettings();
  const [verse, setVerse] = useState<AdminVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('pt-BR'));

  useEffect(() => {
    // Load verse immediately
    loadVerse();

    // Check every minute if the day has changed
    const interval = setInterval(() => {
      const newDate = new Date().toLocaleDateString('pt-BR');
      if (newDate !== currentDate) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📅 Novo dia detectado no admin, atualizando versículo...');
        }
        setCurrentDate(newDate);
        loadVerse();
      }
    }, 60000); // Check every minute

    // Also check when window regains focus
    const handleFocus = () => {
      const newDate = new Date().toLocaleDateString('pt-BR');
      if (newDate !== currentDate) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📅 Novo dia detectado ao focar janela (admin), atualizando versículo...');
        }
        setCurrentDate(newDate);
        loadVerse();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentDate]);

  const loadVerse = () => {
    try {
      setLoading(true);
      const todaysVerse = adminVerseService.getTodaysAdminVerse();
      setVerse(todaysVerse);
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Versículo administrativo carregado:', todaysVerse.reference);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar versículo administrativo:', error);
      // Fallback verse if something goes wrong
      setVerse({
        text: 'Ora, é necessário que o administrador seja fiel.',
        reference: '1 Coríntios 4:2',
        version: 'NTLH'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="rounded-lg shadow-lg mb-8" 
        style={{
          background: `linear-gradient(135deg, ${settings?.primaryColor || '#2563eb'}, ${settings?.secondaryColor || '#7c3aed'})`
        }}
      >
        <div className="px-6 py-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-1/4 mx-auto mb-2"></div>
            <div className="text-xs text-white/70">Carregando versículo administrativo...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return null;
  }

  return (
    <div 
      className="rounded-lg shadow-lg mb-8" 
      style={{
        background: `linear-gradient(135deg, ${settings?.primaryColor || '#2563eb'}, ${settings?.secondaryColor || '#7c3aed'})`
      }}
    >
      <div className="px-6 py-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="text-4xl mr-3">👑</div>
          <div className="text-xs text-white/70 uppercase tracking-wider font-medium">
            Versículo do Líder
          </div>
        </div>
        <blockquote className="text-xl font-medium text-white mb-4 leading-relaxed max-w-4xl mx-auto">
          "{verse.text}"
        </blockquote>
        <p className="text-white/90 text-sm font-medium">
          {verse.reference} ({verse.version})
        </p>
        <div className="mt-6 text-white/80 text-sm">
          Que Deus abençoe sua liderança e sua administração.
        </div>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <a 
            href={`https://www.bible.com/pt/search/bible?query=${encodeURIComponent(verse.reference)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-white/70 hover:text-white transition-colors"
          >
            <span className="mr-1">📖</span>
            Ler contexto completo
          </a>
        </div>
        <div className="mt-2 text-xs text-white/50">
          {currentDate} • Painel Administrativo
        </div>
      </div>
    </div>
  );
};

export default AdminVerseOfTheDay;