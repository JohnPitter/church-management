import { SystemModule, PermissionAction } from '../../../domain/entities/Permission';

export type TabId = 'roles' | 'users' | 'custom-roles' | 'public-pages';

export const TAB_CONFIG: ReadonlyArray<{ id: TabId; icon: string; label: string }> = [
  { id: 'roles', icon: '🔐', label: 'Permissões por Função' },
  { id: 'users', icon: '👤', label: 'Permissões por Usuário' },
  { id: 'custom-roles', icon: '🏷️', label: 'Funções Personalizadas' },
  { id: 'public-pages', icon: '🌐', label: 'Páginas Públicas' }
];

export type RolePermissionsMatrix = Map<string, Map<SystemModule, PermissionAction[]>>;

export const cloneRoleMatrix = (matrix: RolePermissionsMatrix): RolePermissionsMatrix => {
  const cloned: RolePermissionsMatrix = new Map();
  matrix.forEach((roleMap, role) => {
    const clonedRoleMap = new Map<SystemModule, PermissionAction[]>();
    roleMap.forEach((actions, module) => {
      clonedRoleMap.set(module, [...actions]);
    });
    cloned.set(role, clonedRoleMap);
  });
  return cloned;
};

export type ModulePermissionList = { module: SystemModule; actions: PermissionAction[] }[];

export const toggleActionInModuleList = (
  list: ModulePermissionList,
  module: SystemModule,
  action: PermissionAction
): ModulePermissionList => {
  const existing = list.find(m => m.module === module);
  if (!existing) {
    return [...list, { module, actions: [action] }];
  }
  const hasAction = existing.actions.includes(action);
  const newActions = hasAction
    ? existing.actions.filter(a => a !== action)
    : [...existing.actions, action];
  if (newActions.length === 0) {
    return list.filter(m => m.module !== module);
  }
  return list.map(m => (m.module === module ? { module, actions: newActions } : m));
};

export const removeActionFromModuleList = (
  list: ModulePermissionList,
  module: SystemModule,
  action: PermissionAction
): ModulePermissionList => {
  const existing = list.find(m => m.module === module);
  if (!existing || !existing.actions.includes(action)) return list;
  const newActions = existing.actions.filter(a => a !== action);
  if (newActions.length === 0) {
    return list.filter(m => m.module !== module);
  }
  return list.map(m => (m.module === module ? { module, actions: newActions } : m));
};

const MODULE_ICONS: Record<string, string> = {
  [SystemModule.Dashboard]: '🏠',
  [SystemModule.Users]: '👥',
  [SystemModule.Members]: '👤',
  [SystemModule.Blog]: '✍️',
  [SystemModule.Events]: '📅',
  [SystemModule.Devotionals]: '📖',
  [SystemModule.Transmissions]: '📺',
  [SystemModule.Projects]: '🎯',
  [SystemModule.Forum]: '💬',
  [SystemModule.Visitors]: '🚪',
  [SystemModule.Calendar]: '📆',
  [SystemModule.Assistance]: '🩺',
  [SystemModule.Assistidos]: '🤝',
  [SystemModule.Notifications]: '🔔',
  [SystemModule.Communication]: '📢',
  [SystemModule.ONG]: '🏢',
  [SystemModule.Finance]: '💰',
  [SystemModule.Donations]: '🎁',
  [SystemModule.Reports]: '📊',
  [SystemModule.Settings]: '⚙️',
  [SystemModule.Permissions]: '🔐',
  [SystemModule.Audit]: '📋',
  [SystemModule.Backup]: '💾',
  [SystemModule.HomeBuilder]: '🏗️'
};

export const getModuleIcon = (module: SystemModule): string => MODULE_ICONS[module] ?? '📄';
