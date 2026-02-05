// Unit Tests - LoadingButton Component
// Comprehensive tests for the loading button component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingButton } from '../LoadingButton';

describe('LoadingButton', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<LoadingButton>Click me</LoadingButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<LoadingButton>Test Content</LoadingButton>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Type Prop', () => {
    it('should have type="button" by default', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have type="submit" when specified', () => {
      render(<LoadingButton type="submit">Submit</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have type="reset" when specified', () => {
      render(<LoadingButton type="reset">Reset</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('onClick Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<LoadingButton onClick={handleClick}>Click</LoadingButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<LoadingButton onClick={handleClick} disabled>Click</LoadingButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<LoadingButton onClick={handleClick} loading>Click</LoadingButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', () => {
      const handleClick = jest.fn();
      render(<LoadingButton onClick={handleClick}>Click</LoadingButton>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should work without onClick handler', () => {
      render(<LoadingButton>Click</LoadingButton>);
      const button = screen.getByRole('button');

      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Loading State', () => {
    it('should not show spinner by default', () => {
      const { container } = render(<LoadingButton>Button</LoadingButton>);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should show spinner when loading=true', () => {
      const { container } = render(<LoadingButton loading>Loading...</LoadingButton>);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<LoadingButton loading>Loading</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show children alongside spinner when loading', () => {
      render(<LoadingButton loading>Processing</LoadingButton>);
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('should not show spinner when loading=false', () => {
      const { container } = render(<LoadingButton loading={false}>Button</LoadingButton>);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should be disabled when disabled=true', () => {
      render(<LoadingButton disabled>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when both disabled and loading are true', () => {
      render(<LoadingButton disabled loading>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled=false and loading=false', () => {
      render(<LoadingButton disabled={false} loading={false}>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Variant Prop', () => {
    it('should apply primary variant styles by default', () => {
      render(<LoadingButton>Primary</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
      expect(button).toHaveClass('text-white');
    });

    it('should apply primary variant styles when variant="primary"', () => {
      render(<LoadingButton variant="primary">Primary</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
      expect(button).toHaveClass('hover:bg-indigo-700');
      expect(button).toHaveClass('focus:ring-indigo-500');
    });

    it('should apply secondary variant styles when variant="secondary"', () => {
      render(<LoadingButton variant="secondary">Secondary</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-indigo-700');
      expect(button).toHaveClass('bg-indigo-100');
      expect(button).toHaveClass('hover:bg-indigo-200');
      expect(button).toHaveClass('focus:ring-indigo-500');
    });

    it('should apply danger variant styles when variant="danger"', () => {
      render(<LoadingButton variant="danger">Danger</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-red-700');
      expect(button).toHaveClass('focus:ring-red-500');
    });
  });

  describe('Size Prop', () => {
    it('should apply medium size styles by default', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-sm');
    });

    it('should apply small size styles when size="sm"', () => {
      render(<LoadingButton size="sm">Small</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('should apply medium size styles when size="md"', () => {
      render(<LoadingButton size="md">Medium</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-sm');
    });

    it('should apply large size styles when size="lg"', () => {
      render(<LoadingButton size="lg">Large</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('FullWidth Prop', () => {
    it('should not be full width by default', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('should be full width when fullWidth=true', () => {
      render(<LoadingButton fullWidth>Full Width</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not be full width when fullWidth=false', () => {
      render(<LoadingButton fullWidth={false}>Not Full Width</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('ClassName Prop', () => {
    it('should not have additional classes by default', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      // Should have base classes but no custom ones
      expect(button).toHaveClass('inline-flex');
    });

    it('should apply custom className', () => {
      render(<LoadingButton className="custom-class">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<LoadingButton className="my-custom-class">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('my-custom-class');
    });

    it('should handle empty className gracefully', () => {
      render(<LoadingButton className="">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
    });
  });

  describe('Base Classes', () => {
    it('should have inline-flex display class', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
    });

    it('should have items-center class', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('items-center');
    });

    it('should have justify-center class', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('justify-center');
    });

    it('should have font-medium class', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium');
    });

    it('should have rounded-md class', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-md');
    });

    it('should have focus outline and ring classes', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('should have transition classes', () => {
      render(<LoadingButton>Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
      expect(button).toHaveClass('duration-200');
    });
  });

  describe('Disabled Variant Styles', () => {
    it('should have disabled styles for primary variant', () => {
      render(<LoadingButton variant="primary">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-indigo-400');
    });

    it('should have disabled styles for secondary variant', () => {
      render(<LoadingButton variant="secondary">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-gray-100');
    });

    it('should have disabled styles for danger variant', () => {
      render(<LoadingButton variant="danger">Button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-red-400');
    });
  });

  describe('Combined Props', () => {
    it('should correctly apply all props together', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton
          type="submit"
          onClick={handleClick}
          variant="danger"
          size="lg"
          fullWidth
          className="extra-class"
        >
          Submit Form
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('extra-class');
      expect(button).not.toBeDisabled();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should be disabled when loading even with other props', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton
          onClick={handleClick}
          loading
          variant="secondary"
          size="sm"
        >
          Loading
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading Spinner Structure', () => {
    it('should have spinner with animate-spin class', () => {
      const { container } = render(<LoadingButton loading>Loading</LoadingButton>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have spinner with correct sizing', () => {
      const { container } = render(<LoadingButton loading>Loading</LoadingButton>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('h-5');
      expect(spinner).toHaveClass('w-5');
    });

    it('should have spinner with correct spacing', () => {
      const { container } = render(<LoadingButton loading>Loading</LoadingButton>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('-ml-1');
      expect(spinner).toHaveClass('mr-3');
    });

    it('should have spinner with circle and path elements', () => {
      const { container } = render(<LoadingButton loading>Loading</LoadingButton>);
      const circle = container.querySelector('circle');
      const path = container.querySelector('path');
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('should render text children', () => {
      render(<LoadingButton>Text Content</LoadingButton>);
      expect(screen.getByText('Text Content')).toBeInTheDocument();
    });

    it('should render element children', () => {
      render(
        <LoadingButton>
          <span data-testid="child-span">Span Child</span>
        </LoadingButton>
      );
      expect(screen.getByTestId('child-span')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <LoadingButton>
          <span>Icon</span>
          <span>Text</span>
        </LoadingButton>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { rerender } = render(
        <LoadingButton loading={false} disabled={false}>
          Initial
        </LoadingButton>
      );

      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();

      rerender(
        <LoadingButton loading={true} disabled={false}>
          Loading
        </LoadingButton>
      );

      button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle transition from loading to not loading', () => {
      const { container, rerender } = render(
        <LoadingButton loading>Loading</LoadingButton>
      );

      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();

      rerender(<LoadingButton loading={false}>Done</LoadingButton>);

      expect(container.querySelector('svg.animate-spin')).not.toBeInTheDocument();
    });

    it('should handle multiple buttons on the same page', () => {
      render(
        <div>
          <LoadingButton variant="primary">Primary</LoadingButton>
          <LoadingButton variant="secondary">Secondary</LoadingButton>
          <LoadingButton variant="danger">Danger</LoadingButton>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should handle click events correctly after state changes', () => {
      const handleClick = jest.fn();
      const { rerender } = render(
        <LoadingButton onClick={handleClick} loading>
          Loading
        </LoadingButton>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();

      rerender(
        <LoadingButton onClick={handleClick} loading={false}>
          Ready
        </LoadingButton>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
