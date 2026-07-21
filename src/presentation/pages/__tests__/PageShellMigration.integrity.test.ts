/**
 * Structural integrity: PageShell migration must not drop primary UI from key pages.
 * Reads shipped source files (not reimplemented logic).
 */
import fs from 'fs';
import path from 'path';

const pagesDir = path.join(__dirname, '..');

function readPage(name: string): string {
  return fs.readFileSync(path.join(pagesDir, name), 'utf8');
}

describe('PageShell migration integrity', () => {
  it('AdminNotificationsPage keeps create modal, user list and pagination', () => {
    const src = readPage('AdminNotificationsPage.tsx');
    expect(src).toContain('<PageShell');
    expect(src).toContain('</PageShell>');
    expect(src).toContain('setShowCreateForm(true)');
    expect(src).toMatch(/showCreateForm\s*&&/);
    expect(src).toContain('fixed inset-0');
    expect(src).toContain('filteredUsers');
    expect(src).toContain('usePagination');
    expect(src).toContain('<Pagination');
    expect(src).toContain('Buscar Usuários');
    // must not be a truncated shell-only page
    expect(src.split('\n').length).toBeGreaterThan(400);
  });

  it('NotificationsPage keeps Total/Não lidas/Lidas stats', () => {
    const src = readPage('NotificationsPage.tsx');
    expect(src).toContain('<PageShell');
    expect(src).toContain('</PageShell>');
    expect(src).toContain('stats.total');
    expect(src).toContain('stats.unread');
    expect(src).toContain('stats.read');
    expect(src).toContain('Total');
    expect(src).toContain('Não lidas');
    expect(src).toContain('Lidas');
    expect(src).toContain('NotificationsList');
  });

  it('no in-scope panel page keeps old dual shell without PageShell', () => {
    const exclude = new Set([
      'LoginPage.tsx',
      'RegisterPage.tsx',
      'SetupPage.tsx',
      'PendingApprovalPage.tsx',
      'WelcomePage.tsx',
      'AboutPage.tsx',
      'DonatePage.tsx',
      'ContactPage.tsx',
      'VisitorSelfRegistrationPage.tsx',
    ]);
    const residual: string[] = [];
    for (const file of fs.readdirSync(pagesDir)) {
      if (!file.endsWith('Page.tsx') || exclude.has(file)) continue;
      const src = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      const hasShell = src.includes('<PageShell');
      const hasOld =
        src.includes('min-h-screen bg-gray-50') &&
        src.includes('bg-white shadow') &&
        src.includes('max-w-7xl') &&
        !hasShell;
      if (hasOld) residual.push(file);
    }
    expect(residual).toEqual([]);
  });
});
