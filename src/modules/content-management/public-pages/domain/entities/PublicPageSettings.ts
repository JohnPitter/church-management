// Domain Entity - Public Page Settings
// Manages which pages can be accessed by non-authenticated users

export enum PublicPage {
  Home = 'home',
  Events = 'events',
  Blog = 'blog',
  Projects = 'projects',
  Devotionals = 'devotionals',
  Forum = 'forum',
  Live = 'live'
}

export interface PublicPageConfig {
  page: PublicPage;
  isPublic: boolean;
  allowRegistration?: boolean;  // For events, forum, etc.
  description: string;
}

export const DEFAULT_PUBLIC_PAGES: PublicPageConfig[] = [
  {
    page: PublicPage.Home,
    isPublic: true,
    description: 'Página inicial da igreja'
  },
  {
    page: PublicPage.Events,
    isPublic: true,
    allowRegistration: true,
    description: 'Lista de eventos da igreja'
  },
  {
    page: PublicPage.Blog,
    isPublic: false,
    description: 'Postagens do blog da igreja'
  },
  {
    page: PublicPage.Projects,
    isPublic: false,
    description: 'Projetos e ações da igreja'
  },
  {
    page: PublicPage.Devotionals,
    isPublic: false,
    description: 'Devocionais diários'
  },
  {
    page: PublicPage.Forum,
    isPublic: false,
    allowRegistration: true,
    description: 'Fórum de discussões'
  },
  {
    page: PublicPage.Live,
    isPublic: true,
    description: 'Transmissões ao vivo'
  }
];

// Helper class for public page management
export class PublicPageManager {
  static getPageLabel(page: PublicPage): string {
    const labels: Record<PublicPage, string> = {
      [PublicPage.Home]: 'Página Inicial',
      [PublicPage.Events]: 'Eventos',
      [PublicPage.Blog]: 'Blog',
      [PublicPage.Projects]: 'Projetos',
      [PublicPage.Devotionals]: 'Devocionais',
      [PublicPage.Forum]: 'Fórum',
      [PublicPage.Live]: 'Transmissões'
    };
    return labels[page];
  }

  static getPageRoute(page: PublicPage): string {
    const routes: Record<PublicPage, string> = {
      [PublicPage.Home]: '/',
      [PublicPage.Events]: '/events',
      [PublicPage.Blog]: '/blog',
      [PublicPage.Projects]: '/projects',
      [PublicPage.Devotionals]: '/devotionals',
      [PublicPage.Forum]: '/forum',
      [PublicPage.Live]: '/live'
    };
    return routes[page];
  }

  static isPagePublic(page: PublicPage, configs: PublicPageConfig[]): boolean {
    const config = configs.find(c => c.page === page);
    return config?.isPublic ?? false;
  }

  static canRegisterAnonymously(page: PublicPage, configs: PublicPageConfig[]): boolean {
    const config = configs.find(c => c.page === page);
    return config?.isPublic === true && config?.allowRegistration === true;
  }
}