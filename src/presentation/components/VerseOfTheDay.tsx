// Verse of the Day Component - Simple version using local data only
// No API calls, no database queries - just 365 verses mapped to days of the year
import React, { useState, useEffect } from 'react';
import { simpleVerseService } from '../../services/SimpleVerseService';
import { DailyVerse } from '../../data/daily-verses';

export const VerseOfTheDay: React.FC = () => {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('pt-BR'));

  useEffect(() => {
    // Load verse immediately
    loadVerse();

    // Check every minute if the day has changed
    const interval = setInterval(() => {
      const newDate = new Date().toLocaleDateString('pt-BR');
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        loadVerse();
      }
    }, 60000); // Check every minute

    // Also check when window regains focus
    const handleFocus = () => {
      const newDate = new Date().toLocaleDateString('pt-BR');
      if (newDate !== currentDate) {
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
      const todaysVerse = simpleVerseService.getTodaysVerse();
      setVerse(todaysVerse);
    } catch (error) {
      console.error('❌ Erro ao carregar versículo:', error);
      // Fallback verse if something goes wrong
      setVerse({
        text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
        reference: 'João 3:16',
        version: 'NVI'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="theme-gradient rounded-lg shadow-lg mb-8">
        <div className="px-6 py-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-1/4 mx-auto mb-2"></div>
            <div className="text-xs text-green-200">Carregando versículo do dia...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return null;
  }

  return (
    <div className="theme-gradient rounded-lg shadow-lg mb-8">
      <div className="px-6 py-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="text-4xl mr-3">🙏</div>
          <div className="text-xs text-green-200 uppercase tracking-wider font-medium">
            Versículo do Dia
          </div>
        </div>
        <blockquote className="text-xl font-medium text-white mb-4 leading-relaxed max-w-4xl mx-auto">
          "{verse.text}"
        </blockquote>
        <p className="text-green-100 text-sm font-medium">
          {verse.reference} ({verse.version})
        </p>
        <div className="mt-6 text-green-100 text-sm">
          Que Deus abençoe seu dia e sua caminhada de fé.
        </div>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <a 
            href={`https://www.bible.com/pt/search/bible?query=${encodeURIComponent(verse.reference)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-green-200 hover:text-white transition-colors"
          >
            <span className="mr-1">📖</span>
            Ler contexto completo
          </a>
        </div>
        <div className="mt-2 text-xs text-green-200/60">
          {currentDate}
        </div>
      </div>
    </div>
  );
};

export default VerseOfTheDay;