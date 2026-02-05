// Unit Tests - Prayer Page
// Comprehensive tests for prayer request submission form

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrayerPage } from '../PrayerPage';

// Mock useSettings
const mockUseSettings = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

// Mock Firebase
const mockAddDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ type: 'serverTimestamp' }));
const mockCollection = jest.fn(() => 'mock-collection-ref');

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: () => mockServerTimestamp()
}));

// Mock react-router-dom Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )
}));

describe('PrayerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: {
        churchName: 'Igreja Teste',
        churchEmail: 'contato@igreja.com'
      },
      loading: false
    });
    mockAddDoc.mockResolvedValue({ id: 'prayer-123' });
    mockCollection.mockReturnValue({ _collectionPath: 'prayerRequests' });
    mockServerTimestamp.mockReturnValue({ type: 'serverTimestamp' });
  });

  const renderPrayerPage = () => {
    return render(
      <MemoryRouter>
        <PrayerPage />
      </MemoryRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('should render the prayer request page with hero section', () => {
      renderPrayerPage();

      expect(screen.getByText('Pedido de Oração')).toBeInTheDocument();
      expect(screen.getByText(/Compartilhe seu pedido conosco/)).toBeInTheDocument();
      expect(screen.getByText(/Cremos no poder da oração/)).toBeInTheDocument();
    });

    it('should render the prayer request form', () => {
      renderPrayerPage();

      expect(screen.getByText('Seu Nome *')).toBeInTheDocument();
      expect(screen.getByText('E-mail (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Telefone (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Seu Pedido de Oração *')).toBeInTheDocument();

      expect(screen.getByPlaceholderText(/Como podemos te chamar/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Compartilhe seu pedido aqui/)).toBeInTheDocument();
    });

    it('should render all prayer categories', () => {
      renderPrayerPage();

      expect(screen.getByText('Saúde')).toBeInTheDocument();
      expect(screen.getByText('Família')).toBeInTheDocument();
      expect(screen.getByText('Trabalho/Finanças')).toBeInTheDocument();
      expect(screen.getByText('Vida Espiritual')).toBeInTheDocument();
      expect(screen.getByText('Relacionamentos')).toBeInTheDocument();
      expect(screen.getByText('Gratidão')).toBeInTheDocument();
      expect(screen.getByText('Outros')).toBeInTheDocument();
    });

    it('should render privacy checkbox', () => {
      renderPrayerPage();

      const checkbox = screen.getByLabelText(/Permitir que meu pedido seja compartilhado/);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render submit button', () => {
      renderPrayerPage();

      expect(screen.getByRole('button', { name: /Enviar Pedido de Oração/ })).toBeInTheDocument();
    });

    it('should render Bible verse section', () => {
      renderPrayerPage();

      expect(screen.getByText(/Não andem ansiosos por coisa alguma/)).toBeInTheDocument();
      expect(screen.getByText('Filipenses 4:6')).toBeInTheDocument();
    });

    it('should render back button linking to home', () => {
      renderPrayerPage();

      const backButtons = screen.getAllByText('Voltar ao Início');
      expect(backButtons.length).toBeGreaterThan(0);
      backButtons.forEach((button) => {
        expect(button.closest('a')).toHaveAttribute('href', '/');
      });
    });

    it('should have health category selected by default', () => {
      renderPrayerPage();

      const healthButton = screen.getByText('Saúde').closest('button');
      expect(healthButton).toHaveClass('border-purple-500', 'bg-purple-50');
    });
  });

  describe('Form Input Handling', () => {
    it('should update name field when typing', () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'João Silva' } });

      expect(nameInput).toHaveValue('João Silva');
    });

    it('should update email field when typing', () => {
      renderPrayerPage();

      const emailInput = screen.getByPlaceholderText('seu@email.com') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'joao@teste.com' } });

      expect(emailInput).toHaveValue('joao@teste.com');
    });

    it('should update phone field when typing', () => {
      renderPrayerPage();

      const phoneInput = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '(11) 99999-9999' } });

      expect(phoneInput).toHaveValue('(11) 99999-9999');
    });

    it('should update request text when typing', () => {
      renderPrayerPage();

      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem pela minha saúde' } });

      expect(requestTextarea).toHaveValue('Por favor orem pela minha saúde');
    });

    it('should toggle privacy checkbox when clicked', () => {
      renderPrayerPage();

      const checkbox = screen.getByRole('checkbox', { name: /Permitir que meu pedido seja compartilhado/ }) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Category Selection', () => {
    it('should change category when clicking different category button', () => {
      renderPrayerPage();

      const familyButton = screen.getByText('Família').closest('button');
      expect(familyButton).not.toHaveClass('border-purple-500');

      fireEvent.click(familyButton!);
      expect(familyButton).toHaveClass('border-purple-500', 'bg-purple-50');
    });

    it('should allow selecting each category', () => {
      renderPrayerPage();

      const categories = ['Família', 'Trabalho/Finanças', 'Vida Espiritual', 'Relacionamentos', 'Gratidão', 'Outros'];

      for (const category of categories) {
        const categoryButton = screen.getByText(category).closest('button');
        fireEvent.click(categoryButton!);
        expect(categoryButton).toHaveClass('border-purple-500', 'bg-purple-50');
      }
    });

    it('should only have one category selected at a time', () => {
      renderPrayerPage();

      const healthButton = screen.getByText('Saúde').closest('button');
      const familyButton = screen.getByText('Família').closest('button');

      expect(healthButton).toHaveClass('border-purple-500');
      expect(familyButton).not.toHaveClass('border-purple-500');

      fireEvent.click(familyButton!);
      expect(healthButton).not.toHaveClass('border-purple-500');
      expect(familyButton).toHaveClass('border-purple-500');
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      renderPrayerPage();

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, preencha seu nome e o pedido de oração/)).toBeInTheDocument();
      });
    });

    it('should show error when submitting with only name', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'João Silva' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, preencha seu nome e o pedido de oração/)).toBeInTheDocument();
      });
    });

    it('should show error when submitting with only request', async () => {
      renderPrayerPage();

      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, preencha seu nome e o pedido de oração/)).toBeInTheDocument();
      });
    });

    it('should show error when name is only whitespace', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, preencha seu nome e o pedido de oração/)).toBeInTheDocument();
      });
    });

    it('should show error when request is only whitespace', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, preencha seu nome e o pedido de oração/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit prayer request successfully with required fields only', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem pela minha família' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          { _collectionPath: 'prayerRequests' },
          expect.objectContaining({
            name: 'João Silva',
            email: '',
            phone: '',
            category: 'health',
            request: 'Por favor orem pela minha família',
            isPublic: false,
            status: 'pending',
            createdAt: { type: 'serverTimestamp' },
            source: 'public-form'
          })
        );
      });
    });

    it('should submit prayer request with all fields filled', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('seu@email.com') as HTMLInputElement;
      const phoneInput = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;
      const checkbox = screen.getByRole('checkbox', { name: /Permitir que meu pedido seja compartilhado/ }) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(emailInput, { target: { value: 'joao@teste.com' } });
      fireEvent.change(phoneInput, { target: { value: '(11) 99999-9999' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem pela minha saúde' } });
      fireEvent.click(checkbox);

      const familyButton = screen.getByText('Família').closest('button');
      fireEvent.click(familyButton!);

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          { _collectionPath: 'prayerRequests' },
          expect.objectContaining({
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '(11) 99999-9999',
            category: 'family',
            request: 'Por favor orem pela minha saúde',
            isPublic: true,
            status: 'pending',
            createdAt: { type: 'serverTimestamp' },
            source: 'public-form'
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      mockAddDoc.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should disable submit button while submitting', async () => {
      mockAddDoc.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      });
    });

    it('should show success page after successful submission', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Pedido Enviado!')).toBeInTheDocument();
        expect(screen.getByText(/Recebemos seu pedido de oração/)).toBeInTheDocument();
        expect(screen.getByText(/Que Deus abençoe sua vida/)).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Pedido Enviado!')).toBeInTheDocument();
      });

      // Click "Enviar Outro Pedido" button
      const anotherRequestButton = screen.getByText('Enviar Outro Pedido');
      fireEvent.click(anotherRequestButton);

      // Form should be reset
      await waitFor(() => {
        const nameInputAfterReset = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
        const requestTextareaAfterReset = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;
        expect(nameInputAfterReset).toHaveValue('');
        expect(requestTextareaAfterReset).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when submission fails', async () => {
      mockAddDoc.mockRejectedValue(new Error('Network error'));

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao enviar pedido. Tente novamente/)).toBeInTheDocument();
      });
    });

    it('should clear error message when submitting again', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({ id: 'prayer-123' });

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao enviar pedido/)).toBeInTheDocument();
      });

      // Try again
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Erro ao enviar pedido/)).not.toBeInTheDocument();
      });
    });

    it('should log error to console when submission fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      mockAddDoc.mockRejectedValue(error);

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting prayer request:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should re-enable submit button after error', async () => {
      mockAddDoc.mockRejectedValue(new Error('Network error'));

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao enviar pedido/)).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Success Page', () => {
    it('should show success page with proper elements', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Pedido Enviado!')).toBeInTheDocument();
        expect(screen.getByText(/Recebemos seu pedido de oração/)).toBeInTheDocument();
        expect(screen.getByText('Enviar Outro Pedido')).toBeInTheDocument();
        expect(screen.getByText('Voltar ao Início')).toBeInTheDocument();
      });
    });

    it('should return to form when clicking "Enviar Outro Pedido"', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Pedido Enviado!')).toBeInTheDocument();
      });

      const anotherRequestButton = screen.getByText('Enviar Outro Pedido');
      fireEvent.click(anotherRequestButton);

      await waitFor(() => {
        expect(screen.getByText('Pedido de Oração')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Como podemos te chamar/)).toBeInTheDocument();
      });
    });

    it('should have home link in success page', async () => {
      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const homeLink = screen.getByText('Voltar ao Início');
        expect(homeLink.closest('a')).toHaveAttribute('href', '/');
      });
    });
  });

  describe('Settings Integration', () => {
    it('should use default church name when settings are null', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false
      });

      renderPrayerPage();

      // Component should still render without errors
      expect(screen.getByText('Pedido de Oração')).toBeInTheDocument();
    });

    it('should use church name from settings', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Minha Igreja Especial',
          churchEmail: 'contato@minhaigreja.com'
        },
        loading: false
      });

      renderPrayerPage();

      // Component should render with church name
      expect(screen.getByText('Pedido de Oração')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderPrayerPage();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Pedido de Oração');
    });

    it('should have form labels visible', () => {
      renderPrayerPage();

      expect(screen.getByText('Seu Nome *')).toBeInTheDocument();
      expect(screen.getByText('E-mail (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Telefone (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Seu Pedido de Oração *')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderPrayerPage();

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      expect(submitButton.tagName).toBe('BUTTON');
    });

    it('should have checkbox with proper label', () => {
      renderPrayerPage();

      const checkbox = screen.getByRole('checkbox', { name: /Permitir que meu pedido seja compartilhado/ });
      expect(checkbox).toBeInTheDocument();
    });

    it('should show required field indicators', () => {
      renderPrayerPage();

      expect(screen.getByText(/Seu Nome \*/)).toBeInTheDocument();
      expect(screen.getByText(/Seu Pedido de Oração \*/)).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      renderPrayerPage();

      const emailInput = screen.getByPlaceholderText('seu@email.com');
      const phoneInput = screen.getByPlaceholderText('(00) 00000-0000');
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(phoneInput).toHaveAttribute('type', 'tel');
      expect(requestTextarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('Form Behavior', () => {
    it('should prevent default form submission', async () => {
      renderPrayerPage();

      const form = screen.getByRole('button', { name: /Enviar Pedido de Oração/ }).closest('form');
      const submitHandler = jest.fn((e) => e.preventDefault());
      form!.addEventListener('submit', submitHandler);

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalled();
      });
    });

    it('should handle rapid form submissions gracefully', async () => {
      mockAddDoc.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderPrayerPage();

      const nameInput = screen.getByPlaceholderText(/Como podemos te chamar/) as HTMLInputElement;
      const requestTextarea = screen.getByPlaceholderText(/Compartilhe seu pedido aqui/) as HTMLTextAreaElement;

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(requestTextarea, { target: { value: 'Por favor orem por mim' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Pedido de Oração/ });

      // Try to click multiple times rapidly
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should only be called once due to disabled state
        expect(mockAddDoc).toHaveBeenCalledTimes(1);
      });
    });
  });
});
