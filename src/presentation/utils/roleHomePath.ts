export function getRoleHomePath(role?: string): string {
  if (role === 'admin' || role === 'pedagogical_coordinator') {
    return '/admin';
  }
  if (role === 'professional') {
    return '/professional';
  }
  if (role === 'educator') {
    return '/educator';
  }
  return '/painel';
}

/** Dedicated home (not the generic /painel) — used to bounce staff off public `/`. */
export function getStaffHomeRedirect(role?: string): string | null {
  if (role === 'professional' || role === 'educator') {
    return getRoleHomePath(role);
  }
  return null;
}
