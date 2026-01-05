// Presentation Component - LoginFormInput
// Reusable input component following DRY principle

import React from 'react';

interface LoginFormInputProps {
  id: string;
  type: 'text' | 'email' | 'password';
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}

export const LoginFormInput: React.FC<LoginFormInputProps> = ({
  id,
  type,
  label,
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
  error
}) => {
  return (
    <div>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};