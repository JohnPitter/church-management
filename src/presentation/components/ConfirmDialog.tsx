import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface PromptOptions extends DialogOptions {
  inputLabel?: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
}

interface ConfirmDialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

interface DialogState {
  type: 'confirm' | 'prompt';
  options: PromptOptions;
  resolve: (value: any) => void;
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(options.inputDefaultValue || '');
      setDialog({ type: 'prompt', options, resolve });
      setTimeout(() => inputRef.current?.focus(), 100);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(inputValue);
    } else {
      dialog.resolve(true);
    }
    setDialog(null);
    setInputValue('');
  }, [dialog, inputValue]);

  const handleCancel = useCallback(() => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(null);
    } else {
      dialog.resolve(false);
    }
    setDialog(null);
    setInputValue('');
  }, [dialog]);

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  const variant = dialog?.options.variant || 'info';

  return (
    <ConfirmDialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancel} />
            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {dialog.options.title}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line mb-4">
                {dialog.options.message}
              </p>
              {dialog.type === 'prompt' && (
                <div className="mb-4">
                  {dialog.options.inputLabel && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {dialog.options.inputLabel}
                    </label>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={dialog.options.inputPlaceholder}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {dialog.options.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
                >
                  {dialog.options.confirmText || 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = (): ConfirmDialogContextType => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};
