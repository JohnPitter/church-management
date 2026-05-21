import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentPalette } from '../ComponentPalette';

jest.mock('../../../../modules/content-management/home-builder/domain/entities/HomeBuilder', () => ({
  COMPONENT_TEMPLATES: [
    {
      id: 'hero',
      name: 'Hero',
      description: 'Banner principal',
      category: 'content',
      icon: 'H',
      premium: false,
    },
    {
      id: 'video',
      name: 'Video',
      description: 'Midia em video',
      category: 'media',
      icon: 'V',
      premium: true,
    },
  ],
}));

describe('ComponentPalette', () => {
  it('renderiza templates e adiciona componente ao clicar', () => {
    const onAddComponent = jest.fn();
    render(<ComponentPalette onAddComponent={onAddComponent} />);

    fireEvent.click(screen.getByText('Hero'));

    expect(screen.getByText('📦 Componentes')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(onAddComponent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hero' })
    );
  });

  it('filtra por pesquisa e categoria e mostra estado vazio', () => {
    render(<ComponentPalette onAddComponent={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Pesquisar componentes...'), {
      target: { value: 'Video' },
    });

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.queryByText('Hero')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Conteúdo/i }));
    expect(screen.getByText('Nenhum componente encontrado')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Limpar pesquisa'));
    expect(screen.getByText('Hero')).toBeInTheDocument();
  });
});
