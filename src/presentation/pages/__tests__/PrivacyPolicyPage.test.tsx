// Unit Tests - Privacy Policy Page

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicyPage } from '../PrivacyPolicyPage';

const mockUseSettings = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <PrivacyPolicyPage />
    </MemoryRouter>
  );

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    mockUseSettings.mockReturnValue({
      settings: { churchName: 'Igreja Teste', churchEmail: 'dpo@igrejateste.org', churchPhone: '(11) 99999-0000' },
      loading: false
    });
  });

  it('renders main heading and update date', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/Última atualização: 25 de outubro de 2026/)).toBeInTheDocument();
  });

  it('renders key LGPD sections', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Controlador e Encarregado/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dados que coletamos/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Bases legais/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Seus direitos/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Crianças e adolescentes/ })).toBeInTheDocument();
  });

  it('links to account deletion page', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Excluir minha conta/ })).toHaveAttribute('href', '/excluir-conta');
  });

  it('uses church name and contact from settings', () => {
    renderPage();
    expect(screen.getAllByText(/Igreja Teste/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'dpo@igrejateste.org' })[0]).toHaveAttribute(
      'href',
      'mailto:dpo@igrejateste.org'
    );
  });

  it('falls back to the default church email without settings', () => {
    mockUseSettings.mockReturnValue({ settings: null, loading: false });
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'igreja.ibc.cacote@gmail.com' })[0]).toHaveAttribute(
      'href',
      'mailto:igreja.ibc.cacote@gmail.com'
    );
  });
});
