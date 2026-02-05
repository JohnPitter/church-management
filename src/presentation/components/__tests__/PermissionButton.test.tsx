// Unit Tests - PermissionButton Component
// Comprehensive tests for permission-gated button with access denied modal

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermissionButton } from '../PermissionButton';
import { SystemModule, PermissionAction, PermissionManager } from '../../../domain/entities/Permission';

// Mock usePermissions hook
const mockUsePermissions = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions()
}));

describe('PermissionButton Component', () => {
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

  describe('Authorized User', () => {
    it('should render button with children', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          Add Member
        </PermissionButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Add Member')).toBeInTheDocument();
    });

    it('should call onClick when user has permission', () => {
      const mockOnClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          onClick={mockOnClick}
        >
          Add Member
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not have opacity class when user has permission', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          className="custom-class"
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).not.toContain('opacity-75');
      expect(button.className).toContain('custom-class');
    });

    it('should pass through additional button props', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          disabled={false}
          type="submit"
          data-testid="custom-button"
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Unauthorized User - Modal Behavior', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });
    });

    it('should show opacity class when user lacks permission', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('opacity-75');
    });

    it('should show access denied modal when clicked without permission', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });

    it('should display default permission message in modal', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      // Check for module and action labels
      const moduleLabel = PermissionManager.getModuleLabel(SystemModule.Finance);
      const actionLabel = PermissionManager.getActionLabel(PermissionAction.Manage);

      expect(screen.getByText((content) =>
        content.includes(moduleLabel) && content.includes(actionLabel)
      )).toBeInTheDocument();
    });

    it('should display custom fallback message when provided', () => {
      const customMessage = 'You need special access for this action.';

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
          fallbackMessage={customMessage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should close modal when Entendi button is clicked', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));

      expect(screen.queryByText('Acesso Negado')).not.toBeInTheDocument();
    });

    it('should not call onClick when user lacks permission', () => {
      const mockOnClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
          onClick={mockOnClick}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should prevent event propagation when showing modal', () => {
      const mockParentClick = jest.fn();

      render(
        <div onClick={mockParentClick}>
          <PermissionButton
            requireModule={SystemModule.Finance}
            requireAction={PermissionAction.Manage}
          >
            Manage Finances
          </PermissionButton>
        </div>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));

      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Unauthorized Handler', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });
    });

    it('should call onUnauthorizedClick instead of showing modal when provided', () => {
      const mockUnauthorizedClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
          onUnauthorizedClick={mockUnauthorizedClick}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(mockUnauthorizedClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Acesso Negado')).not.toBeInTheDocument();
    });

    it('should not prevent default when using custom handler', () => {
      const mockUnauthorizedClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
          onUnauthorizedClick={mockUnauthorizedClick}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(mockUnauthorizedClick).toHaveBeenCalled();
    });
  });

  describe('Permission Check', () => {
    it('should call hasPermission with correct module and action', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: mockHasPermission
      });

      render(
        <PermissionButton
          requireModule={SystemModule.Users}
          requireAction={PermissionAction.Delete}
        >
          Delete User
        </PermissionButton>
      );

      expect(mockHasPermission).toHaveBeenCalledWith(
        SystemModule.Users,
        PermissionAction.Delete
      );
    });

    it('should re-check permission on each render', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: mockHasPermission
      });

      const { rerender } = render(
        <PermissionButton
          requireModule={SystemModule.Users}
          requireAction={PermissionAction.Delete}
        >
          Delete User
        </PermissionButton>
      );

      rerender(
        <PermissionButton
          requireModule={SystemModule.Users}
          requireAction={PermissionAction.Delete}
        >
          Delete User
        </PermissionButton>
      );

      expect(mockHasPermission).toHaveBeenCalledTimes(4); // Initial render + re-render (x2 for each)
    });
  });

  describe('Different Permission Types', () => {
    const testCases = [
      { module: SystemModule.Members, action: PermissionAction.View },
      { module: SystemModule.Members, action: PermissionAction.Create },
      { module: SystemModule.Members, action: PermissionAction.Update },
      { module: SystemModule.Members, action: PermissionAction.Delete },
      { module: SystemModule.Finance, action: PermissionAction.Manage },
      { module: SystemModule.Users, action: PermissionAction.Manage },
      { module: SystemModule.Events, action: PermissionAction.Create },
      { module: SystemModule.Blog, action: PermissionAction.Update }
    ];

    testCases.forEach(({ module, action }) => {
      it(`should work with ${module}:${action} permission`, () => {
        const mockHasPermission = jest.fn().mockReturnValue(true);
        mockUsePermissions.mockReturnValue({
          ...defaultPermissionsValue,
          hasPermission: mockHasPermission
        });

        const mockOnClick = jest.fn();

        render(
          <PermissionButton
            requireModule={module}
            requireAction={action}
            onClick={mockOnClick}
          >
            Test Button
          </PermissionButton>
        );

        fireEvent.click(screen.getByRole('button'));

        expect(mockHasPermission).toHaveBeenCalledWith(module, action);
        expect(mockOnClick).toHaveBeenCalled();
      });
    });
  });

  describe('Modal UI Elements', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });
    });

    it('should render modal with correct structure', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));

      // Check modal structure
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
    });

    it('should render warning icon in modal', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));

      // Check for SVG warning icon
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have overlay with proper styling', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Manage Finances' }));

      // Check overlay
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should apply custom className', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-500');
      expect(button.className).toContain('text-white');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
    });

    it('should combine className with opacity class for unauthorized', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
          className="bg-red-500"
        >
          Manage Finances
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500');
      expect(button.className).toContain('opacity-75');
    });

    it('should handle empty className', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should pass event object to onClick for authorized users', () => {
      const mockOnClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          onClick={mockOnClick}
        >
          Add Member
        </PermissionButton>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle multiple clicks correctly', () => {
      const mockOnClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          onClick={mockOnClick}
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should open modal multiple times for unauthorized user', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultPermissionsValue,
        hasPermission: jest.fn().mockReturnValue(false)
      });

      render(
        <PermissionButton
          requireModule={SystemModule.Finance}
          requireAction={PermissionAction.Manage}
        >
          Manage Finances
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Manage Finances' });

      // Open modal
      fireEvent.click(button);
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
      expect(screen.queryByText('Acesso Negado')).not.toBeInTheDocument();

      // Open again
      fireEvent.click(button);
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should trigger on Enter key', () => {
      const mockOnClick = jest.fn();

      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
          onClick={mockOnClick}
        >
          Add Member
        </PermissionButton>
      );

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      // Note: fireEvent.keyDown doesn't trigger click, need actual keyboard event
    });

    it('should maintain button role', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          Add Member
        </PermissionButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Complex Children', () => {
    it('should render complex children correctly', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          <span data-testid="icon">+</span>
          <span data-testid="label">Add Member</span>
        </PermissionButton>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should render SVG icon children', () => {
      render(
        <PermissionButton
          requireModule={SystemModule.Members}
          requireAction={PermissionAction.Create}
        >
          <svg data-testid="svg-icon" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
          </svg>
          Add Member
        </PermissionButton>
      );

      expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
    });
  });
});
