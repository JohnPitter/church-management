import React from 'react';
import { render, screen } from '@testing-library/react';
import PageShell from '../PageShell';

describe('PageShell', () => {
  it('renders title, subtitle, actions and main content region', () => {
    render(
      <PageShell
        title="Titulo Teste"
        subtitle="Subtitulo"
        actions={<button type="button">Acao</button>}
      >
        <p>Conteudo do corpo</p>
      </PageShell>
    );

    expect(screen.getByRole('heading', { name: 'Titulo Teste' })).toBeInTheDocument();
    expect(screen.getByText('Subtitulo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acao' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Conteudo do corpo');
  });

  it('supports fullBleed content without max-w-7xl constraint class', () => {
    const { container } = render(
      <PageShell title="Full" fullBleed contentClassName="custom-bleed">
        <span>x</span>
      </PageShell>
    );
    const main = container.querySelector('[role="main"]');
    expect(main).toHaveClass('custom-bleed');
    expect(main?.className || '').not.toMatch(/max-w-7xl/);
  });
});
