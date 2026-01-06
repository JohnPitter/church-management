// Presentation Page - Home
// Renders customizable home page using Home Builder

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from 'presentation/contexts/AuthContext';
import { usePermissions } from 'presentation/hooks/usePermissions';
import { useTheme } from 'presentation/hooks/useTheme';
import { SystemModule, PermissionAction } from 'domain/entities/Permission';
import { useSettings } from 'presentation/contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { HomeBuilderService } from '@modules/content-management/home-builder/application/services/HomeBuilderService';
import { HomeLayout, HomeBuilderEntity } from '@modules/content-management/home-builder/domain/entities/HomeBuilder';
import { ComponentRenderer } from 'presentation/components/HomeBuilder/ComponentRenderer';
import { BibleVerse, getVerseOfTheDay } from 'data/verses';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db } from 'config/firebase';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const { settings, loading: settingsLoading } = useSettings();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [verseOfDay, setVerseOfDay] = useState<BibleVerse>(getVerseOfTheDay());
  const [activeLayout, setActiveLayout] = useState<HomeLayout | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);

  const homeBuilderService = new HomeBuilderService();

  // Helper to safely convert Firestore timestamp to Date
  const toDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    return new Date();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check every minute if the day has changed
    const checkDayChange = setInterval(() => {
      const newVerse = getVerseOfTheDay();
      if (newVerse.reference !== verseOfDay.reference) {
        setVerseOfDay(newVerse);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkDayChange);
  }, [verseOfDay.reference]);

  useEffect(() => {
    // Load active layout for all users (authenticated and unauthenticated)
    const loadActiveLayout = async () => {
      try {
        setLoadingLayout(true);
        
        // Always check Firestore for active layout (now public for active layouts)
        console.log('🏠 [LOAD] Carregando layout ativo do Firestore...');
        const layout = await homeBuilderService.getActiveLayout();
        console.log('🏠 [LOAD] Layout recebido:', layout ? `${layout.name} (${layout.components.length} componentes)` : 'null');
        setActiveLayout(layout);
      } catch (error) {
        console.warn('🏠 [LOAD] Erro ao carregar layout, usando home clássica:', error);
        setActiveLayout(null);
      } finally {
        setLoadingLayout(false);
      }
    };

    loadActiveLayout();

    // Set up real-time Firestore listener for layout changes (for all users)
    let unsubscribe: (() => void) | null = null;
    
    console.log('🏠 [REALTIME] Configurando listener Firestore para mudanças de layout...');

    try {
      // Listen for active layout changes in real-time
      // Note: This query requires a Firestore index for the 'isActive' field
      // If the index doesn't exist yet, the error handler will fallback to classic home
      const activeLayoutQuery = query(
        collection(db, 'homeLayouts'),
        where('isActive', '==', true),
        limit(1)
      );

      unsubscribe = onSnapshot(
        activeLayoutQuery,
        (snapshot) => {
          console.log('🔥 [FIRESTORE] Mudança detectada nos layouts ativos');

          if (snapshot.empty) {
            console.log('🔥 [FIRESTORE] Nenhum layout ativo encontrado - usando home clássica');
            setActiveLayout(null);
          } else {
            const doc = snapshot.docs[0];
            const data = doc.data();
            
            const layout: HomeLayout = {
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              components: (data.components || []).map((comp: any) => ({
                id: comp.id || '',
                type: comp.type,
                order: comp.order || 0,
                enabled: comp.enabled !== false,
                settings: comp.settings || {},
                responsive: comp.responsive || {}
              })),
              globalSettings: data.globalSettings || {},
              isActive: data.isActive || false,
              isDefault: data.isDefault || false,
              createdBy: data.createdBy || '',
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
              version: data.version || 1
            };
            
            console.log('🔥 [FIRESTORE] Layout ativo atualizado:', layout.name, `(${layout.components.length} componentes)`);
            setActiveLayout(layout);
          }
        },
        (error) => {
          console.error('🔥 [FIRESTORE] Erro no listener:', error);
          console.log('🏠 [FALLBACK] Erro no listener Firestore - usando home clássica');
          setActiveLayout(null);
        }
      );
    } catch (error) {
      console.error('🔥 [FIRESTORE] Erro ao configurar listener:', error);
    }

    return () => {
      if (unsubscribe) {
        console.log('🏠 [REALTIME] Removendo listener...');
        unsubscribe();
      }
    };
  }, []); // Remove dependency on currentUser since we want this to work for all users

  useEffect(() => {
    // Redirect only professionals to their painel (not admins or secretaries)
    if (currentUser && currentUser.role === 'professional' && hasPermission(SystemModule.Assistance, PermissionAction.View)) {
      navigate('/professional');
    }
  }, [currentUser, hasPermission, navigate]);

  // Helper to check if layout should use classic home - memoized to prevent repeated logging
  const shouldUseClassicHome = useMemo(() => {
    // No active layout
    if (!activeLayout) {
      console.log('🏠 [HOME] Using classic home: No active layout');
      return true;
    }

    // Layout has no components
    if (!activeLayout.components || activeLayout.components.length === 0) {
      console.log('🏠 [HOME] Using classic home: Layout has no components');
      return true;
    }

    // Layout is inactive
    if (!activeLayout.isActive) {
      console.log('🏠 [HOME] Using classic home: Layout is inactive');
      return true;
    }

    // All components are disabled/hidden or only spacers/dividers
    const meaningfulComponents = activeLayout.components.filter(component => 
      component.enabled !== false && 
      component.type !== 'spacer' && 
      component.type !== 'divider'
    );
    
    if (meaningfulComponents.length === 0) {
      console.log('🏠 [HOME] Using classic home: No meaningful components visible');
      console.log('🏠 [HOME] Total components:', activeLayout.components.length);
      console.log('🏠 [HOME] Meaningful components:', meaningfulComponents.length);
      return true;
    }

    console.log('🏠 [HOME] Using custom layout with', meaningfulComponents.length, 'meaningful components');
    return false;
  }, [activeLayout]);



  // Loading state
  if (loadingLayout || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando página inicial...</p>
        </div>
      </div>
    );
  }


  // Render custom layout if available and has content
  if (activeLayout && !shouldUseClassicHome) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        margin: '0',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        position: 'static',
        isolation: 'isolate',
        transition: 'background-color 0.3s'
      }}>
        {activeLayout.components
          .filter(component => component.enabled !== false)
          .sort((a, b) => a.order - b.order)
          .map(component => (
            <ComponentRenderer
              key={component.id}
              component={component}
              isEditMode={false}
              isDarkMode={isDarkMode}
            />
          ))
        }
      </div>
    );
  }

  // Fallback to classic home layout when:
  // - No active layout is configured
  // - Layout has no components 
  // - Layout is inactive
  // - All components are hidden/disabled
  const quickActions = [
    {
      title: 'Assistir Transmissão',
      description: 'Culto ao vivo agora',
      icon: '🎥',
      action: () => navigate('/live'),
      highlight: true,
      color: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
    },
    {
      title: 'Blog',
      description: 'Últimas reflexões',
      icon: '📝',
      action: () => navigate('/blog'),
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
    },
    {
      title: 'Eventos',
      description: 'Próximas atividades',
      icon: '📅',
      action: () => navigate('/events'),
      color: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
    }
  ];

  const memberFeatures = [
    {
      title: 'Eventos',
      description: 'Veja os próximos eventos da nossa igreja',
      icon: '📅',
      href: '/events',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-800'
    },
    {
      title: 'Blog',
      description: 'Leia as últimas mensagens e reflexões',
      icon: '📖',
      href: '/blog',
      color: 'bg-green-50 hover:bg-green-100 text-green-800'
    },
    {
      title: 'Projetos',
      description: 'Participe dos projetos da comunidade',
      icon: '🤝',
      href: '/projects',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-800'
    },
    {
      title: 'Transmissões',
      description: 'Assista aos cultos ao vivo',
      icon: '📺',
      href: '/live',
      color: 'bg-red-50 hover:bg-red-100 text-red-800'
    },
    {
      title: 'Aniversariantes',
      description: 'Veja quem está fazendo aniversário',
      icon: '🎂',
      href: '/birthdays',
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
    },
    {
      title: 'Liderança',
      description: 'Conheça nossa liderança',
      icon: '👥',
      href: '/leadership',
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
    },
    {
      title: 'Devocionais',
      description: 'Leia as mensagens diárias',
      icon: '🙏',
      href: '/devotionals',
      color: 'bg-pink-50 hover:bg-pink-100 text-pink-800'
    },
    {
      title: 'Fórum',
      description: 'Participe das discussões da comunidade',
      icon: '💬',
      href: '/forum',
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-800'
    },
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais',
      icon: '👤',
      href: '/profile',
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
        <div className="relative container mx-auto px-4 py-16">
          {/* Live Time Display */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 mb-2">
              {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-4xl font-light text-gray-800">
              {format(currentTime, 'HH:mm:ss')}
            </p>
          </div>

          {/* Main Header */}
          <div className="text-center mb-12">
            {loadingLayout ? (
              <div className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg mb-6 max-w-4xl mx-auto"></div>
                <div className="h-8 bg-gray-200 rounded mb-3 max-w-3xl mx-auto"></div>
              </div>
            ) : (
              <>
                <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bem-vindo à {settings?.churchName || 'Igreja'}
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                  Um lugar de fé, esperança e amor. Conecte-se com nossa comunidade e cresça espiritualmente.
                </p>
              </>
            )}
          </div>

          {/* Verse of the Day */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">✝️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Versículo do Dia</h3>
                  <p className="text-gray-700 italic mb-2">"{verseOfDay.text}"</p>
                  <p className="text-sm text-gray-600 font-medium">{verseOfDay.reference}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden`}
              >
                {action.highlight && (
                  <div className="absolute top-2 right-2 z-20">
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      AO VIVO
                    </span>
                  </div>
                )}
                <div className="relative z-10">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Welcome message for authenticated users */}
        {currentUser && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3">
                Paz do Senhor, {currentUser.displayName || currentUser.email}! 🙏
              </h2>
              <p className="text-lg opacity-90">
                Que a graça de Deus ilumine seu dia. Explore tudo que preparamos para fortalecer sua jornada de fé.
              </p>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Explore Nossa Comunidade</h2>
          <p className="text-lg text-gray-600">Tudo que você precisa para crescer na fé e se conectar</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memberFeatures.map((feature, index) => (
            <button
              key={index}
              onClick={() => navigate(feature.href)}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Call to Action */}
        {!currentUser && (
          <div className="mt-20">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-6">🙏</div>
                <h3 className="text-3xl font-bold mb-4">
                  Junte-se à Nossa Família de Fé
                </h3>
                <p className="text-lg mb-8 opacity-90">
                  Faça parte de uma comunidade que vive e compartilha o amor de Cristo
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="block w-full bg-white text-blue-600 py-4 px-8 rounded-xl font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Entrar na Minha Conta
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="block w-full bg-transparent border-2 border-white text-white py-4 px-8 rounded-xl font-bold hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
                  >
                    Criar Minha Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-20 text-center pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Nossa Missão</h3>
              <p className="text-gray-600 leading-relaxed">
                Levar o amor de Cristo a todos, criando uma comunidade acolhedora onde cada pessoa possa crescer em sua fé, 
                descobrir seu propósito e fazer a diferença no mundo através do serviço ao próximo.
              </p>
            </div>
            <div className="flex justify-center space-x-6 text-gray-500">
              <a href="/contact" className="hover:text-blue-600 transition-colors">Contato</a>
              <span>•</span>
              <a href="/about" className="hover:text-blue-600 transition-colors">Sobre Nós</a>
              <span>•</span>
              <a href="/location" className="hover:text-blue-600 transition-colors">Localização</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
