// Unit Tests - LoadingSpinner Component
// Comprehensive tests for the loading spinner component

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    it('should render an SVG element', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have animate-spin class for animation', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('Size Prop', () => {
    it('should render with default medium size when no size is provided', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6');
      expect(svg).toHaveClass('w-6');
    });

    it('should render with small size when size="sm"', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('w-4');
    });

    it('should render with medium size when size="md"', () => {
      const { container } = render(<LoadingSpinner size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6');
      expect(svg).toHaveClass('w-6');
    });

    it('should render with large size when size="lg"', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8');
      expect(svg).toHaveClass('w-8');
    });

    it('should render with extra large size when size="xl"', () => {
      const { container } = render(<LoadingSpinner size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12');
      expect(svg).toHaveClass('w-12');
    });
  });

  describe('Color Prop', () => {
    it('should render with default blue color when no color is provided', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('should render with blue color when color="blue"', () => {
      const { container } = render(<LoadingSpinner color="blue" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('should render with gray color when color="gray"', () => {
      const { container } = render(<LoadingSpinner color="gray" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-gray-600');
    });

    it('should render with green color when color="green"', () => {
      const { container } = render(<LoadingSpinner color="green" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-green-600');
    });

    it('should render with red color when color="red"', () => {
      const { container } = render(<LoadingSpinner color="red" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-red-600');
    });
  });

  describe('ClassName Prop', () => {
    it('should not have additional classes when no className is provided', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('inline-flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should apply custom className to the wrapper', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<LoadingSpinner className="my-custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('inline-flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
      expect(wrapper).toHaveClass('my-custom-class');
    });

    it('should handle empty className gracefully', () => {
      const { container } = render(<LoadingSpinner className="" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('inline-flex');
    });
  });

  describe('Combined Props', () => {
    it('should correctly apply size and color together', () => {
      const { container } = render(<LoadingSpinner size="lg" color="green" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8');
      expect(svg).toHaveClass('w-8');
      expect(svg).toHaveClass('text-green-600');
    });

    it('should correctly apply all props together', () => {
      const { container } = render(
        <LoadingSpinner size="xl" color="red" className="extra-padding" />
      );
      const wrapper = container.firstChild;
      const svg = container.querySelector('svg');

      expect(wrapper).toHaveClass('extra-padding');
      expect(svg).toHaveClass('h-12');
      expect(svg).toHaveClass('w-12');
      expect(svg).toHaveClass('text-red-600');
    });

    it('should render small gray spinner with custom class', () => {
      const { container } = render(
        <LoadingSpinner size="sm" color="gray" className="m-4" />
      );
      const wrapper = container.firstChild;
      const svg = container.querySelector('svg');

      expect(wrapper).toHaveClass('m-4');
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('w-4');
      expect(svg).toHaveClass('text-gray-600');
    });
  });

  describe('SVG Structure', () => {
    it('should have correct viewBox attribute', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have fill="none" attribute', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    it('should have a circle element', () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('should have a path element', () => {
      const { container } = render(<LoadingSpinner />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should have circle with opacity-25 class', () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveClass('opacity-25');
    });

    it('should have path with opacity-75 class', () => {
      const { container } = render(<LoadingSpinner />);
      const path = container.querySelector('path');
      expect(path).toHaveClass('opacity-75');
    });

    it('should have circle with correct attributes', () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('stroke-width', '4');
    });
  });

  describe('Accessibility', () => {
    it('should be visible in the DOM', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeVisible();
    });

    it('should maintain consistent structure across renders', () => {
      const { container: container1 } = render(<LoadingSpinner />);
      const { container: container2 } = render(<LoadingSpinner />);

      const svg1 = container1.querySelector('svg');
      const svg2 = container2.querySelector('svg');

      expect(svg1?.outerHTML).toBe(svg2?.outerHTML);
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { container, rerender } = render(<LoadingSpinner size="sm" color="blue" />);

      let svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('text-blue-600');

      rerender(<LoadingSpinner size="lg" color="red" />);

      svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8');
      expect(svg).toHaveClass('text-red-600');
    });

    it('should handle multiple instances on the same page', () => {
      const { container } = render(
        <div>
          <LoadingSpinner size="sm" color="blue" />
          <LoadingSpinner size="md" color="green" />
          <LoadingSpinner size="lg" color="red" />
        </div>
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(3);

      expect(svgs[0]).toHaveClass('h-4', 'text-blue-600');
      expect(svgs[1]).toHaveClass('h-6', 'text-green-600');
      expect(svgs[2]).toHaveClass('h-8', 'text-red-600');
    });
  });
});
