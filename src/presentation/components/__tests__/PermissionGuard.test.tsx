// Unit Tests - PermissionGuard Component
// Comprehensive tests for permission-based content rendering

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  PermissionGuard,
  AdminOnly,
  CanManageUsers,
  CanManageMembers,
  CanManagePermissions,
  usePermissionCheck,
  withPermission
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

describe('Shortcut Components', () => {
  const TestChild = () => <div data-testid="shortcut-content">Content</div>;
  const FallbackComponent = () => <div data-testid="shortcut-fallback">Fallback</div>;

  const defaultPermissionsValue = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AdminOnly', () => {
    it('should render children for admin users', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockImplementation((module, action) =>
          module === SystemModule.Dashboard && action === PermissionAction.Manage
        )
      });

      render(
        <AdminOnly>
          <TestChild />
        </AdminOnly>
      );

      expect(screen.getByTestId('shortcut-content')).toBeInTheDocument();
    });

    it('should not render children for non-admin users', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <AdminOnly>
          <TestChild />
        </AdminOnly>
      );

      expect(screen.queryByTestId('shortcut-content')).not.toBeInTheDocument();
    });

    it('should render fallback for non-admin users when provided', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <AdminOnly fallback={<FallbackComponent />}>
          <TestChild />
        </AdminOnly>
      );

      expect(screen.queryByTestId('shortcut-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('shortcut-fallback')).toBeInTheDocument();
    });
  });

  describe('CanManageUsers', () => {
    it('should render children when user can manage users', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockImplementation((module, action) =>
          module === SystemModule.Users && action === PermissionAction.Manage
        )
      });

      render(
        <CanManageUsers>
          <TestChild />
        </CanManageUsers>
      );

      expect(screen.getByTestId('shortcut-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot manage users', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <CanManageUsers>
          <TestChild />
        </CanManageUsers>
      );

      expect(screen.queryByTestId('shortcut-content')).not.toBeInTheDocument();
    });
  });

  describe('CanManageMembers', () => {
    it('should render children when user can view members', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockImplementation((module, action) =>
          module === SystemModule.Members && action === PermissionAction.View
        )
      });

      render(
        <CanManageMembers>
          <TestChild />
        </CanManageMembers>
      );

      expect(screen.getByTestId('shortcut-content')).toBeInTheDocument();
    });
  });

  describe('CanManagePermissions', () => {
    it('should render children when user can manage permissions', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockImplementation((module, action) =>
          module === SystemModule.Permissions && action === PermissionAction.Manage
        )
      });

      render(
        <CanManagePermissions>
          <TestChild />
        </CanManagePermissions>
      );

      expect(screen.getByTestId('shortcut-content')).toBeInTheDocument();
    });
  });
});

describe('usePermissionCheck Hook', () => {
  const defaultPermissionsValue = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when user has the permission', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(true)
    });

    const { result } = renderHook(() =>
      usePermissionCheck(SystemModule.Members, PermissionAction.View)
    );

    expect(result.current).toBe(true);
  });

  it('should return false when user lacks the permission', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(false)
    });

    const { result } = renderHook(() =>
      usePermissionCheck(SystemModule.Finance, PermissionAction.Manage)
    );

    expect(result.current).toBe(false);
  });

  it('should call hasPermission with correct arguments', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true);
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: mockHasPermission
    });

    renderHook(() =>
      usePermissionCheck(SystemModule.Users, PermissionAction.Delete)
    );

    expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Users, PermissionAction.Delete);
  });
});

describe('withPermission HOC', () => {
  const TestComponent = (props: { title: string }) => (
    <div data-testid="hoc-content">{props.title}</div>
  );
  const FallbackComponent = () => <div data-testid="hoc-fallback">Access Denied</div>;

  const defaultPermissionsValue = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render wrapped component when user has permission', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(true)
    });

    const ProtectedComponent = withPermission(
      TestComponent,
      SystemModule.Members,
      PermissionAction.View
    );

    render(<ProtectedComponent title="Test Title" />);

    expect(screen.getByTestId('hoc-content')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should not render wrapped component when user lacks permission', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(false)
    });

    const ProtectedComponent = withPermission(
      TestComponent,
      SystemModule.Finance,
      PermissionAction.Manage
    );

    render(<ProtectedComponent title="Test Title" />);

    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument();
  });

  it('should render fallback when provided and user lacks permission', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(false)
    });

    const ProtectedComponent = withPermission(
      TestComponent,
      SystemModule.Finance,
      PermissionAction.Manage,
      <FallbackComponent />
    );

    render(<ProtectedComponent title="Test Title" />);

    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();
  });

  it('should pass all props to wrapped component', () => {
    mockUsePermissions.mockReturnValue({
      ...defaultPermissionsValue,
      hasPermission: jest.fn().mockReturnValue(true)
    });

    interface TestProps {
      title: string;
      count: number;
      active: boolean;
    }

    const ComplexComponent = (props: TestProps) => (
      <div data-testid="complex-content">
        {props.title} - {props.count} - {props.active ? 'yes' : 'no'}
      </div>
    );

    const ProtectedComponent = withPermission(
      ComplexComponent,
      SystemModule.Members,
      PermissionAction.View
    );

    render(<ProtectedComponent title="Test" count={5} active={true} />);

    expect(screen.getByTestId('complex-content')).toHaveTextContent('Test - 5 - yes');
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
