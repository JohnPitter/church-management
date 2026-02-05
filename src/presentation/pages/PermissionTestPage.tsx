// Permission Test Page
// Comprehensive frontend testing for the permission system

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction, DEFAULT_ROLE_PERMISSIONS } from '@/domain/entities/Permission';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { User } from '@/domain/entities/User';

interface TestResult {
  module: string;
  action: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
}

interface UserTestResults {
  user: User;
  results: TestResult[];
  passedCount: number;
  failedCount: number;
}

export const PermissionTestPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, _setTesting] = useState(false);
  const [testResults, setTestResults] = useState<UserTestResults[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const userRepository = new FirebaseUserRepository();

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userRepository.findAll();
      // Filter to get approved users of different roles
      const approvedUsers = allUsers.filter(u => u.status === 'approved');
      setUsers(approvedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get users grouped by role
  const usersByRole = users.reduce((acc, user) => {
    const role = user.role || 'member';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // Test what permissions a specific role should have
  const getExpectedPermissions = (role: string): Map<string, Set<string>> => {
    const expected = new Map<string, Set<string>>();
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || [];

    rolePerms.forEach(perm => {
      if (!expected.has(perm.module)) {
        expected.set(perm.module, new Set());
      }
      perm.actions.forEach(action => {
        expected.get(perm.module)?.add(action);
      });
    });

    return expected;
  };

  // Run tests for current user's permissions
  const runCurrentUserTests = () => {
    if (!currentUser) return;

    const results: TestResult[] = [];
    const role = currentUser.role || 'member';
    const expectedPerms = getExpectedPermissions(role);

    // Test all modules and actions
    Object.values(SystemModule).forEach(module => {
      Object.values(PermissionAction).forEach(action => {
        const expected = expectedPerms.get(module)?.has(action) || false;
        const actual = hasPermission(module, action);

        results.push({
          module,
          action,
          expected,
          actual,
          passed: expected === actual
        });
      });
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    setTestResults([{
      user: currentUser as User,
      results,
      passedCount: passed,
      failedCount: failed
    }]);
  };

  // Navigation test data
  const navigationTests = [
    { path: '/painel', module: SystemModule.Dashboard, action: PermissionAction.View, name: 'Painel' },
    { path: '/events', module: SystemModule.Events, action: PermissionAction.View, name: 'Eventos' },
    { path: '/blog', module: SystemModule.Blog, action: PermissionAction.View, name: 'Blog' },
    { path: '/projects', module: SystemModule.Projects, action: PermissionAction.View, name: 'Projetos' },
    { path: '/live', module: SystemModule.Transmissions, action: PermissionAction.View, name: 'Transmissões' },
    { path: '/devotionals', module: SystemModule.Devotionals, action: PermissionAction.View, name: 'Devocionais' },
    { path: '/forum', module: SystemModule.Forum, action: PermissionAction.View, name: 'Fórum' },
    { path: '/leadership', module: SystemModule.Leadership, action: PermissionAction.View, name: 'Liderança' },
    { path: '/admin', module: SystemModule.Dashboard, action: PermissionAction.Manage, name: 'Painel Admin' },
    { path: '/admin/users', module: SystemModule.Users, action: PermissionAction.Manage, name: 'Admin - Usuários' },
    { path: '/admin/members', module: SystemModule.Members, action: PermissionAction.Manage, name: 'Admin - Membros' },
    { path: '/admin/events', module: SystemModule.Events, action: PermissionAction.Manage, name: 'Admin - Eventos' },
    { path: '/admin/blog', module: SystemModule.Blog, action: PermissionAction.Manage, name: 'Admin - Blog' },
    { path: '/admin/assistencias', module: SystemModule.Assistance, action: PermissionAction.Manage, name: 'Admin - Assistências' },
    { path: '/admin/financial', module: SystemModule.Finance, action: PermissionAction.Manage, name: 'Admin - Finanças' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados para teste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Teste de Permissões</h1>
          <p className="text-gray-600 mt-2">Validação completa do sistema de permissões</p>
        </div>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">👤 Usuário Atual</h2>
          {currentUser ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Nome:</span>
                <p className="font-medium">{currentUser.displayName}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Email:</span>
                <p className="font-medium">{currentUser.email}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Role:</span>
                <p className="font-medium">
                  <span className={`px-2 py-1 rounded text-sm ${
                    currentUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                    currentUser.role === 'secretary' ? 'bg-blue-100 text-blue-800' :
                    currentUser.role === 'professional' ? 'bg-purple-100 text-purple-800' :
                    currentUser.role === 'leader' ? 'bg-green-100 text-green-800' :
                    currentUser.role === 'finance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentUser.role}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Status:</span>
                <p className="font-medium">{currentUser.status}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Nenhum usuário logado</p>
          )}
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Usuários por Perfil</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['admin', 'secretary', 'professional', 'leader', 'member', 'finance'].map(role => (
              <div
                key={role}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              >
                <div className="text-2xl font-bold text-center">
                  {usersByRole[role]?.length || 0}
                </div>
                <div className="text-sm text-gray-600 text-center capitalize">{role}</div>
              </div>
            ))}
          </div>

          {selectedRole && usersByRole[selectedRole] && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Usuários com perfil {selectedRole}:</h3>
              <div className="space-y-2">
                {usersByRole[selectedRole].map(user => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{user.displayName}</span>
                    <span className="text-gray-500">({user.email})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Run Tests Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔬 Executar Testes</h2>
          <button
            onClick={runCurrentUserTests}
            disabled={testing || !currentUser}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Executando...' : 'Testar Permissões do Usuário Atual'}
          </button>
        </div>

        {/* Navigation Permission Matrix */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🗺️ Matriz de Navegação</h2>
          <p className="text-gray-600 mb-4">
            Páginas que você {currentUser?.role === 'admin' ? 'pode acessar' : 'deveria poder acessar'} baseado no seu perfil:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acesso</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Testar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {navigationTests.map((test, index) => {
                  const canAccess = hasPermission(test.module, test.action);
                  return (
                    <tr key={index} className={canAccess ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{test.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{test.module}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{test.action}</td>
                      <td className="px-4 py-3 text-center">
                        {canAccess ? (
                          <span className="text-green-600 text-xl">✅</span>
                        ) : (
                          <span className="text-red-600 text-xl">❌</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={test.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Abrir
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Resultados dos Testes</h2>

            {testResults.map((userResult, idx) => (
              <div key={idx} className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium">{userResult.user.displayName}</span>
                    <span className="text-gray-500 ml-2">({userResult.user.role})</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-green-600">✅ {userResult.passedCount} passou</span>
                    <span className="text-red-600">❌ {userResult.failedCount} falhou</span>
                  </div>
                </div>

                {/* Show only failed tests */}
                {userResult.failedCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Testes que falharam:</h4>
                    <div className="space-y-2">
                      {userResult.results.filter(r => !r.passed).map((result, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{result.module}</span>
                          <span className="text-gray-500"> - {result.action}:</span>
                          <span className="ml-2">
                            Esperado: {result.expected ? 'SIM' : 'NÃO'},
                            Obtido: {result.actual ? 'SIM' : 'NÃO'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userResult.failedCount === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <span className="text-green-800 text-lg">🎉 Todos os testes passaram!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Permission Matrix by Role */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📊 Matriz de Permissões por Perfil</h2>
          <p className="text-gray-600 mb-4">
            Comparação de permissões entre perfis (baseado na configuração padrão):
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Módulo</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Admin</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Secretary</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Professional</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Leader</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Member</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Finance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(SystemModule).slice(0, 15).map(module => (
                  <tr key={module}>
                    <td className="px-3 py-2 font-medium text-gray-900">{module}</td>
                    {['admin', 'secretary', 'professional', 'leader', 'member', 'finance'].map(role => {
                      const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
                      const modulePerms = rolePerms.find(p => p.module === module);
                      const hasView = modulePerms?.actions.includes(PermissionAction.View);
                      const hasManage = modulePerms?.actions.includes(PermissionAction.Manage);

                      return (
                        <td key={role} className="px-3 py-2 text-center">
                          {hasManage ? (
                            <span className="text-purple-600" title="Manage">⚙️</span>
                          ) : hasView ? (
                            <span className="text-green-600" title="View">👁️</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="mr-4">👁️ = Visualizar</span>
            <span>⚙️ = Gerenciar (inclui visualizar)</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-800 mb-2">📝 Como Testar Manualmente</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Faça login com um usuário de cada perfil (admin, secretary, leader, member, professional, finance)</li>
            <li>Verifique se o menu mostra apenas as opções permitidas para o perfil</li>
            <li>Tente acessar cada página diretamente pela URL</li>
            <li>Verifique se páginas não permitidas mostram "Acesso Negado"</li>
            <li>No painel Admin, verifique se apenas os módulos permitidos aparecem</li>
            <li>Teste criar/editar/excluir em cada módulo conforme as permissões</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
