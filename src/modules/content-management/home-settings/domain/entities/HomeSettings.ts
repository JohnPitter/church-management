// Domain Entity - Home Settings (Simplified)
// Simple configuration for home page layout and sections

export enum HomeLayoutStyle {
  CANVA = 'canva',
  APPLE = 'apple',
  ENTERPRISE = 'enterprise'
}

export interface HomeSectionVisibility {
  // Common sections across all layouts
  hero: boolean;
  verseOfDay: boolean;
  quickActions: boolean;
  welcomeBanner: boolean; // Only for logged users
  features: boolean;
  events: boolean;
  statistics: boolean; // Only visible in Enterprise by default
  contact: boolean; // Only visible in Enterprise by default
  testimonials: boolean; // Optional section
  socialMedia: boolean; // Optional section
}

export interface HomeSettings {
  id: string;
  layoutStyle: HomeLayoutStyle;
  sections: HomeSectionVisibility;
  customization?: {
    churchName?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

export const DEFAULT_HOME_SETTINGS: Omit<HomeSettings, 'id' | 'updatedAt' | 'updatedBy'> = {
  layoutStyle: HomeLayoutStyle.CANVA,
  sections: {
    hero: true,
    verseOfDay: true,
    quickActions: true,
    welcomeBanner: true,
    features: true,
    events: true,
    statistics: false,
    contact: false,
    testimonials: false,
    socialMedia: true
  },
  customization: {}
};

export const LAYOUT_STYLE_INFO = {
  [HomeLayoutStyle.CANVA]: {
    name: 'Canva Design',
    description: 'Vibrante, colorido e criativo com gradientes ousados',
    icon: '🎨',
    colors: {
      primary: '#ff3366',      // Rosa/vermelho vibrante
      secondary: '#9333ea',    // Roxo intenso
      accent: '#f59e0b'        // Laranja/amarelo
    },
    characteristics: [
      'Gradientes vibrantes rosa e roxo',
      'Tipografia expressiva e ousada',
      'Cards coloridos e animados',
      'Energia e criatividade'
    ]
  },
  [HomeLayoutStyle.APPLE]: {
    name: 'Apple Design',
    description: 'Minimalista e elegante com muito espaço em branco',
    icon: '🍎',
    colors: {
      primary: '#000000',      // Preto puro
      secondary: '#f5f5f7',    // Cinza clarissimo
      accent: '#0071e3'        // Azul Apple
    },
    characteristics: [
      'Minimalismo extremo e sofisticado',
      'Espaços em branco generosos',
      'Tipografia gigante e limpa',
      'Elegância e simplicidade'
    ]
  },
  [HomeLayoutStyle.ENTERPRISE]: {
    name: 'Enterprise Design',
    description: 'Profissional e estruturado com foco em credibilidade',
    icon: '🏢',
    colors: {
      primary: '#1e40af',      // Azul profissional forte
      secondary: '#0891b2',    // Azul ciano
      accent: '#059669'        // Verde corporativo
    },
    characteristics: [
      'Layout estruturado e organizado',
      'Paleta azul profissional',
      'Ênfase em credibilidade',
      'Tipografia corporativa clara'
    ]
  }
};

export const SECTION_INFO = {
  hero: {
    name: 'Banner Principal',
    description: 'Cabeçalho com título, subtítulo e informações principais',
    required: true
  },
  verseOfDay: {
    name: 'Versículo do Dia',
    description: 'Exibe o versículo bíblico do dia',
    required: false
  },
  quickActions: {
    name: 'Ações Rápidas',
    description: 'Botões para Live, Eventos e Blog',
    required: true
  },
  welcomeBanner: {
    name: 'Banner de Boas-vindas',
    description: 'Mensagem personalizada para usuários logados',
    required: false
  },
  features: {
    name: 'Recursos/Funcionalidades',
    description: 'Grade com links para todas as funcionalidades do sistema',
    required: true
  },
  events: {
    name: 'Próximos Eventos',
    description: 'Lista dos eventos futuros',
    required: false
  },
  statistics: {
    name: 'Estatísticas',
    description: 'Números da igreja (membros, projetos, anos, etc.)',
    required: false
  },
  contact: {
    name: 'Informações de Contato',
    description: 'Endereço, telefone, email, mapa',
    required: false
  },
  testimonials: {
    name: 'Testemunhos',
    description: 'Depoimentos de membros',
    required: false
  },
  socialMedia: {
    name: 'Redes Sociais',
    description: 'Links para redes sociais da igreja',
    required: false
  }
};
