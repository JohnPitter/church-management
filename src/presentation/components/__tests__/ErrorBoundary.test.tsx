import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

const ThrowingComponent = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderiza os filhos quando nao ha erro', () => {
    render(
      <ErrorBoundary>
        <div>Conteudo Seguro</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Conteudo Seguro')).toBeInTheDocument();
  });

  it('renderiza fallback customizado quando fornecido', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback Customizado</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback Customizado')).toBeInTheDocument();
  });

  it('renderiza fallback padrao e permite resetar o boundary', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar pagina' })).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <div>Conteudo Recuperado</div>
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByText('Conteudo Recuperado')).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });
});
