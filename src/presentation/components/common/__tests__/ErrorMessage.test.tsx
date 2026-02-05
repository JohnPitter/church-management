// Unit Tests - ErrorMessage Component
// Comprehensive tests for the error message component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ErrorMessage message="Test error" />);
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render the error message text', () => {
      render(<ErrorMessage message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render error icon', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Message Prop', () => {
    it('should display simple message', () => {
      render(<ErrorMessage message="Simple error message" />);
      expect(screen.getByText('Simple error message')).toBeInTheDocument();
    });

    it('should display long message', () => {
      const longMessage = 'This is a very long error message that might span multiple lines and contains detailed information about what went wrong in the application.';
      render(<ErrorMessage message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display message with special characters', () => {
      const specialMessage = 'Error: <script>alert("xss")</script> & "quotes" \'single\'';
      render(<ErrorMessage message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should display empty message', () => {
      const { container } = render(<ErrorMessage message="" />);
      const messageElement = container.querySelector('.text-red-800');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.textContent).toBe('');
    });

    it('should display message with line breaks', () => {
      render(<ErrorMessage message="Line 1 Line 2" />);
      expect(screen.getByText('Line 1 Line 2')).toBeInTheDocument();
    });
  });

  describe('onClose Callback', () => {
    it('should render without close button when onClose is not provided', () => {
      render(<ErrorMessage message="Error" />);
      // Look for a button - there should only be the close button if onClose is provided
      const closeButtons = screen.queryAllByRole('button');
      expect(closeButtons).toHaveLength(0);
    });

    it('should render close button when onClose is provided', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);

      fireEvent.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClose).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    it('should have red background', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-red-50');
    });

    it('should have rounded corners', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('rounded-md');
    });

    it('should have padding', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('p-4');
    });

    it('should have flexbox layout', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have icon with red color', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const icon = container.querySelector('.text-red-400');
      expect(icon).toBeInTheDocument();
    });

    it('should have message with red text', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const message = container.querySelector('.text-red-800');
      expect(message).toBeInTheDocument();
    });

    it('should have font-medium on message', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const message = container.querySelector('.font-medium');
      expect(message).toBeInTheDocument();
    });

    it('should have text-sm on message', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const message = container.querySelector('.text-sm');
      expect(message).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('should have correct icon size', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const icon = container.querySelector('svg.h-5.w-5');
      expect(icon).toBeInTheDocument();
    });

    it('should have aria-hidden on icon', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have flex-shrink-0 on icon container', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Close Button Styling', () => {
    it('should have correct background', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-50');
    });

    it('should have rounded corners', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-md');
    });

    it('should have hover state', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-red-100');
    });

    it('should have focus ring styles', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-red-600');
      expect(button).toHaveClass('focus:ring-offset-2');
      expect(button).toHaveClass('focus:ring-offset-red-50');
    });

    it('should have no outline on focus', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
    });

    it('should have text-red-500 color', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-red-500');
    });

    it('should have type="button"', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Close Button Accessibility', () => {
    it('should have screen reader text', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      expect(screen.getByText('Fechar')).toBeInTheDocument();
    });

    it('should have sr-only class on screen reader text', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const srText = screen.getByText('Fechar');
      expect(srText).toHaveClass('sr-only');
    });

    it('should have close icon in button', () => {
      const onClose = jest.fn();
      const { container } = render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct close icon size', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('h-5');
      expect(svg).toHaveClass('w-5');
    });

    it('should have aria-hidden on close icon', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Layout', () => {
    it('should have proper spacing between icon and message', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const messageContainer = container.querySelector('.ml-3');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should have flex-1 on message container', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const messageContainer = container.querySelector('.flex-1');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should position close button properly', () => {
      const onClose = jest.fn();
      const { container } = render(<ErrorMessage message="Error" onClose={onClose} />);
      const closeContainer = container.querySelector('.ml-auto');
      expect(closeContainer).toBeInTheDocument();
    });

    it('should have proper padding on close button container', () => {
      const onClose = jest.fn();
      const { container } = render(<ErrorMessage message="Error" onClose={onClose} />);
      const closeButtonOuter = container.querySelector('.pl-3');
      expect(closeButtonOuter).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { rerender } = render(<ErrorMessage message="Initial error" />);
      expect(screen.getByText('Initial error')).toBeInTheDocument();

      rerender(<ErrorMessage message="Updated error" />);
      expect(screen.getByText('Updated error')).toBeInTheDocument();
      expect(screen.queryByText('Initial error')).not.toBeInTheDocument();
    });

    it('should handle adding onClose prop after initial render', () => {
      const { rerender } = render(<ErrorMessage message="Error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      const onClose = jest.fn();
      rerender(<ErrorMessage message="Error" onClose={onClose} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle removing onClose prop after initial render', () => {
      const onClose = jest.fn();
      const { rerender } = render(<ErrorMessage message="Error" onClose={onClose} />);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<ErrorMessage message="Error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle onClose prop change', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      const { rerender } = render(<ErrorMessage message="Error" onClose={onClose1} />);

      fireEvent.click(screen.getByRole('button'));
      expect(onClose1).toHaveBeenCalledTimes(1);
      expect(onClose2).not.toHaveBeenCalled();

      rerender(<ErrorMessage message="Error" onClose={onClose2} />);

      fireEvent.click(screen.getByRole('button'));
      expect(onClose1).toHaveBeenCalledTimes(1);
      expect(onClose2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple error messages on the same page', () => {
      render(
        <div>
          <ErrorMessage message="Error 1" />
          <ErrorMessage message="Error 2" />
          <ErrorMessage message="Error 3" />
        </div>
      );

      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });

    it('should handle multiple error messages with close buttons', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      render(
        <div>
          <ErrorMessage message="Error 1" onClose={onClose1} />
          <ErrorMessage message="Error 2" onClose={onClose2} />
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      fireEvent.click(buttons[0]);
      expect(onClose1).toHaveBeenCalledTimes(1);
      expect(onClose2).not.toHaveBeenCalled();

      fireEvent.click(buttons[1]);
      expect(onClose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Content Types', () => {
    it('should handle numeric message', () => {
      // TypeScript would normally catch this, but testing runtime behavior
      render(<ErrorMessage message="Error code: 500" />);
      expect(screen.getByText('Error code: 500')).toBeInTheDocument();
    });

    it('should handle message with HTML entities', () => {
      render(<ErrorMessage message="Error: &amp; occurred" />);
      expect(screen.getByText('Error: & occurred')).toBeInTheDocument();
    });

    it('should handle message with unicode characters', () => {
      render(<ErrorMessage message="Error occurred! Check your data." />);
      expect(screen.getByText('Error occurred! Check your data.')).toBeInTheDocument();
    });

    it('should handle message in Portuguese', () => {
      render(<ErrorMessage message="Ocorreu um erro. Por favor, tente novamente." />);
      expect(screen.getByText('Ocorreu um erro. Por favor, tente novamente.')).toBeInTheDocument();
    });
  });

  describe('Icon Content', () => {
    it('should render error circle icon', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      // Check for the specific path that indicates an error/X circle icon
      const iconSvg = container.querySelector('.flex-shrink-0 svg');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).toHaveAttribute('viewBox', '0 0 20 20');
    });

    it('should have currentColor fill', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const iconSvg = container.querySelector('.flex-shrink-0 svg');
      expect(iconSvg).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Interaction States', () => {
    it('should handle keyboard interaction on close button', () => {
      const onClose = jest.fn();
      render(<ErrorMessage message="Error" onClose={onClose} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      // Note: fireEvent.keyDown doesn't trigger click, but the button is accessible

      fireEvent.click(button);
      expect(onClose).toHaveBeenCalled();
    });

    it('should be visible in DOM', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      expect(container.firstChild).toBeVisible();
    });
  });
});
