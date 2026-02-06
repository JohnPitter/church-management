// Domain Entity - Layout Templates
// Pre-designed layout templates with distinct design philosophies

import {
  HomeLayout,
  ComponentType,
  HomeComponent
} from './HomeBuilder';

export enum LayoutStyle {
  CANVA = 'canva',
  APPLE = 'apple',
  ENTERPRISE = 'enterprise'
}

export interface LayoutTemplateMetadata {
  id: string;
  name: string;
  description: string;
  style: LayoutStyle;
  icon: string;
  preview: string;
  designPrinciples: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

/**
 * Layout Template Factory
 * Creates pre-designed layouts following specific design philosophies
 */
export class LayoutTemplateFactory {

  /**
   * Get all available layout templates metadata
   */
  static getAllTemplates(): LayoutTemplateMetadata[] {
    return [
      {
        id: 'canva',
        name: 'Canva Design',
        description: 'Vibrante, colorido e criativo com gradientes ousados e tipografia expressiva',
        style: LayoutStyle.CANVA,
        icon: '🎨',
        preview: 'canva-preview.jpg',
        designPrinciples: [
          'Gradientes vibrantes e cores ousadas',
          'Tipografia expressiva e moderna',
          'Cards coloridos com sombras profundas',
          'Animações chamativas e divertidas',
          'Layout assimétrico e dinâmico'
        ],
        colorScheme: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#ffe66d',
          background: '#f7f7f7'
        }
      },
      {
        id: 'apple',
        name: 'Apple Design',
        description: 'Minimalista, elegante e focado em espaços em branco com animações suaves',
        style: LayoutStyle.APPLE,
        icon: '🍎',
        preview: 'apple-preview.jpg',
        designPrinciples: [
          'Minimalismo extremo e espaços em branco',
          'Tipografia limpa e legível (SF Pro)',
          'Animações suaves e naturais',
          'Foco no conteúdo essencial',
          'Hierarquia visual clara'
        ],
        colorScheme: {
          primary: '#000000',
          secondary: '#0071e3',
          accent: '#06c',
          background: '#ffffff'
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise Design',
        description: 'Profissional, estruturado e corporativo com foco em dados e credibilidade',
        style: LayoutStyle.ENTERPRISE,
        icon: '🏢',
        preview: 'enterprise-preview.jpg',
        designPrinciples: [
          'Layout estruturado e previsível',
          'Paleta de cores profissional',
          'Ênfase em dados e métricas',
          'Tipografia corporativa',
          'Credibilidade e confiança'
        ],
        colorScheme: {
          primary: '#1e3a8a',
          secondary: '#475569',
          accent: '#0ea5e9',
          background: '#f8fafc'
        }
      }
    ];
  }

  /**
   * Create Canva-style layout
   * Vibrant, colorful, bold gradients, playful
   */
  static createCanvaLayout(churchName: string = 'Nossa Igreja'): HomeLayout {
    const components: HomeComponent[] = [
      // 1. Canva-style Hero with bold gradient
      {
        id: 'canva-hero',
        type: ComponentType.HERO,
        order: 1,
        enabled: true,
        settings: {
          showClock: true,
          showDate: true,
          title: `Seja Bem-Vindo! ${churchName} ✨`,
          subtitle: 'Juntos construímos uma comunidade de amor, fé e transformação',
          backgroundType: 'gradient',
          gradientDirection: 'to bottom right',
          gradientStartColor: '#ff6b6b',
          gradientEndColor: '#4ecdc4',
          textColor: '#ffffff',
          titleGradient: 'from-yellow-300 via-pink-300 to-purple-400',
          alignment: 'center',
          padding: { top: '6rem', bottom: '6rem' },
          borderRadius: '0',
          decorativeCircles: true
        }
      },
      // 2. Colorful quick action cards
      {
        id: 'canva-actions',
        type: ComponentType.ACTION_CARDS,
        order: 2,
        enabled: true,
        settings: {
          layout: 'grid',
          columns: 3,
          gap: '2rem',
          maxWidth: '80rem',
          margin: { top: '-3rem', bottom: '4rem' },
          cards: [
            {
              id: 'live',
              title: 'Ao Vivo Agora',
              description: 'Assista nosso culto',
              icon: '🎥',
              link: '/live',
              gradient: 'from-red-500 via-pink-500 to-rose-500',
              shadow: '2xl',
              badge: { text: 'LIVE', color: 'yellow', animated: true }
            },
            {
              id: 'events',
              title: 'Próximos Eventos',
              description: 'Não perca nada',
              icon: '🎉',
              link: '/events',
              gradient: 'from-purple-500 via-violet-500 to-indigo-500',
              shadow: '2xl'
            },
            {
              id: 'blog',
              title: 'Blog & Reflexões',
              description: 'Inspire-se',
              icon: '✨',
              link: '/blog',
              gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
              shadow: '2xl'
            }
          ]
        }
      },
      // 3. Bold verse of the day
      {
        id: 'canva-verse',
        type: ComponentType.VERSE_OF_DAY,
        order: 3,
        enabled: true,
        settings: {
          icon: '📖',
          title: 'Palavra do Dia',
          backgroundType: 'gradient',
          gradientStartColor: '#ffe66d',
          gradientEndColor: '#ffb347',
          textColor: '#1a1a1a',
          borderRadius: '2rem',
          shadow: '2xl',
          padding: '3rem',
          maxWidth: '64rem',
          margin: { bottom: '4rem' }
        }
      },
      // 4. Welcome banner with personality
      {
        id: 'canva-welcome',
        type: ComponentType.WELCOME,
        order: 4,
        enabled: true,
        settings: {
          showOnlyForLoggedUsers: true,
          gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
          title: 'Olá, {{userName}}! 👋',
          message: 'Que alegria ter você aqui! Explore tudo que preparamos especialmente para você hoje.',
          borderRadius: '2rem',
          shadow: '2xl',
          padding: '3rem',
          decorativeCircles: true,
          margin: { bottom: '4rem' }
        }
      },
      // 5. Section title with flair
      {
        id: 'canva-section-title',
        type: ComponentType.SECTION_TITLE,
        order: 5,
        enabled: true,
        settings: {
          title: 'Explore Nossa Comunidade 🚀',
          subtitle: 'Descubra tudo que temos para você',
          alignment: 'center',
          titleGradient: 'from-pink-500 via-red-500 to-yellow-500',
          margin: { bottom: '3rem' }
        }
      },
      // 6. Colorful feature grid
      {
        id: 'canva-features',
        type: ComponentType.SERVICES,
        order: 6,
        enabled: true,
        settings: {
          columns: { mobile: 1, tablet: 2, desktop: 3 },
          gap: '2rem',
          features: [
            { title: 'Eventos', description: 'Programe-se com a gente', icon: '📅', link: '/events', gradient: 'from-blue-400 to-cyan-400' },
            { title: 'Blog', description: 'Mensagens inspiradoras', icon: '📖', link: '/blog', gradient: 'from-green-400 to-emerald-400' },
            { title: 'Projetos', description: 'Faça a diferença', icon: '🤝', link: '/projects', gradient: 'from-purple-400 to-pink-400' },
            { title: 'Transmissões', description: 'Cultos ao vivo', icon: '📺', link: '/live', gradient: 'from-red-400 to-orange-400' },
            { title: 'Aniversariantes', description: 'Comemore conosco', icon: '🎂', link: '/birthdays', gradient: 'from-yellow-400 to-amber-400' },
            { title: 'Liderança', description: 'Nossa equipe', icon: '👥', link: '/leadership', gradient: 'from-indigo-400 to-blue-400' },
            { title: 'Devocionais', description: 'Alimento diário', icon: '🙏', link: '/devotionals', gradient: 'from-pink-400 to-rose-400' },
            { title: 'Fórum', description: 'Converse com todos', icon: '💬', link: '/forum', gradient: 'from-teal-400 to-cyan-400' },
            { title: 'Perfil', description: 'Suas informações', icon: '👤', link: '/profile', gradient: 'from-gray-400 to-slate-400' }
          ],
          cardStyle: {
            borderRadius: '1.5rem',
            shadow: 'xl',
            padding: '2rem',
            hoverEffect: 'lift-rotate',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }
      },
      // 7. Events with bold styling
      {
        id: 'canva-events',
        type: ComponentType.EVENTS,
        order: 7,
        enabled: true,
        settings: {
          title: 'Não Perca! 🎯',
          maxEvents: 3,
          showConfirmButton: true,
          cardStyle: 'colorful',
          backgroundColor: '#fff',
          borderRadius: '1.5rem',
          shadow: 'xl',
          margin: { top: '4rem', bottom: '4rem' }
        }
      }
    ];

    return {
      id: '',
      name: 'Layout Canva Design',
      description: 'Design vibrante e colorido inspirado no Canva',
      components,
      globalSettings: {
        backgroundColor: '#f7f7f7',
        primaryColor: '#ff6b6b',
        secondaryColor: '#4ecdc4',
        fontFamily: 'Poppins, sans-serif',
        containerWidth: '1400px',
        spacing: '2rem'
      },
      isActive: false,
      isDefault: false,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  }

  /**
   * Create Apple-style layout
   * Minimalist, clean, lots of whitespace, subtle
   */
  static createAppleLayout(churchName: string = 'Nossa Igreja'): HomeLayout {
    const components: HomeComponent[] = [
      // 1. Minimalist hero
      {
        id: 'apple-hero',
        type: ComponentType.HERO,
        order: 1,
        enabled: true,
        settings: {
          showClock: false,
          showDate: true,
          title: churchName,
          subtitle: 'Fé. Esperança. Comunidade.',
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          textColor: '#1d1d1f',
          titleGradient: 'none',
          alignment: 'center',
          padding: { top: '8rem', bottom: '4rem' },
          maxWidth: '800px'
        }
      },
      // 2. Clean verse display
      {
        id: 'apple-verse',
        type: ComponentType.VERSE_OF_DAY,
        order: 2,
        enabled: true,
        settings: {
          icon: '',
          title: '',
          backgroundType: 'solid',
          backgroundColor: '#f5f5f7',
          textColor: '#1d1d1f',
          borderRadius: '1rem',
          shadow: 'none',
          padding: '4rem',
          maxWidth: '56rem',
          margin: { bottom: '6rem' }
        }
      },
      // 3. Simple welcome
      {
        id: 'apple-welcome',
        type: ComponentType.WELCOME,
        order: 3,
        enabled: true,
        settings: {
          showOnlyForLoggedUsers: true,
          backgroundColor: '#000000',
          textColor: '#ffffff',
          title: 'Bem-vindo de volta, {{userName}}',
          message: 'Que bom ter você aqui.',
          borderRadius: '1rem',
          shadow: 'none',
          padding: '3rem',
          decorativeCircles: false,
          margin: { bottom: '6rem' }
        }
      },
      // 4. Minimal section title
      {
        id: 'apple-section',
        type: ComponentType.SECTION_TITLE,
        order: 4,
        enabled: true,
        settings: {
          title: 'Explore',
          subtitle: '',
          alignment: 'left',
          textColor: '#1d1d1f',
          margin: { bottom: '3rem' },
          padding: { top: '2rem' }
        }
      },
      // 5. Clean feature grid
      {
        id: 'apple-features',
        type: ComponentType.SERVICES,
        order: 5,
        enabled: true,
        settings: {
          columns: { mobile: 1, tablet: 2, desktop: 3 },
          gap: '1.5rem',
          features: [
            { title: 'Eventos', description: 'Veja a programação', icon: '', link: '/events', color: 'minimal' },
            { title: 'Blog', description: 'Leia as mensagens', icon: '', link: '/blog', color: 'minimal' },
            { title: 'Projetos', description: 'Participe', icon: '', link: '/projects', color: 'minimal' },
            { title: 'Ao Vivo', description: 'Assista agora', icon: '', link: '/live', color: 'minimal' },
            { title: 'Aniversários', description: 'Celebre', icon: '', link: '/birthdays', color: 'minimal' },
            { title: 'Liderança', description: 'Conheça', icon: '', link: '/leadership', color: 'minimal' }
          ],
          cardStyle: {
            backgroundColor: '#f5f5f7',
            borderRadius: '1rem',
            shadow: 'none',
            padding: '2.5rem',
            hoverEffect: 'subtle-lift',
            transition: 'all 0.3s ease'
          }
        }
      },
      // 6. Simple spacer
      {
        id: 'apple-spacer',
        type: ComponentType.SPACER,
        order: 6,
        enabled: true,
        settings: {
          height: '6rem'
        }
      },
      // 7. Minimal events
      {
        id: 'apple-events',
        type: ComponentType.EVENTS,
        order: 7,
        enabled: true,
        settings: {
          title: 'Próximos',
          maxEvents: 3,
          showConfirmButton: true,
          cardStyle: 'minimal',
          backgroundColor: '#f5f5f7',
          borderRadius: '1rem',
          shadow: 'none',
          margin: { bottom: '6rem' }
        }
      }
    ];

    return {
      id: '',
      name: 'Layout Apple Design',
      description: 'Design minimalista e elegante inspirado na Apple',
      components,
      globalSettings: {
        backgroundColor: '#ffffff',
        primaryColor: '#0071e3',
        secondaryColor: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        containerWidth: '1200px',
        spacing: '1.5rem'
      },
      isActive: false,
      isDefault: false,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  }

  /**
   * Create Enterprise-style layout
   * Professional, structured, data-focused, corporate
   */
  static createEnterpriseLayout(churchName: string = 'Nossa Igreja'): HomeLayout {
    const components: HomeComponent[] = [
      // 1. Professional hero with stats
      {
        id: 'enterprise-hero',
        type: ComponentType.HERO,
        order: 1,
        enabled: true,
        settings: {
          showClock: true,
          showDate: true,
          title: churchName,
          subtitle: 'Transformando vidas através da fé e do serviço à comunidade desde 1985',
          backgroundType: 'gradient',
          gradientDirection: 'to right',
          gradientStartColor: '#1e3a8a',
          gradientEndColor: '#3b82f6',
          textColor: '#ffffff',
          alignment: 'center',
          padding: { top: '5rem', bottom: '5rem' },
          borderRadius: '0'
        }
      },
      // 2. Statistics section
      {
        id: 'enterprise-stats',
        type: ComponentType.STATISTICS,
        order: 2,
        enabled: true,
        settings: {
          title: 'Nossa Comunidade em Números',
          backgroundColor: '#ffffff',
          columns: 4,
          padding: '4rem',
          margin: { bottom: '3rem' },
          stats: [
            { label: 'Membros Ativos', value: '2.500+', icon: '👥' },
            { label: 'Projetos Sociais', value: '15', icon: '🤝' },
            { label: 'Anos de História', value: '38', icon: '⏱️' },
            { label: 'Vidas Impactadas', value: '10k+', icon: '❤️' }
          ]
        }
      },
      // 3. Professional welcome
      {
        id: 'enterprise-welcome',
        type: ComponentType.WELCOME,
        order: 3,
        enabled: true,
        settings: {
          showOnlyForLoggedUsers: true,
          backgroundColor: '#f8fafc',
          textColor: '#1e293b',
          title: 'Bem-vindo, {{userName}}',
          message: 'Acesse seu painel personalizado e acompanhe suas atividades na comunidade.',
          borderRadius: '0.5rem',
          shadow: 'sm',
          padding: '2rem',
          decorativeCircles: false,
          margin: { bottom: '3rem' }
        }
      },
      // 4. Verse with professional styling
      {
        id: 'enterprise-verse',
        type: ComponentType.VERSE_OF_DAY,
        order: 4,
        enabled: true,
        settings: {
          icon: '📖',
          title: 'Versículo do Dia',
          backgroundType: 'solid',
          backgroundColor: '#f1f5f9',
          textColor: '#1e293b',
          borderRadius: '0.5rem',
          shadow: 'sm',
          padding: '2.5rem',
          maxWidth: '64rem',
          margin: { bottom: '3rem' }
        }
      },
      // 5. Structured section title
      {
        id: 'enterprise-section',
        type: ComponentType.SECTION_TITLE,
        order: 5,
        enabled: true,
        settings: {
          title: 'Serviços e Recursos',
          subtitle: 'Tudo que você precisa para se conectar e crescer',
          alignment: 'left',
          textColor: '#1e293b',
          margin: { top: '3rem', bottom: '2rem' },
          borderBottom: '2px solid #e2e8f0'
        }
      },
      // 6. Corporate feature grid
      {
        id: 'enterprise-features',
        type: ComponentType.SERVICES,
        order: 6,
        enabled: true,
        settings: {
          columns: { mobile: 1, tablet: 2, desktop: 4 },
          gap: '1.5rem',
          features: [
            { title: 'Agenda de Eventos', description: 'Calendário completo', icon: '📅', link: '/events', color: 'blue' },
            { title: 'Centro de Mensagens', description: 'Blog e reflexões', icon: '📰', link: '/blog', color: 'blue' },
            { title: 'Projetos Comunitários', description: 'Impacto social', icon: '🏘️', link: '/projects', color: 'blue' },
            { title: 'Transmissões Online', description: 'Cultos ao vivo', icon: '📡', link: '/live', color: 'blue' },
            { title: 'Aniversariantes', description: 'Celebrações', icon: '🎂', link: '/birthdays', color: 'blue' },
            { title: 'Estrutura Organizacional', description: 'Liderança', icon: '🏢', link: '/leadership', color: 'blue' },
            { title: 'Biblioteca de Devocionais', description: 'Conteúdo diário', icon: '📚', link: '/devotionals', color: 'blue' },
            { title: 'Portal de Membros', description: 'Seu perfil', icon: '🔐', link: '/profile', color: 'blue' }
          ],
          cardStyle: {
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            shadow: 'sm',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            hoverEffect: 'border-highlight',
            transition: 'all 0.2s ease'
          }
        }
      },
      // 7. Structured events display
      {
        id: 'enterprise-events',
        type: ComponentType.EVENTS,
        order: 7,
        enabled: true,
        settings: {
          title: 'Próximos Eventos e Programações',
          maxEvents: 4,
          showConfirmButton: true,
          cardStyle: 'structured',
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          shadow: 'sm',
          margin: { top: '3rem', bottom: '3rem' }
        }
      },
      // 8. Contact section
      {
        id: 'enterprise-contact',
        type: ComponentType.CONTACT,
        order: 8,
        enabled: true,
        settings: {
          title: 'Entre em Contato',
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          padding: '3rem',
          alignment: 'center',
          margin: { bottom: '3rem' }
        }
      }
    ];

    return {
      id: '',
      name: 'Layout Enterprise Design',
      description: 'Design profissional e estruturado para organizações corporativas',
      components,
      globalSettings: {
        backgroundColor: '#f8fafc',
        primaryColor: '#1e3a8a',
        secondaryColor: '#0ea5e9',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        containerWidth: '1400px',
        spacing: '1.5rem'
      },
      isActive: false,
      isDefault: false,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  }

  /**
   * Create layout from template style
   */
  static createLayoutFromStyle(style: LayoutStyle, churchName: string = 'Nossa Igreja'): HomeLayout {
    switch (style) {
      case LayoutStyle.CANVA:
        return this.createCanvaLayout(churchName);
      case LayoutStyle.APPLE:
        return this.createAppleLayout(churchName);
      case LayoutStyle.ENTERPRISE:
        return this.createEnterpriseLayout(churchName);
      default:
        return this.createCanvaLayout(churchName);
    }
  }
}
