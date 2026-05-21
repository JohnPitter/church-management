import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutTemplateSelector } from '../LayoutTemplateSelector';

jest.mock('@modules/content-management/home-builder/domain/entities/LayoutTemplates', () => ({
  LayoutStyle: {
    CANVA: 'canva',
    APPLE: 'apple',
    ENTERPRISE: 'enterprise',
  },
  LayoutTemplateFactory: {
    getAllTemplates: () => [
      {
        id: 'canva',
        style: 'canva',
        name: 'Canva',
        description: 'Descricao canva',
        icon: 'C',
        designPrinciples: ['A', 'B', 'C'],
        colorScheme: { primary: '#1', secondary: '#2', accent: '#3', background: '#4' },
      },
      {
        id: 'apple',
        style: 'apple',
        name: 'Apple',
        description: 'Descricao apple',
        icon: 'A',
        designPrinciples: ['X', 'Y', 'Z'],
        colorScheme: { primary: '#5', secondary: '#6', accent: '#7', background: '#8' },
      },
    ],
  },
}));

describe('LayoutTemplateSelector', () => {
  it('renderiza templates, seleciona estilo e confirma', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();

    render(<LayoutTemplateSelector onSelect={onSelect} onCancel={onCancel} />);

    expect(screen.getByText('Escolha o Estilo da Sua Home Page')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Canva'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar Layout' }));

    expect(onSelect).toHaveBeenCalledWith('canva');
  });

  it('permite cancelar e mantem botao desabilitado sem selecao', () => {
    const onCancel = jest.fn();
    render(<LayoutTemplateSelector onSelect={jest.fn()} onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: 'Selecione um Estilo' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onCancel).toHaveBeenCalled();
  });
});
