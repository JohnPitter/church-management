import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';
import { PublicPage, PublicPageConfig } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';
import { PublicPageService } from '@modules/content-management/public-pages/application/services/PublicPageService';
import { LoadingSpinner } from './common/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
  publicPage: PublicPage;
  requireModule?: SystemModule;
  requireAction?: PermissionAction;
  allowAdminAccess?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  publicPage,
  requireModule,
  requireAction = PermissionAction.View,
  allowAdminAccess = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPublicAccess = async () => {
      try {
        const service = new PublicPageService();
        const configs = await service.getPublicPageConfigs();
        const pageConfig = configs.find((c: PublicPageConfig) => c.page === publicPage);
        setIsPublic(pageConfig?.isPublic || false);
      } catch (error) {
        console.error('Error checking public page access:', error);
        setIsPublic(false);
      } finally {
        setLoading(false);
      }
    };

    checkPublicAccess();
  }, [publicPage]);

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Se a página é pública, permitir acesso
  if (isPublic) {
    return <>{children}</>;
  }

  // Se a página não é pública, verificar autenticação
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se não aprovado, redirecionar para página de aprovação pendente
  if (user.status !== 'approved') {
    return <Navigate to="/pending-approval" />;
  }

  // Verificar permissões se um módulo for especificado
  if (requireModule) {
    // Permitir acesso de admin se configurado
    if (allowAdminAccess && user.role === 'admin') {
      return <>{children}</>;
    }

    // Verificar permissão específica
    if (!hasPermission(requireModule, requireAction)) {
      return <Navigate to="/painel" />;
    }
  }

  return <>{children}</>;
};