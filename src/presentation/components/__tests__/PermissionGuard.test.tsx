// Unit Tests - PermissionGuard Component
// Comprehensive tests for permission-based content rendering

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PermissionGuard
} from '../PermissionGuard';
import { SystemModule, PermissionAction } from '../../../domain/entities/Permission';

// Mock usePermissions hook
const mockUsePermissions = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions()
}));

describe('PermissionGuard Component', () => {
  const TestChild = () => <div data-testid="protected-content">Protected Content</div>;
  const FallbackComponent = () => <div data-testid="fallback-content">Access Denied</div>;

  const defaultPermissionsValue = {
    hasPermission: jest.fn().mockReturnValue(true),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(defaultPermissionsValue);
  });

  describe('Loading State', () => {
    it('should show loading indicator when permissions are loading', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        loading: true
      });

      render(
        <PermissionGuard module={SystemModule.Users} action={PermissionAction.View}>
          <TestChild />
        </PermissionGuard>
      );

      // Should show loading pulse animation
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should not render children while loading', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        loading: true
      });

      render(
        <PermissionGuard module={SystemModule.Users} action={PermissionAction.View}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Single Permission Check', () => {
    it('should render children when user has required permission', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(true)
      });

      render(
        <PermissionGuard module={SystemModule.Members} action={PermissionAction.View}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user lacks permission', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionGuard module={SystemModule.Members} action={PermissionAction.View}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionGuard
          module={SystemModule.Members}
          action={PermissionAction.View}
          fallback={<FallbackComponent />}
        >
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });

    it('should call hasPermission with correct module and action', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: mockHasPermission
      });

      render(
        <PermissionGuard module={SystemModule.Finance} action={PermissionAction.Manage}>
          <TestChild />
        </PermissionGuard>
      );

      expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Finance, PermissionAction.Manage);
    });
  });

  describe('Multiple Permissions Check - Any (Default)', () => {
    it('should render children when user has any of the required permissions', () => {
      const mockHasAnyPermission = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasAnyPermission: mockHasAnyPermission
      });

      render(
        <PermissionGuard
          permissions={[
            { module: SystemModule.Members, action: PermissionAction.Create },
            { module: SystemModule.Members, action: PermissionAction.Update }
          ]}
        >
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith([
        { module: SystemModule.Members, action: PermissionAction.Create },
        { module: SystemModule.Members, action: PermissionAction.Update }
      ]);
    });

    it('should not render children when user has none of the permissions', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasAnyPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionGuard
          permissions={[
            { module: SystemModule.Users, action: PermissionAction.Delete },
            { module: SystemModule.Finance, action: PermissionAction.Manage }
          ]}
        >
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Permissions Check - All (requireAll)', () => {
    it('should render children when user has all required permissions', () => {
      const mockHasAllPermissions = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasAllPermissions: mockHasAllPermissions
      });

      render(
        <PermissionGuard
          requireAll
          permissions={[
            { module: SystemModule.Members, action: PermissionAction.View },
            { module: SystemModule.Finance, action: PermissionAction.View }
          ]}
        >
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith([
        { module: SystemModule.Members, action: PermissionAction.View },
        { module: SystemModule.Finance, action: PermissionAction.View }
      ]);
    });

    it('should not render children when user is missing any permission', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasAllPermissions: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionGuard
          requireAll
          permissions={[
            { module: SystemModule.Members, action: PermissionAction.View },
            { module: SystemModule.Finance, action: PermissionAction.View }
          ]}
        >
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Empty/No Permission Configuration', () => {
    it('should not render children when no module/action and no permissions array', () => {
      render(
        <PermissionGuard>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not render children when permissions array is empty', () => {
      render(
        <PermissionGuard permissions={[]}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render null fallback by default', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      const { container } = render(
        <PermissionGuard module={SystemModule.Users} action={PermissionAction.Manage}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Default Fallback', () => {
    it('should render null when fallback is not provided and access denied', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      const { container } = render(
        <PermissionGuard module={SystemModule.Users} action={PermissionAction.Delete}>
          <TestChild />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(container.childNodes.length).toBe(0);
    });
  });
});

describe('Edge Cases', () => {
  const TestChild = () => <div data-testid="edge-content">Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyPermission: jest.fn().mockReturnValue(true),
      hasAllPermissions: jest.fn().mockReturnValue(true),
      loading: false
    });
  });

  it('should handle rapid permission changes', () => {
    const { rerender } = render(
      <PermissionGuard module={SystemModule.Users} action={PermissionAction.View}>
        <TestChild />
      </PermissionGuard>
    );

    expect(screen.getByTestId('edge-content')).toBeInTheDocument();

    // Change to no permission
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(false),
      hasAnyPermission: jest.fn().mockReturnValue(false),
      hasAllPermissions: jest.fn().mockReturnValue(false),
      loading: false
    });

    rerender(
      <PermissionGuard module={SystemModule.Users} action={PermissionAction.View}>
        <TestChild />
      </PermissionGuard>
    );

    expect(screen.queryByTestId('edge-content')).not.toBeInTheDocument();
  });

  it('should handle complex nested children', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyPermission: jest.fn().mockReturnValue(true),
      hasAllPermissions: jest.fn().mockReturnValue(true),
      loading: false
    });

    render(
      <PermissionGuard module={SystemModule.Users} action={PermissionAction.View}>
        <div data-testid="parent">
          <span data-testid="child1">Child 1</span>
          <div data-testid="child2">
            <span data-testid="grandchild">Grandchild</span>
          </div>
        </div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByTestId('grandchild')).toBeInTheDocument();
  });

  it('should prefer permissions array over single module/action', () => {
    const mockHasAnyPermission = jest.fn().mockReturnValue(true);
    const mockHasPermission = jest.fn().mockReturnValue(false);

    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      hasAnyPermission: mockHasAnyPermission,
      hasAllPermissions: jest.fn().mockReturnValue(true),
      loading: false
    });

    render(
      <PermissionGuard
        module={SystemModule.Users}
        action={PermissionAction.View}
        permissions={[
          { module: SystemModule.Members, action: PermissionAction.View }
        ]}
      >
        <TestChild />
      </PermissionGuard>
    );

    // Should use permissions array, not single module/action
    expect(mockHasAnyPermission).toHaveBeenCalled();
    expect(mockHasPermission).not.toHaveBeenCalled();
    expect(screen.getByTestId('edge-content')).toBeInTheDocument();
  });
});
