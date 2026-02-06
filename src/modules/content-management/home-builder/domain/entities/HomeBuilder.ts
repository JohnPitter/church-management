// Domain Entity - Home Builder
// Entities and types for customizable home page builder

export enum ComponentType {
  MENU = 'menu',
  HERO = 'hero',
  WELCOME = 'welcome',
  SERVICES = 'services',
  EVENTS = 'events',
  BLOG = 'blog',
  TESTIMONIALS = 'testimonials',
  GALLERY = 'gallery',
  CONTACT = 'contact',
  MAP = 'map',
  SCHEDULE = 'schedule',
  DEVOTIONAL = 'devotional',
  PRAYER_REQUEST = 'prayer_request',
  DONATION = 'donation',
  SOCIAL_MEDIA = 'social_media',
  VIDEO = 'video',
  CUSTOM_HTML = 'custom_html',
  SPACER = 'spacer',
  DIVIDER = 'divider',
  STATISTICS = 'statistics',
  TEAM = 'team',
  FAQ = 'faq',
  NEWSLETTER = 'newsletter',
  VERSE_OF_DAY = 'verse_of_day',
  ACTION_CARDS = 'action_cards',
  SECTION_TITLE = 'section_title'
}

export interface ComponentSettings {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  height?: string;
  padding?: string | { top?: string; bottom?: string };
  margin?: string | { top?: string; bottom?: string };
  alignment?: 'left' | 'center' | 'right';
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  itemsToShow?: number;
  autoplay?: boolean;
  interval?: number;
  showButtons?: boolean;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonBackground?: string;
  primaryButtonTextColor?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonBackground?: string;
  secondaryButtonBorderColor?: string;
  secondaryButtonTextColor?: string;
  customCSS?: string;
  customHTML?: string;
  videoUrl?: string;
  mapAddress?: string;
  mapLatitude?: number;
  mapLongitude?: number;
  mapZoom?: number;
  churchName?: string;
  filterCategory?: string;
  sortBy?: 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  // Devotional specific
  devotionalTitle?: string;
  verseText?: string;
  verseReference?: string;
  devotionalReflection?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  // Background settings
  backgroundType?: 'solid' | 'gradient' | 'image';
  gradientDirection?: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  // Header specific
  showClock?: boolean;
  showDate?: boolean;
  // Advanced styling
  backgroundGradient?: string;
  titleGradient?: string;
  gradient?: string;
  borderRadius?: string;
  shadow?: string;
  maxWidth?: string;
  gap?: string;
  layout?: string;
  // Card styling
  cardStyle?: string | Record<string, unknown>;
  // Icon settings
  icon?: string;
  iconColor?: string;
  // Conditional display
  showOnlyForLoggedUsers?: boolean;
  decorativeCircles?: boolean;
  message?: string;
  // Feature/action cards
  cards?: Array<Record<string, unknown>>;
  features?: Array<Record<string, unknown>>;
  // Allow any additional properties for flexibility
  [key: string]: unknown;
}

export interface HomeComponent {
  id: string;
  type: ComponentType;
  order: number;
  enabled: boolean;
  settings: ComponentSettings;
  responsive?: {
    mobile?: ComponentSettings;
    tablet?: ComponentSettings;
    desktop?: ComponentSettings;
  };
}

export interface HomeLayout {
  id: string;
  name: string;
  description?: string;
  components: HomeComponent[];
  globalSettings?: {
    backgroundColor?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    containerWidth?: string;
    spacing?: string;
  };
  isActive: boolean;
  isDefault?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  type: ComponentType;
  icon: string;
  category: 'content' | 'media' | 'interaction' | 'layout' | 'custom' | 'navigation' | 'data' | 'action';
  defaultSettings: ComponentSettings;
  configurable: boolean;
  premium?: boolean;
}

// Component Templates Library
export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'menu',
    name: 'Menu de Navegação',
    description: 'Barra de navegação com links e logo',
    type: ComponentType.MENU,
    icon: '☰',
    category: 'navigation',
    configurable: true,
    defaultSettings: {
      title: 'Menu Principal',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    }
  },
  {
    id: 'hero',
    name: 'Hero Banner',
    description: 'Banner principal com imagem de fundo e call-to-action',
    type: ComponentType.HERO,
    icon: '🖼️',
    category: 'media',
    configurable: true,
    defaultSettings: {
      title: 'Seja Bem-Vindo',
      subtitle: 'Um lugar de fé, esperança e comunhão',
      backgroundImage: '',
      height: '500px',
      alignment: 'center',
      showButtons: true
    }
  },
  {
    id: 'welcome',
    name: 'Mensagem de Boas-Vindas',
    description: 'Seção com mensagem de boas-vindas do pastor',
    type: ComponentType.WELCOME,
    icon: '👋',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Seja Bem-Vindo',
      description: 'Nossa igreja é um lugar de acolhimento e crescimento espiritual.',
      alignment: 'center',
      padding: '60px 20px'
    }
  },
  {
    id: 'services',
    name: 'Horários de Cultos',
    description: 'Grade com horários dos cultos e programações',
    type: ComponentType.SERVICES,
    icon: '⏰',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Nossas Programações',
      columns: 3,
      itemsToShow: 6
    }
  },
  {
    id: 'events',
    name: 'Próximos Eventos',
    description: 'Lista ou carrossel de eventos futuros',
    type: ComponentType.EVENTS,
    icon: '📅',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Próximos Eventos',
      itemsToShow: 3,
      sortBy: 'date',
      sortOrder: 'asc'
    }
  },
  {
    id: 'blog',
    name: 'Últimas Postagens',
    description: 'Posts recentes do blog',
    type: ComponentType.BLOG,
    icon: '📝',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Últimas Mensagens',
      itemsToShow: 3,
      columns: 3
    }
  },
  {
    id: 'testimonials',
    name: 'Testemunhos',
    description: 'Carrossel de testemunhos dos membros',
    type: ComponentType.TESTIMONIALS,
    icon: '💬',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Testemunhos',
      autoplay: true,
      interval: 5000
    }
  },
  {
    id: 'gallery',
    name: 'Galeria de Fotos',
    description: 'Grade de fotos da igreja',
    type: ComponentType.GALLERY,
    icon: '📸',
    category: 'media',
    configurable: true,
    defaultSettings: {
      title: 'Galeria',
      columns: 4,
      itemsToShow: 8
    }
  },
  {
    id: 'contact',
    name: 'Informações de Contato',
    description: 'Seção com informações de contato',
    type: ComponentType.CONTACT,
    icon: '📞',
    category: 'interaction',
    configurable: true,
    defaultSettings: {
      title: 'Entre em Contato',
      alignment: 'center'
    }
  },
  {
    id: 'map',
    name: 'Mapa de Localização',
    description: 'Mapa interativo com a localização da igreja',
    type: ComponentType.MAP,
    icon: '📍',
    category: 'media',
    configurable: true,
    defaultSettings: {
      title: 'Como Chegar',
      height: '400px',
      mapAddress: ''
    }
  },
  {
    id: 'devotional',
    name: 'Devocional do Dia',
    description: 'Versículo ou devocional diário',
    type: ComponentType.DEVOTIONAL,
    icon: '📖',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Devocional do Dia',
      alignment: 'center'
    }
  },
  {
    id: 'prayer',
    name: 'Pedidos de Oração',
    description: 'Formulário para pedidos de oração',
    type: ComponentType.PRAYER_REQUEST,
    icon: '🙏',
    category: 'interaction',
    configurable: true,
    defaultSettings: {
      title: 'Envie seu Pedido de Oração',
      description: 'Estamos aqui para orar por você'
    }
  },
  {
    id: 'donation',
    name: 'Área de Doações',
    description: 'Seção para doações e ofertas',
    type: ComponentType.DONATION,
    icon: '💝',
    category: 'interaction',
    configurable: true,
    defaultSettings: {
      title: 'Contribua',
      description: 'Sua contribuição faz a diferença'
    }
  },
  {
    id: 'social',
    name: 'Redes Sociais',
    description: 'Links para redes sociais',
    type: ComponentType.SOCIAL_MEDIA,
    icon: '🌐',
    category: 'interaction',
    configurable: true,
    defaultSettings: {
      title: 'Siga-nos',
      alignment: 'center'
    }
  },
  {
    id: 'video',
    name: 'Vídeo em Destaque',
    description: 'Player de vídeo incorporado',
    type: ComponentType.VIDEO,
    icon: '🎥',
    category: 'media',
    configurable: true,
    defaultSettings: {
      title: 'Assista',
      videoUrl: '',
      height: '400px'
    }
  },
  {
    id: 'spacer',
    name: 'Espaçamento',
    description: 'Espaço vazio configurável',
    type: ComponentType.SPACER,
    icon: '⬜',
    category: 'layout',
    configurable: true,
    defaultSettings: {
      height: '50px'
    }
  },
  {
    id: 'divider',
    name: 'Divisor',
    description: 'Linha divisória decorativa',
    type: ComponentType.DIVIDER,
    icon: '➖',
    category: 'layout',
    configurable: true,
    defaultSettings: {
      margin: '40px 0'
    }
  },
  {
    id: 'custom',
    name: 'HTML Personalizado',
    description: 'Bloco com HTML customizado',
    type: ComponentType.CUSTOM_HTML,
    icon: '🔧',
    category: 'custom',
    configurable: true,
    defaultSettings: {
      customHTML: ''
    }
  },
  {
    id: 'schedule',
    name: 'Programação',
    description: 'Grade de horários e programações da igreja',
    type: ComponentType.SCHEDULE,
    icon: '📅',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Nossa Programação',
      columns: 2,
      padding: '60px 20px'
    }
  },
  {
    id: 'statistics',
    name: 'Estatísticas',
    description: 'Números da igreja em destaque',
    type: ComponentType.STATISTICS,
    icon: '📊',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Nossa Comunidade',
      columns: 4,
      padding: '60px 20px'
    }
  },
  {
    id: 'team',
    name: 'Equipe',
    description: 'Apresentação da liderança e equipe',
    type: ComponentType.TEAM,
    icon: '👥',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Nossa Equipe',
      columns: 3,
      itemsToShow: 6,
      padding: '60px 20px'
    }
  },
  {
    id: 'faq',
    name: 'Perguntas Frequentes',
    description: 'Seção de perguntas e respostas',
    type: ComponentType.FAQ,
    icon: '❓',
    category: 'content',
    configurable: true,
    defaultSettings: {
      title: 'Perguntas Frequentes',
      padding: '60px 20px'
    }
  },
  {
    id: 'newsletter_signup',
    name: 'Newsletter',
    description: 'Cadastro para receber novidades por e-mail',
    type: ComponentType.NEWSLETTER,
    icon: '📧',
    category: 'interaction',
    configurable: true,
    defaultSettings: {
      title: 'Receba Nossas Novidades',
      description: 'Cadastre-se e receba estudos bíblicos, eventos e inspirações',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff'
    }
  }
];

// Helper class for Home Builder operations
export class HomeBuilderEntity {
  static createDefaultLayout(): HomeLayout {
    return {
      id: '',
      name: 'Layout Padrão Bonito',
      description: 'Layout moderno e atraente para a página inicial',
      components: [
        // 1. Hero Section with Time and Church Name
        {
          id: 'hero-section',
          type: ComponentType.HERO,
          order: 1,
          enabled: true,
          settings: {
            showClock: true,
            showDate: true,
            title: 'Seja bem-vindo! {{churchName}}',
            subtitle: 'Um lugar de fé, esperança e amor. Conecte-se com nossa comunidade e cresça espiritualmente.',
            backgroundGradient: 'from-blue-600/5 to-purple-600/5',
            titleGradient: 'from-blue-600 to-purple-600',
            alignment: 'center',
            padding: {
              top: '4rem',
              bottom: '2rem'
            }
          }
        },
        // 2. Verse of the Day Card
        {
          id: 'verse-of-day',
          type: ComponentType.VERSE_OF_DAY,
          order: 2,
          enabled: true,
          settings: {
            icon: '📖',
            iconColor: '#8b5cf6',
            title: 'Versículo do Dia',
            cardStyle: 'elevated',
            backgroundColor: '#ffffff',
            borderRadius: '1.5rem',
            shadow: 'xl',
            padding: '2rem',
            maxWidth: '64rem',
            margin: {
              top: '0',
              bottom: '3rem'
            }
          }
        },
        // 3. Quick Action Cards (Live, Blog, Events)
        {
          id: 'quick-actions',
          type: ComponentType.ACTION_CARDS,
          order: 3,
          enabled: true,
          settings: {
            layout: 'grid',
            columns: 3,
            gap: '1.5rem',
            maxWidth: '80rem',
            margin: {
              bottom: '4rem'
            },
            cards: [
              {
                id: 'live-action',
                title: 'Assistir Transmissão',
                description: 'Culto ao vivo agora',
                icon: '🎥',
                link: '/live',
                gradient: 'from-red-500 to-pink-500',
                badge: {
                  text: 'AO VIVO',
                  color: 'yellow',
                  animated: true
                }
              },
              {
                id: 'blog-action',
                title: 'Blog',
                description: 'Últimas reflexões',
                icon: '📝',
                link: '/blog',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                id: 'events-action',
                title: 'Eventos',
                description: 'Próximas atividades',
                icon: '📅',
                link: '/events',
                gradient: 'from-green-500 to-emerald-500'
              }
            ]
          }
        },
        // 4. Personalized Welcome Banner (for logged users)
        {
          id: 'welcome-banner',
          type: ComponentType.WELCOME,
          order: 4,
          enabled: true,
          settings: {
            showOnlyForLoggedUsers: true,
            gradient: 'from-blue-600 to-purple-600',
            title: 'Paz do Senhor, {{userName}}! 🙏',
            message: 'Que a graça de Deus ilumine seu dia. Explore tudo que preparamos para fortalecer sua jornada de fé.',
            borderRadius: '1.5rem',
            shadow: '2xl',
            padding: '2rem',
            decorativeCircles: true,
            margin: {
              bottom: '4rem'
            }
          }
        },
        // 5. Section Title
        {
          id: 'explore-title',
          type: ComponentType.SECTION_TITLE,
          order: 5,
          enabled: true,
          settings: {
            title: 'Explore Nossa Comunidade',
            subtitle: 'Tudo que você precisa para crescer na fé e se conectar',
            alignment: 'center',
            margin: {
              bottom: '3rem'
            }
          }
        },
        // 6. Feature Grid (Events, Blog, Projects, etc.)
        {
          id: 'features-grid',
          type: ComponentType.SERVICES,
          order: 6,
          enabled: true,
          settings: {
            columns: {
              mobile: 1,
              tablet: 2,
              desktop: 3
            },
            gap: '2rem',
            features: [
              {
                id: 'events-feature',
                title: 'Eventos',
                description: 'Veja os próximos eventos da nossa igreja',
                icon: '📅',
                link: '/events',
                color: 'blue'
              },
              {
                id: 'blog-feature',
                title: 'Blog',
                description: 'Leia as últimas mensagens e reflexões',
                icon: '📖',
                link: '/blog',
                color: 'green'
              },
              {
                id: 'projects-feature',
                title: 'Projetos',
                description: 'Participe dos projetos da comunidade',
                icon: '🤝',
                link: '/projects',
                color: 'purple'
              },
              {
                id: 'live-feature',
                title: 'Transmissões',
                description: 'Assista aos cultos ao vivo',
                icon: '📺',
                link: '/live',
                color: 'red'
              },
              {
                id: 'birthdays-feature',
                title: 'Aniversariantes',
                description: 'Veja quem está fazendo aniversário',
                icon: '🎂',
                link: '/birthdays',
                color: 'yellow'
              },
              {
                id: 'leadership-feature',
                title: 'Liderança',
                description: 'Conheça nossa liderança',
                icon: '👥',
                link: '/leadership',
                color: 'indigo'
              },
              {
                id: 'devotionals-feature',
                title: 'Devocionais',
                description: 'Leia as mensagens diárias',
                icon: '🙏',
                link: '/devotionals',
                color: 'pink'
              },
              {
                id: 'forum-feature',
                title: 'Fórum',
                description: 'Participe das discussões da comunidade',
                icon: '💬',
                link: '/forum',
                color: 'teal'
              },
              {
                id: 'profile-feature',
                title: 'Perfil',
                description: 'Gerencie suas informações pessoais',
                icon: '👤',
                link: '/profile',
                color: 'gray'
              }
            ],
            cardStyle: {
              backgroundColor: '#ffffff',
              borderRadius: '1.5rem',
              shadow: 'lg',
              padding: '2rem',
              hoverEffect: 'lift',
              transition: 'all 0.3s'
            }
          }
        },
        // 7. Events Display
        {
          id: 'events-display',
          type: ComponentType.EVENTS,
          order: 7,
          enabled: true,
          settings: {
            title: 'Próximos Eventos',
            maxEvents: 3,
            showConfirmButton: true,
            cardStyle: 'elevated',
            margin: {
              top: '4rem',
              bottom: '3rem'
            }
          }
        }
      ],
      globalSettings: {
        backgroundColor: '#f9fafb',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        fontFamily: 'Inter, sans-serif'
      },
      isActive: true,
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  }

  static generateComponentId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateLayout(layout: HomeLayout): string[] {
    const errors: string[] = [];

    if (!layout.name || layout.name.trim() === '') {
      errors.push('Nome do layout é obrigatório');
    }

    if (!layout.components || layout.components.length === 0) {
      errors.push('Layout deve ter pelo menos um componente');
    }

    // Check for duplicate orders
    const orders = layout.components.map(c => c.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      errors.push('Componentes não podem ter a mesma ordem');
    }

    return errors;
  }

  static reorderComponents(components: HomeComponent[]): HomeComponent[] {
    return components
      .sort((a, b) => a.order - b.order)
      .map((comp, index) => ({
        ...comp,
        order: index + 1
      }));
  }
}
