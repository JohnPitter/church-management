import { getRoleHomePath, getStaffHomeRedirect } from '../roleHomePath';

describe('getRoleHomePath', () => {
  it('routes specialized roles to their working area', () => {
    expect(getRoleHomePath('admin')).toBe('/admin');
    expect(getRoleHomePath('pedagogical_coordinator')).toBe('/admin');
    expect(getRoleHomePath('professional')).toBe('/professional');
    expect(getRoleHomePath('educator')).toBe('/educator');
    expect(getRoleHomePath('secretary')).toBe('/painel');
  });
});

describe('getStaffHomeRedirect', () => {
  it('sends professional and educator away from the public home', () => {
    expect(getStaffHomeRedirect('professional')).toBe('/professional');
    expect(getStaffHomeRedirect('educator')).toBe('/educator');
    expect(getStaffHomeRedirect('admin')).toBeNull();
    expect(getStaffHomeRedirect('member')).toBeNull();
  });
});
