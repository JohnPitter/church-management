export interface ModuleGrant { module: string; actions: string[] }
export interface EvaluationUser {
  role: string;
  status: string;
  displayName?: string;
  rolePermissions?: ModuleGrant[];
  customPermissions?: { granted?: ModuleGrant[]; revoked?: ModuleGrant[] };
}

const defaultActions: Record<string, string[]> = {
  admin: ['view', 'create', 'manage'], secretary: ['view', 'create', 'manage'],
  pedagogical_coordinator: ['view', 'create', 'manage'], educator: ['view', 'create']
};

export function evaluationAccess(user: EvaluationUser, roleModules?: ModuleGrant[]): { view: boolean; create: boolean; collective: boolean } {
  if (user.status !== 'approved') return { view: false, create: false, collective: false };
  if (user.role === 'admin') return { view: true, create: true, collective: true };
  const builtIn = ['secretary', 'pedagogical_coordinator', 'educator', 'professional', 'leader', 'member', 'finance'];
  const modules = !builtIn.includes(user.role) && user.rolePermissions?.length
    ? user.rolePermissions : roleModules;
  const configured = modules?.find(item => item.module === 'pedagogy');
  const actions = new Set(configured?.actions ?? defaultActions[user.role] ?? []);
  user.customPermissions?.granted?.filter(item => item.module === 'pedagogy')
    .forEach(item => item.actions.forEach(action => actions.add(action)));
  user.customPermissions?.revoked?.filter(item => item.module === 'pedagogy')
    .forEach(item => item.actions.forEach(action => actions.delete(action)));
  return {
    view: actions.has('view'), create: actions.has('create'),
    collective: actions.has('view') && (user.role !== 'educator' || actions.has('manage'))
  };
}
