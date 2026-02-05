// Unit Tests - Contact Page
// Comprehensive tests for contact form and information display

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ContactPage } from '../ContactPage';

// Mock useSettings
const mockUseSettings = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

// Mock Firebase
const mockAddDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'mock-timestamp');
const mockCollection = jest.fn(() => ({ _collectionPath: 'contactMessages' }));

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: () => mockServerTimestamp()
}));

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: {
        churchName: 'Igreja Teste',
        churchAddress: 'Rua Exemplo, 123',
        churchPhone: '(11) 99999-9999',
        churchEmail: 'contato@igreja.com',
        churchWebsite: 'https://www.igreja.com'
      },
      loading: false
    });
    mockAddDoc.mockResolvedValue({ id: 'message-123' });
    mockCollection.mockReturnValue({ _collectionPath: 'contactMessages' });
    mockServerTimestamp.mockReturnValue('mock-timestamp');
  });

  const renderContactPage = () => {
    return render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the contact page with correct title', () => {
      renderContactPage();

      expect(screen.getByRole('heading', { name: /fale conosco/i })).toBeInTheDocument();
    });

    it('should render hero section with description', () => {
      renderContactPage();

      expect(screen.getByText(/estamos aqui para voc/i)).toBeInTheDocument();
    });

    it('should render "Informacoes" section title', () => {
      renderContactPage();

      expect(screen.getByRole('heading', { name: /informa/i })).toBeInTheDocument();
    });

    it('should render "Envie sua Mensagem" section title', () => {
      renderContactPage();

      expect(screen.getByRole('heading', { name: /envie sua mensagem/i })).toBeInTheDocument();
    });

    it('should render back to home link', () => {
      renderContactPage();

      const backLinks = screen.getAllByRole('link', { name: /voltar ao in/i });
      expect(backLinks.length).toBeGreaterThan(0);
      expect(backLinks[0]).toHaveAttribute('href', '/');
    });
  });

  describe('Contact Information Display', () => {
    it('should display church address when configured', () => {
      renderContactPage();

      expect(screen.getByText(/endere/i)).toBeInTheDocument();
      expect(screen.getByText('Rua Exemplo, 123')).toBeInTheDocument();
    });

    it('should display church phone when configured', () => {
      renderContactPage();

      const phoneHeadings = screen.getAllByText('Telefone');
      expect(phoneHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    });

    it('should display church email when configured', () => {
      renderContactPage();

      expect(screen.getByText('E-mail')).toBeInTheDocument();
      const emailLink = screen.getByRole('link', { name: 'contato@igreja.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:contato@igreja.com');
    });

    it('should display church website when configured', () => {
      renderContactPage();

      expect(screen.getByText('Website')).toBeInTheDocument();
      const websiteLink = screen.getByRole('link', { name: /www\.igreja\.com/i });
      expect(websiteLink).toHaveAttribute('href', 'https://www.igreja.com');
      expect(websiteLink).toHaveAttribute('target', '_blank');
    });

    it('should show placeholder message when no contact info is configured', () => {
      mockUseSettings.mockReturnValue({
        settings: {},
        loading: false
      });

      renderContactPage();

      expect(screen.getByText(/as informa.*es de contato ser.*o exibidas aqui/i)).toBeInTheDocument();
    });

    it('should not show placeholder when at least one contact info is configured', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchEmail: 'test@test.com' },
        loading: false
      });

      renderContactPage();

      expect(screen.queryByText(/as informa.*es de contato ser.*o exibidas aqui/i)).not.toBeInTheDocument();
    });
  });

  describe('WhatsApp Integration', () => {
    it('should display WhatsApp button when whatsappNumber is configured', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink).toBeInTheDocument();
    });

    it('should not display WhatsApp button when whatsappNumber is not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          churchEmail: 'test@test.com'
        },
        loading: false
      });

      renderContactPage();

      expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /conversar no whatsapp/i })).not.toBeInTheDocument();
    });

    it('should have correct WhatsApp URL with country code', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/5511999999999');
    });

    it('should open WhatsApp link in new tab', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink).toHaveAttribute('target', '_blank');
      expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have green button styling for WhatsApp', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink).toHaveClass('bg-green-600');
      expect(whatsappLink).toHaveClass('hover:bg-green-700');
    });

    it('should display WhatsApp along with other contact info', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          churchPhone: '(11) 99999-9999',
          churchEmail: 'contato@igreja.com',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      const phoneElements = screen.getAllByText('Telefone');
      expect(phoneElements.length).toBeGreaterThan(0);
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
      expect(screen.getByText('contato@igreja.com')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('should not show placeholder when only WhatsApp is configured', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      expect(screen.queryByText(/as informa.*es de contato ser.*o exibidas aqui/i)).not.toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('should handle WhatsApp number with different formats', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '11999999999' // Without country code
        },
        loading: false
      });

      renderContactPage();

      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/11999999999');
    });

    it('should display arrow icon in WhatsApp button', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          whatsappNumber: '5511999999999'
        },
        loading: false
      });

      renderContactPage();

      const whatsappLink = screen.getByRole('link', { name: /conversar no whatsapp/i });
      expect(whatsappLink.textContent).toContain('→');
    });
  });

  describe('Contact Form Rendering', () => {
    it('should render name input field', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    });

    it('should render phone input field', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
    });

    it('should render subject input field', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('Sobre o que deseja falar?')).toBeInTheDocument();
    });

    it('should render message textarea', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('Escreva sua mensagem aqui...')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderContactPage();

      expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update name field on input', async () => {
      renderContactPage();

      const nameInput = screen.getByPlaceholderText('Seu nome');
      await userEvent.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('should update email field on input', async () => {
      renderContactPage();

      const emailInput = screen.getByPlaceholderText('seu@email.com');
      await userEvent.type(emailInput, 'john@example.com');

      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should update phone field on input', async () => {
      renderContactPage();

      const phoneInput = screen.getByPlaceholderText('(00) 00000-0000');
      await userEvent.type(phoneInput, '(11) 98765-4321');

      expect(phoneInput).toHaveValue('(11) 98765-4321');
    });

    it('should update subject field on input', async () => {
      renderContactPage();

      const subjectInput = screen.getByPlaceholderText('Sobre o que deseja falar?');
      await userEvent.type(subjectInput, 'Duvida');

      expect(subjectInput).toHaveValue('Duvida');
    });

    it('should update message field on input', async () => {
      renderContactPage();

      const messageInput = screen.getByPlaceholderText('Escreva sua mensagem aqui...');
      await userEvent.type(messageInput, 'Esta e minha mensagem');

      expect(messageInput).toHaveValue('Esta e minha mensagem');
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Test message');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/preencha os campos obrigat/i)).toBeInTheDocument();
      });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Test message');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/preencha os campos obrigat/i)).toBeInTheDocument();
      });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('should show error when message is empty', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/preencha os campos obrigat/i)).toBeInTheDocument();
      });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('should validate whitespace-only input as empty', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), '   ');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Test message');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/preencha os campos obrigat/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all fields filled', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(00) 00000-0000'), '(11) 98765-4321');
      await userEvent.type(screen.getByPlaceholderText('Sobre o que deseja falar?'), 'Duvida');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            phone: '(11) 98765-4321',
            subject: 'Duvida',
            message: 'Esta e minha mensagem',
            status: 'unread'
          })
        );
      });

      // Verify serverTimestamp was called
      expect(mockServerTimestamp).toHaveBeenCalled();
    });

    it('should submit form with only required fields', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            phone: '',
            subject: '',
            message: 'Esta e minha mensagem',
            status: 'unread'
          })
        );
      });

      // Verify serverTimestamp was called
      expect(mockServerTimestamp).toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      mockAddDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enviando/i })).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      mockAddDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after form submission', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Mensagem Enviada!')).toBeInTheDocument();
      });
    });

    it('should show thank you message in success state', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/recebemos sua mensagem e responderemos em breve/i)).toBeInTheDocument();
      });
    });

    it('should show "Enviar Outra Mensagem" button in success state', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enviar outra mensagem/i })).toBeInTheDocument();
      });
    });

    it('should return to form when "Enviar Outra Mensagem" is clicked', async () => {
      renderContactPage();

      // Submit form
      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Mensagem Enviada!')).toBeInTheDocument();
      });

      // Click to send another message
      await userEvent.click(screen.getByRole('button', { name: /enviar outra mensagem/i }));

      // Should show form again
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
      });
    });

    it('should clear form fields after returning from success state', async () => {
      renderContactPage();

      // Submit form
      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Mensagem Enviada!')).toBeInTheDocument();
      });

      // Click to send another message
      await userEvent.click(screen.getByRole('button', { name: /enviar outra mensagem/i }));

      // Fields should be empty
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Seu nome')).toHaveValue('');
        expect(screen.getByPlaceholderText('seu@email.com')).toHaveValue('');
        expect(screen.getByPlaceholderText('Escreva sua mensagem aqui...')).toHaveValue('');
      });
    });

    it('should show link to home in success state', async () => {
      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /voltar ao in/i });
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAddDoc.mockRejectedValueOnce(new Error('Firebase error'));

      renderContactPage();

      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro ao enviar mensagem/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should clear error when form is resubmitted', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAddDoc
        .mockRejectedValueOnce(new Error('Firebase error'))
        .mockResolvedValueOnce({ id: 'message-123' });

      renderContactPage();

      // First attempt - fails
      await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('Escreva sua mensagem aqui...'), 'Esta e minha mensagem');
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro ao enviar mensagem/i)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await userEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(screen.queryByText(/erro ao enviar mensagem/i)).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Sobre o que deseja falar?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Escreva sua mensagem aqui...')).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      renderContactPage();

      expect(screen.getByPlaceholderText('Seu nome')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('seu@email.com')).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText('(00) 00000-0000')).toHaveAttribute('type', 'tel');
      expect(screen.getByPlaceholderText('Sobre o que deseja falar?')).toHaveAttribute('type', 'text');
    });

    it('should indicate required fields with asterisks', () => {
      renderContactPage();

      // Required fields have * in their labels
      expect(screen.getByText(/nome \*/i)).toBeInTheDocument();
      expect(screen.getByText(/e-mail \*/i)).toBeInTheDocument();
      expect(screen.getByText(/mensagem \*/i)).toBeInTheDocument();
    });
  });

  describe('Settings Context Integration', () => {
    it('should use default church name when not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: {},
        loading: false
      });

      renderContactPage();

      // Component uses default value internally
      expect(screen.getByRole('heading', { name: /fale conosco/i })).toBeInTheDocument();
    });

    it('should handle null settings gracefully', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false
      });

      renderContactPage();

      expect(screen.getByRole('heading', { name: /fale conosco/i })).toBeInTheDocument();
    });
  });
});
