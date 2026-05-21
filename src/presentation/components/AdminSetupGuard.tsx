// Componente que verifica se existe admin e redireciona para setup se necessário
import React from 'react';
import { useAdminCheck } from '../hooks/useAdminCheck';
import SetupPage from '../pages/SetupPage';

interface AdminSetupGuardProps {
  children: React.ReactNode;
}

const AdminSetupGuard: React.FC<AdminSetupGuardProps> = ({ children }) => {
  const { hasAdmin, loading, error: _error } = useAdminCheck();

  // Se não tem admin (ou erro ao verificar), mostrar página de setup
  if (!loading && !hasAdmin) {
    return <SetupPage />;
  }

  // Se tem admin, mostrar o conteúdo normal
  return <>{children}</>;
};

export default AdminSetupGuard;
