// Unit Tests - LoginFormInput Component
// Comprehensive tests for the reusable login input component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginFormInput } from '../LoginFormInput';

describe('LoginFormInput', () => {
  const defaultProps = {
    id: 'test-input',
    type: 'text' as const,
    label: 'Test Label',
    value: '',
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input with label', () => {
      render(<LoginFormInput {...defaultProps} />);

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with correct id and name attributes', () => {
      render(<LoginFormInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'test-input');
      expect(input).toHaveAttribute('name', 'test-input');
    });

    it('should render email input type', () => {
      render(<LoginFormInput {...defaultProps} type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input type', () => {
      render(<LoginFormInput {...defaultProps} type="password" />);

      // Password inputs don't have a textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should display current value', () => {
      render(<LoginFormInput {...defaultProps} value="test value" />);

      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    it('should render placeholder when provided', () => {
      render(<LoginFormInput {...defaultProps} placeholder="Enter text here" />);

      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('should not render placeholder when not provided', () => {
      render(<LoginFormInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('placeholder');
    });
  });

  describe('Input Attributes', () => {
    it('should set required attribute when required is true', () => {
      render(<LoginFormInput {...defaultProps} required={true} />);

      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should not set required attribute when required is false', () => {
      render(<LoginFormInput {...defaultProps} required={false} />);

      expect(screen.getByRole('textbox')).not.toBeRequired();
    });

    it('should not set required attribute by default', () => {
      render(<LoginFormInput {...defaultProps} />);

      expect(screen.getByRole('textbox')).not.toBeRequired();
    });

    it('should set autoComplete attribute when provided', () => {
      render(<LoginFormInput {...defaultProps} autoComplete="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });

    it('should set autoComplete to current-password for password fields', () => {
      render(
        <LoginFormInput
          {...defaultProps}
          type="password"
          autoComplete="current-password"
        />
      );

      const input = document.querySelector('input[type="password"]');
      expect(input).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user types', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'new value' })
        })
      );
    });

    it('should call onChange for each character typed', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it('should handle empty value on clear', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} value="test" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: '' })
        })
      );
    });

    it('should handle password input onChange', () => {
      const mockOnChange = jest.fn();
      render(
        <LoginFormInput
          {...defaultProps}
          type="password"
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input[type="password"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'secret123' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'secret123' })
        })
      );
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<LoginFormInput {...defaultProps} error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not display error message when error prop is not provided', () => {
      render(<LoginFormInput {...defaultProps} />);

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should apply error styling when error is present', () => {
      render(<LoginFormInput {...defaultProps} error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-red-300');
    });

    it('should apply normal styling when no error', () => {
      render(<LoginFormInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-gray-300');
      expect(input.className).not.toContain('border-red-300');
    });

    it('should display error with red text color', () => {
      render(<LoginFormInput {...defaultProps} error="Error message" />);

      const errorElement = screen.getByText('Error message');
      expect(errorElement.className).toContain('text-red-600');
    });

    it('should handle empty error string', () => {
      render(<LoginFormInput {...defaultProps} error="" />);

      // Empty string is falsy, so no error should be shown
      const input = screen.getByRole('textbox');
      expect(input.className).not.toContain('border-red-300');
    });
  });

  describe('Label Styling', () => {
    it('should apply correct label styling', () => {
      render(<LoginFormInput {...defaultProps} />);

      const label = screen.getByText('Test Label');
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(label.className).toContain('text-sm');
      expect(label.className).toContain('font-medium');
      expect(label.className).toContain('text-gray-700');
    });
  });

  describe('Input Types', () => {
    it('should render text input', () => {
      render(<LoginFormInput {...defaultProps} type="text" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<LoginFormInput {...defaultProps} type="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<LoginFormInput {...defaultProps} type="password" />);

      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have label associated with input via htmlFor', () => {
      render(<LoginFormInput {...defaultProps} />);

      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should be focusable', () => {
      render(<LoginFormInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(document.activeElement).toBe(input);
    });

    it('should allow clicking on label to focus input', () => {
      render(<LoginFormInput {...defaultProps} />);

      const label = screen.getByText('Test Label');
      fireEvent.click(label);

      const input = screen.getByRole('textbox');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in value', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: '<script>alert("xss")</script>' })
        })
      );
    });

    it('should handle very long input values', () => {
      const longValue = 'a'.repeat(1000);
      render(<LoginFormInput {...defaultProps} value={longValue} />);

      expect(screen.getByRole('textbox')).toHaveValue(longValue);
    });

    it('should handle unicode characters', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Test Unicode: cafe moka' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'Test Unicode: cafe moka' })
        })
      );
    });

    it('should handle whitespace-only values', () => {
      const mockOnChange = jest.fn();
      render(<LoginFormInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: '   ' })
        })
      );
    });
  });
});
