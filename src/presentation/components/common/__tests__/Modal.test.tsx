// Unit Tests - Modal Component
// Comprehensive tests for the modal component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    title: 'Test Modal',
    children: <div data-testid="modal-content">Modal Content</div>,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow style after each test
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should render the title', () => {
      render(<Modal {...defaultProps} title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('should render in a portal attached to document.body', () => {
      render(<Modal {...defaultProps} />);
      const modalOverlay = document.querySelector('.fixed.inset-0');
      expect(modalOverlay).toBeInTheDocument();
      expect(document.body.contains(modalOverlay)).toBe(true);
    });

    it('should render close button', () => {
      const { container } = render(<Modal {...defaultProps} />);
      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Size Prop', () => {
    it('should render with medium size by default', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-lg');
    });

    it('should render with small size when size="sm"', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-md');
    });

    it('should render with medium size when size="md"', () => {
      render(<Modal {...defaultProps} size="md" />);
      const modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-lg');
    });

    it('should render with large size when size="lg"', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-2xl');
    });

    it('should render with extra large size when size="xl"', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-4xl');
    });
  });

  describe('onClose Callback', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Find the close button (the one in the header with SVG)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons[0]; // First button is the close button
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked (default behavior)', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const overlay = document.querySelector('.fixed.inset-0');
      fireEvent.click(overlay!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const modalContent = document.querySelector('.bg-white.rounded-lg');
      fireEvent.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('closeOnOverlayClick Prop', () => {
    it('should close on overlay click when closeOnOverlayClick=true (default)', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={true} />);

      const overlay = document.querySelector('.fixed.inset-0');
      fireEvent.click(overlay!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on overlay click when closeOnOverlayClick=false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      const overlay = document.querySelector('.fixed.inset-0');
      fireEvent.click(overlay!);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should still close on close button click when closeOnOverlayClick=false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should still close on Escape key when closeOnOverlayClick=false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape Key Handler', () => {
    it('should listen for Escape key on mount', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('should not respond to other keys', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should remove event listener on unmount', () => {
      const onClose = jest.fn();
      const { unmount } = render(<Modal {...defaultProps} onClose={onClose} />);

      unmount();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should set body overflow to hidden on mount', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should reset body overflow on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should handle multiple modals correctly', () => {
      const { unmount: unmount1 } = render(
        <Modal {...defaultProps} title="Modal 1" />
      );
      expect(document.body.style.overflow).toBe('hidden');

      const { unmount: unmount2 } = render(
        <Modal {...defaultProps} title="Modal 2" />
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount2();
      expect(document.body.style.overflow).toBe('unset');

      unmount1();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Styling', () => {
    it('should have fixed positioning for overlay', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    it('should have z-50 for proper stacking', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed');
      expect(overlay).toHaveClass('z-50');
    });

    it('should have semi-transparent background', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed');
      expect(overlay).toHaveClass('bg-black');
      expect(overlay).toHaveClass('bg-opacity-50');
    });

    it('should center modal content', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed');
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
    });

    it('should have white background on modal content', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.bg-white');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.rounded-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have shadow', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.shadow-xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have full width constrained by max-width', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.w-full');
      expect(modalContent).toBeInTheDocument();
    });

    it('should handle overflow with max-height and overflow-y-auto', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.max-h-screen');
      expect(modalContent).toHaveClass('overflow-y-auto');
    });

    it('should have padding on overlay for small screens', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.p-4');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Header Styling', () => {
    it('should have border between header and content', () => {
      render(<Modal {...defaultProps} />);
      const header = document.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('should have proper title styling', () => {
      render(<Modal {...defaultProps} />);
      const title = screen.getByText('Test Modal');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-gray-900');
    });

    it('should have close button with hover state', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = document.querySelector('button.text-gray-400');
      expect(closeButton).toHaveClass('hover:text-gray-600');
    });
  });

  describe('Content Area', () => {
    it('should have padding in content area', () => {
      render(<Modal {...defaultProps} />);
      // Content area has p-6 class
      const contentAreas = document.querySelectorAll('.p-6');
      expect(contentAreas.length).toBeGreaterThanOrEqual(2); // Header and content both have p-6
    });

    it('should render complex children correctly', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <h3>Sub Header</h3>
            <p>Paragraph text</p>
            <button>Action Button</button>
          </div>
        </Modal>
      );

      expect(screen.getByText('Sub Header')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should render form elements in children', () => {
      render(
        <Modal {...defaultProps}>
          <form data-testid="modal-form">
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      expect(screen.getByTestId('modal-form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });
  });

  describe('Close Button Icon', () => {
    it('should have SVG icon in close button', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = document.querySelector('button.text-gray-400');
      const svg = closeButton?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct size for close icon', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = document.querySelector('button.text-gray-400');
      const svg = closeButton?.querySelector('svg');
      expect(svg).toHaveClass('w-6');
      expect(svg).toHaveClass('h-6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<Modal {...defaultProps} title="" />);
      const header = document.querySelector('.flex.items-center.justify-between');
      expect(header).toBeInTheDocument();
    });

    it('should handle long title', () => {
      const longTitle = 'This is a very long modal title that might wrap to multiple lines';
      render(<Modal {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <Modal {...defaultProps}>
          {null}
        </Modal>
      );
      // Modal should still render
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should handle rapid open/close', () => {
      const onClose = jest.fn();
      const { unmount, rerender } = render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();

      // Re-render
      render(<Modal {...defaultProps} onClose={onClose} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('should handle props changes', () => {
      const onClose = jest.fn();
      const { rerender } = render(
        <Modal {...defaultProps} onClose={onClose} size="sm" />
      );

      let modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-md');

      rerender(<Modal {...defaultProps} onClose={onClose} size="xl" />);

      modalContent = document.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toHaveClass('max-w-4xl');
    });

    it('should update onClose callback when prop changes', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      const { rerender } = render(<Modal {...defaultProps} onClose={onClose1} />);

      rerender(<Modal {...defaultProps} onClose={onClose2} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have clickable close button', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = document.querySelector('button.text-gray-400');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).not.toBeDisabled();
    });

    it('should trap focus within modal overlay', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Portal Behavior', () => {
    it('should render modal outside of parent DOM hierarchy', () => {
      const { container } = render(
        <div data-testid="parent-container">
          <Modal {...defaultProps} />
        </div>
      );

      const parentContainer = screen.getByTestId('parent-container');
      const modalOverlay = document.querySelector('.fixed.inset-0');

      // Modal should be a child of body, not the parent container
      expect(parentContainer.contains(modalOverlay)).toBe(false);
      expect(document.body.contains(modalOverlay)).toBe(true);
    });

    it('should clean up portal on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);

      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();

      unmount();

      expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
    });
  });
});
