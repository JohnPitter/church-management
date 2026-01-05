// Componente que verifica se existe admin e redireciona para setup se necessário
import React from 'react';
import { useAdminCheck } from '../hooks/useAdminCheck';
import SetupPage from '../pages/SetupPage';

interface AdminSetupGuardProps {
  children: React.ReactNode;
}

const AdminSetupGuard: React.FC<AdminSetupGuardProps> = ({ children }) => {
  const { hasAdmin, loading, error } = useAdminCheck();

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuração do sistema...</p>
        </div>
      </div>
    );
  }

  // Se não tem admin (ou erro ao verificar), mostrar página de setup
  if (!hasAdmin) {
    return <SetupPage />;
  }

  // Se tem admin, mostrar o conteúdo normal
  return <>{children}</>;
};

export default AdminSetupGuard;