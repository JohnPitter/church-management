// Domain Entity - Permission
// Core permission system for role-based access control

export enum SystemModule {
  // Core Modules
  Dashboard = 'dashboard',
  Users = 'users',
  Members = 'members',
  
  // Content Management
  Blog = 'blog',
  Events = 'events',
  Devotionals = 'devotionals',
  Transmissions = 'transmissions',
  Projects = 'projects',
  Forum = 'forum',
  
  // Church Management
  Visitors = 'visitors',
  Calendar = 'calendar',
  Assistance = 'assistance',
  Assistidos = 'assistidos',
  Notifications = 'notifications',
  Communication = 'communication',
  ONG = 'ong',
  
  // Financial
  Finance = 'finance',
  Donations = 'donations',
  Reports = 'reports',
  Assets = 'assets',

  // System
  Settings = 'settings',
  Permissions = 'permissions',
  Audit = 'audit',
  Backup = 'backup',
  HomeBuilder = 'home_builder'
}

export enum PermissionAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Import = 'import',
  Approve = 'approve',
  Manage = 'manage'
}

export interface Permission {
  id: string;
  module: SystemModule;
  action: PermissionAction;
  description: string;
}

export interface RolePermission {
  role: string;
  permissions: Permission[];
}

export interface UserPermissionOverride {
  userId: string;
  grantedPermissions: Permission[];
  revokedPermissions: Permission[];
}

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, { module: SystemModule; actions: PermissionAction[] }[]> = {
  admin: [
    // Full access to all modules
    { module: SystemModule.Dashboard, actions: [PermissionAction.View, PermissionAction.Manage] },
    { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
    { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export, PermissionAction.Import] },
    { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Approve] },
    { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
    { module: SystemModule.Devotionals, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete] },
    { module: SystemModule.Transmissions, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete] },
    { module: SystemModule.Projects, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Approve] },
    { module: SystemModule.Forum, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
    { module: SystemModule.Visitors, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View, PermissionAction.Manage] },
    { module: SystemModule.Assistance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Approve] },
    { module: SystemModule.Assistidos, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
    { module: SystemModule.Notifications, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Manage] },
    { module: SystemModule.ONG, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export, PermissionAction.Manage] },
    { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export, PermissionAction.Manage] },
    { module: SystemModule.Donations, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export] },
    { module: SystemModule.Reports, actions: [PermissionAction.View, PermissionAction.Export] },
    { module: SystemModule.Assets, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export, PermissionAction.Manage] },
    { module: SystemModule.Settings, actions: [PermissionAction.View, PermissionAction.Update, PermissionAction.Manage] },
    { module: SystemModule.Permissions, actions: [PermissionAction.View, PermissionAction.Update, PermissionAction.Manage] },
    { module: SystemModule.Audit, actions: [PermissionAction.View, PermissionAction.Export] },
    { module: SystemModule.Backup, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Manage] },
    { module: SystemModule.HomeBuilder, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] }
  ],
  
  secretary: [
    { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
    { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Update] },
    { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Export] },
    { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Devotionals, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Transmissions, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Projects, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Forum, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Visitors, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Export] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View, PermissionAction.Manage] },
    { module: SystemModule.Assistidos, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Notifications, actions: [PermissionAction.View, PermissionAction.Create] },
    { module: SystemModule.Reports, actions: [PermissionAction.View, PermissionAction.Export] },
    { module: SystemModule.Settings, actions: [PermissionAction.View] }
  ],
  
  professional: [
    { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
    { module: SystemModule.Assistance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
    { module: SystemModule.Members, actions: [PermissionAction.View] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View] },
    { module: SystemModule.Reports, actions: [PermissionAction.View] }
  ],
  
  leader: [
    { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
    { module: SystemModule.Members, actions: [PermissionAction.View] },
    { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create] },
    { module: SystemModule.Projects, actions: [PermissionAction.View, PermissionAction.Create] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View] }
  ],
  
  member: [
    { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
    { module: SystemModule.Events, actions: [PermissionAction.View] },
    { module: SystemModule.Blog, actions: [PermissionAction.View] },
    { module: SystemModule.Devotionals, actions: [PermissionAction.View] },
    { module: SystemModule.Transmissions, actions: [PermissionAction.View] },
    { module: SystemModule.Projects, actions: [PermissionAction.View] },
    { module: SystemModule.Forum, actions: [PermissionAction.View, PermissionAction.Create] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View] }
  ],

  finance: [
    { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
    { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export, PermissionAction.Manage] },
    { module: SystemModule.Donations, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Export] },
    { module: SystemModule.Reports, actions: [PermissionAction.View, PermissionAction.Export] },
    { module: SystemModule.Members, actions: [PermissionAction.View] },
    { module: SystemModule.Calendar, actions: [PermissionAction.View] }
  ]
};

// Helper class for permission checks
export class PermissionManager {
  static hasPermission(
    userRole: string,
    module: SystemModule,
    action: PermissionAction,
    overrides?: UserPermissionOverride
  ): boolean {
    // Check if permission is revoked via override
    if (overrides?.revokedPermissions) {
      const isRevoked = overrides.revokedPermissions.some(
        p => p.module === module && p.action === action
      );
      if (isRevoked) return false;
    }
    
    // Check if permission is granted via override
    if (overrides?.grantedPermissions) {
      const isGranted = overrides.grantedPermissions.some(
        p => p.module === module && p.action === action
      );
      if (isGranted) return true;
    }
    
    // Check default role permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
    if (!rolePermissions) return false;
    
    const modulePermission = rolePermissions.find(p => p.module === module);
    if (!modulePermission) return false;
    
    return modulePermission.actions.includes(action);
  }
  
  static getRolePermissions(role: string): Permission[] {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
    if (!rolePermissions) return [];
    
    const permissions: Permission[] = [];
    
    rolePermissions.forEach(mp => {
      mp.actions.forEach(action => {
        permissions.push({
          id: `${mp.module}_${action}`,
          module: mp.module,
          action: action,
          description: `${action} permission for ${mp.module}`
        });
      });
    });
    
    return permissions;
  }
  
  static getAllModules(): SystemModule[] {
    return Object.values(SystemModule);
  }
  
  static getAllActions(): PermissionAction[] {
    return Object.values(PermissionAction);
  }
  
  static getModuleLabel(module: SystemModule): string {
    const labels: Record<SystemModule, string> = {
      [SystemModule.Dashboard]: 'Dashboard',
      [SystemModule.Users]: 'Usuários',
      [SystemModule.Members]: 'Membros',
      [SystemModule.Blog]: 'Blog',
      [SystemModule.Events]: 'Eventos',
      [SystemModule.Devotionals]: 'Devocionais',
      [SystemModule.Transmissions]: 'Transmissões',
      [SystemModule.Projects]: 'Projetos',
      [SystemModule.Forum]: 'Fórum',
      [SystemModule.Visitors]: 'Visitantes',
      [SystemModule.Calendar]: 'Calendário',
      [SystemModule.Assistance]: 'Assistência',
      [SystemModule.Assistidos]: 'Assistidos',
      [SystemModule.Notifications]: 'Notificações',
      [SystemModule.Communication]: 'Comunicação',
      [SystemModule.ONG]: 'Gerenciamento ONG',
      [SystemModule.Finance]: 'Finanças',
      [SystemModule.Donations]: 'Doações',
      [SystemModule.Reports]: 'Relatórios',
      [SystemModule.Assets]: 'Patrimônio',
      [SystemModule.Settings]: 'Configurações',
      [SystemModule.Permissions]: 'Permissões',
      [SystemModule.Audit]: 'Auditoria',
      [SystemModule.Backup]: 'Backup & Dados',
      [SystemModule.HomeBuilder]: 'Construtor da Home'
    };
    return labels[module];
  }
  
  static getActionLabel(action: PermissionAction): string {
    const labels: Record<PermissionAction, string> = {
      [PermissionAction.View]: 'Visualizar',
      [PermissionAction.Create]: 'Criar',
      [PermissionAction.Update]: 'Editar',
      [PermissionAction.Delete]: 'Excluir',
      [PermissionAction.Export]: 'Exportar',
      [PermissionAction.Import]: 'Importar',
      [PermissionAction.Approve]: 'Aprovar',
      [PermissionAction.Manage]: 'Gerenciar'
    };
    return labels[action];
  }
}
