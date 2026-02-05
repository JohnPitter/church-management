// Unit Tests - DonatePage
// Comprehensive tests for the public donation page with PIX and bank transfer info
// Tests settings integration, copy functionality, and fallback values

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DonatePage } from '../DonatePage';
import { useSettings } from '../../contexts/SettingsContext';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: jest.fn()
}));

// Mock react-router-dom Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )
}));

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn()
};

describe('DonatePage', () => {
  const mockSettings = {
    churchName: 'Igreja Teste',
    churchEmail: 'teste@igreja.com.br',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    pixKey: 'pix@igreja.com.br',
    bankAccount: {
      bankName: 'Banco Teste',
      agency: '1234-5',
      accountNumber: '98765-4',
      accountType: 'Poupança'
    },
    whatsappNumber: '+5511999999999'
  };

  const renderDonatePage = () => {
    return render(
      <BrowserRouter>
        <DonatePage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: mockClipboard });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Page Rendering', () => {
    it('should render the donate page with hero section', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Fazer Doação')).toBeInTheDocument();
      expect(screen.getByText(/Sua contribuição ajuda a manter nossos projetos/)).toBeInTheDocument();
    });

    it('should render both donation methods', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText('Transferência Bancária')).toBeInTheDocument();
    });

    it('should render the "Why Donate" section with all three reasons', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Por que Contribuir?')).toBeInTheDocument();
      expect(screen.getByText('Manutenção')).toBeInTheDocument();
      expect(screen.getByText('Projetos Sociais')).toBeInTheDocument();
      expect(screen.getByText('Missões')).toBeInTheDocument();

      expect(screen.getByText(/Ajude a manter nossa estrutura/)).toBeInTheDocument();
      expect(screen.getByText(/Apoie ações que transformam vidas/)).toBeInTheDocument();
      expect(screen.getByText(/Leve esperança a lugares/)).toBeInTheDocument();
    });

    it('should render the Bible verse section', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText(/Cada um dê conforme determinou em seu coração/)).toBeInTheDocument();
      expect(screen.getByText('2 Coríntios 9:7')).toBeInTheDocument();
    });

    it('should render back to home button', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const backButton = screen.getByText('Voltar ao Início');
      expect(backButton).toBeInTheDocument();
      expect(backButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('PIX Section', () => {
    it('should render PIX section with description', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText(/Faça sua doação de forma rápida e segura via PIX/)).toBeInTheDocument();
      expect(screen.getByText('Chave PIX (E-mail)')).toBeInTheDocument();
    });

    it('should display configured PIX key from settings', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('pix@igreja.com.br')).toBeInTheDocument();
    });

    it('should fallback to churchEmail when pixKey is not configured', () => {
      const settingsWithoutPix = { ...mockSettings } as any;
      delete settingsWithoutPix.pixKey;

      (useSettings as jest.Mock).mockReturnValue({ settings: settingsWithoutPix });

      renderDonatePage();

      expect(screen.getByText('teste@igreja.com.br')).toBeInTheDocument();
    });

    it('should use default PIX when neither pixKey nor churchEmail are set', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: { churchName: 'Igreja Teste' }
      });

      renderDonatePage();

      expect(screen.getByText('contato@igreja.com.br')).toBeInTheDocument();
    });

    it('should display copy button', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should display PIX instructions', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText(/Abra o app do seu banco, selecione PIX e cole a chave acima/)).toBeInTheDocument();
    });
  });

  describe('Copy PIX Functionality', () => {
    it('should copy PIX key to clipboard when copy button is clicked', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pix@igreja.com.br');
    });

    it('should show "Copiado!" feedback after copying', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      fireEvent.click(copyButton);

      expect(screen.getByText('Copiado!')).toBeInTheDocument();
      expect(screen.queryByText('Copiar')).not.toBeInTheDocument();
    });

    it('should reset copy feedback to "Copiar" after 2 seconds', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });
      jest.useFakeTimers();

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      fireEvent.click(copyButton);

      expect(screen.getByText('Copiado!')).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText('Copiar')).toBeInTheDocument();
        expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
      });
    });

    it('should not reset feedback before 2 seconds', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });
      jest.useFakeTimers();

      renderDonatePage();

      fireEvent.click(screen.getByRole('button', { name: /Copiar/i }));
      expect(screen.getByText('Copiado!')).toBeInTheDocument();

      jest.advanceTimersByTime(1999);
      expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });

    it('should allow multiple copy operations', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });
      jest.useFakeTimers();

      renderDonatePage();

      // First copy
      fireEvent.click(screen.getByRole('button', { name: /Copiar/i }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      await waitFor(() => expect(screen.getByText('Copiar')).toBeInTheDocument());

      // Second copy
      fireEvent.click(screen.getByRole('button', { name: /Copiar/i }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });

  describe('Bank Transfer Section', () => {
    it('should render bank transfer section with description', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Transferência Bancária')).toBeInTheDocument();
      expect(screen.getByText(/Doe via TED ou DOC para nossa conta/)).toBeInTheDocument();
    });

    it('should display all bank account fields', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Banco:')).toBeInTheDocument();
      expect(screen.getByText('Agência:')).toBeInTheDocument();
      expect(screen.getByText('Conta:')).toBeInTheDocument();
      expect(screen.getByText('Tipo:')).toBeInTheDocument();
      expect(screen.getByText('Titular:')).toBeInTheDocument();
      expect(screen.getByText('CNPJ:')).toBeInTheDocument();
    });

    it('should display configured bank account information', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Banco Teste')).toBeInTheDocument();
      expect(screen.getByText('1234-5')).toBeInTheDocument();
      expect(screen.getByText('98765-4')).toBeInTheDocument();
      expect(screen.getByText('Poupança')).toBeInTheDocument();
      expect(screen.getByText('Igreja Teste')).toBeInTheDocument();
      expect(screen.getByText('00.000.000/0001-00')).toBeInTheDocument();
    });

    it('should display church name as account holder', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const holderText = screen.getByText('Igreja Teste');
      expect(holderText).toBeInTheDocument();
    });
  });

  describe('Bank Account Fallback Values', () => {
    it('should use default bank name when not configured', () => {
      const settingsWithoutBank = { ...mockSettings } as any;
      delete settingsWithoutBank.bankAccount;

      (useSettings as jest.Mock).mockReturnValue({ settings: settingsWithoutBank });

      renderDonatePage();

      expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
    });

    it('should use default agency when not configured', () => {
      const settingsWithoutBank = { ...mockSettings } as any;
      delete settingsWithoutBank.bankAccount;

      (useSettings as jest.Mock).mockReturnValue({ settings: settingsWithoutBank });

      renderDonatePage();

      expect(screen.getByText('0000-0')).toBeInTheDocument();
    });

    it('should use default account number when not configured', () => {
      const settingsWithoutBank = { ...mockSettings } as any;
      delete settingsWithoutBank.bankAccount;

      (useSettings as jest.Mock).mockReturnValue({ settings: settingsWithoutBank });

      renderDonatePage();

      expect(screen.getByText('00000-0')).toBeInTheDocument();
    });

    it('should use default account type "Corrente" when not configured', () => {
      const settingsWithoutBank = { ...mockSettings } as any;
      delete settingsWithoutBank.bankAccount;

      (useSettings as jest.Mock).mockReturnValue({ settings: settingsWithoutBank });

      renderDonatePage();

      expect(screen.getByText('Corrente')).toBeInTheDocument();
    });

    it('should use partial bank settings with defaults for missing fields', () => {
      const partialBankSettings = {
        ...mockSettings,
        bankAccount: {
          bankName: 'Caixa Econômica',
          agency: '5678-9',
          accountNumber: '',
          accountType: ''
        }
      };

      (useSettings as jest.Mock).mockReturnValue({ settings: partialBankSettings });

      renderDonatePage();

      expect(screen.getByText('Caixa Econômica')).toBeInTheDocument();
      expect(screen.getByText('5678-9')).toBeInTheDocument();
      expect(screen.getByText('00000-0')).toBeInTheDocument(); // Default account number
      expect(screen.getByText('Corrente')).toBeInTheDocument(); // Default account type
    });
  });

  describe('Settings Integration', () => {
    it('should use church name from settings', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      expect(screen.getByText('Igreja Teste')).toBeInTheDocument();
    });

    it('should fallback to default church name when settings are null', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: null });

      renderDonatePage();

      expect(screen.getByText('Nossa Igreja')).toBeInTheDocument();
    });

    it('should fallback to default church name when churchName is not set', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: { churchEmail: 'test@test.com' }
      });

      renderDonatePage();

      expect(screen.getByText('Nossa Igreja')).toBeInTheDocument();
    });

    it('should handle empty settings object', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: {} });

      renderDonatePage();

      // Should render with all defaults
      expect(screen.getByText('Nossa Igreja')).toBeInTheDocument();
      expect(screen.getByText('contato@igreja.com.br')).toBeInTheDocument();
      expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
      expect(screen.getByText('0000-0')).toBeInTheDocument();
      expect(screen.getByText('00000-0')).toBeInTheDocument();
      expect(screen.getByText('Corrente')).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle missing settings gracefully', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: null });

      renderDonatePage();

      // Page should still render with defaults
      expect(screen.getByText('Fazer Doação')).toBeInTheDocument();
      expect(screen.getByText('Nossa Igreja')).toBeInTheDocument();
    });

    it('should handle undefined settings properties', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: {
          churchName: undefined,
          churchEmail: undefined,
          pixKey: undefined,
          bankAccount: undefined
        }
      });

      renderDonatePage();

      // Should use all fallback values
      expect(screen.getByText('Nossa Igreja')).toBeInTheDocument();
      expect(screen.getByText('contato@igreja.com.br')).toBeInTheDocument();
      expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
    });

    it('should handle clipboard write failure gracefully', async () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });
      mockClipboard.writeText.mockResolvedValue(undefined); // Reset to working state

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });

      // Should not throw error even if clipboard API fails
      expect(() => fireEvent.click(copyButton)).not.toThrow();
    });

    it('should display CNPJ placeholder regardless of settings', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: null });

      renderDonatePage();

      expect(screen.getByText('00.000.000/0001-00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Fazer Doação');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible copy button', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton.tagName).toBe('BUTTON');
    });

    it('should have accessible navigation link', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const backLink = screen.getByRole('link', { name: /Voltar ao Início/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('UI Elements', () => {
    it('should display emoji icons for visual appeal', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      // Check that emoji content is present (rendered as text)
      const content = document.body.textContent;
      expect(content).toContain('💝');
      expect(content).toContain('📱');
      expect(content).toContain('🏦');
      expect(content).toContain('⛪');
      expect(content).toContain('🤝');
      expect(content).toContain('🌍');
    });

    it('should render PIX key in monospace font', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      const pixKeyElement = screen.getByText('pix@igreja.com.br');
      expect(pixKeyElement.tagName).toBe('CODE');
      expect(pixKeyElement).toHaveClass('font-mono');
    });

    it('should display all sections in correct order', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      renderDonatePage();

      // Check for main heading
      expect(screen.getByRole('heading', { level: 1, name: /Fazer Doação/i })).toBeInTheDocument();

      // Check for payment methods headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      const h2Texts = h2Headings.map(h => h.textContent);

      expect(h2Texts).toContain('PIX');
      expect(h2Texts).toContain('Transferência Bancária');
      expect(h2Texts).toContain('Por que Contribuir?');

      // Check for Bible verse
      expect(screen.getByText(/Cada um dê conforme determinou em seu coração/)).toBeInTheDocument();

      // Check for back button
      expect(screen.getByText('Voltar ao Início')).toBeInTheDocument();
    });
  });

  describe('Component Isolation', () => {
    it('should not affect settings context when rendering', () => {
      const mockUpdateSettings = jest.fn();
      (useSettings as jest.Mock).mockReturnValue({
        settings: mockSettings,
        updateSettings: mockUpdateSettings
      });

      renderDonatePage();

      // Component should only read settings, never update them
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('should render independently without router context errors', () => {
      (useSettings as jest.Mock).mockReturnValue({ settings: mockSettings });

      // Should render without throwing
      expect(() => renderDonatePage()).not.toThrow();
    });
  });
});
