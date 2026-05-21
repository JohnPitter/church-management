import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentSettings } from '../ComponentSettings';
import { ComponentType } from '../../../../modules/content-management/home-builder/domain/entities/HomeBuilder';

const baseComponent = {
  id: 'comp-1',
  type: ComponentType.HERO,
  order: 1,
  enabled: true,
  settings: {
    title: 'Titulo',
    subtitle: 'Subtitulo',
    description: 'Descricao',
    backgroundType: 'solid',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    alignment: 'center',
    showButtons: false,
  },
} as any;

describe('ComponentSettings', () => {
  it('renderiza configuracoes basicas e salva alteracoes', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    render(
      <ComponentSettings component={baseComponent} onSave={onSave} onCancel={onCancel} />
    );

    fireEvent.change(screen.getByDisplayValue('Titulo'), { target: { value: 'Novo titulo' } });
    fireEvent.click(screen.getByText('💾 Salvar Alterações'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Novo titulo',
      })
    );

    fireEvent.click(screen.getAllByText('Cancelar')[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('renderiza configuracoes especificas do hero com botoes', () => {
    render(
      <ComponentSettings
        component={{
          ...baseComponent,
          settings: {
            ...baseComponent.settings,
            showButtons: true,
          },
        }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Configurações dos Botões')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saiba Mais')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Visite-nos')).toBeInTheDocument();
  });

  it('troca entre tipos de fundo e mostra os campos corretos', () => {
    render(
      <ComponentSettings component={baseComponent} onSave={jest.fn()} onCancel={jest.fn()} />
    );

    fireEvent.change(screen.getByDisplayValue('Cor Sólida'), {
      target: { value: 'gradient' },
    });
    expect(screen.getByText('Direção do Degradê')).toBeInTheDocument();
    expect(screen.getByText('Prévia do Degradê')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Degradê'), {
      target: { value: 'image' },
    });
    expect(screen.getByText('URL da Imagem de Fundo')).toBeInTheDocument();
    expect(screen.getByText('Posição da Imagem')).toBeInTheDocument();
    expect(screen.getByText('Tamanho da Imagem')).toBeInTheDocument();
  });

  it('atualiza estado local quando o componente muda', () => {
    const { rerender } = render(
      <ComponentSettings component={baseComponent} onSave={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByDisplayValue('Titulo')).toBeInTheDocument();

    rerender(
      <ComponentSettings
        component={{
          ...baseComponent,
          type: ComponentType.NEWSLETTER,
          settings: {
            title: 'Newsletter',
            subtitle: '',
            description: '',
          },
        } as any}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue('Newsletter')).toBeInTheDocument();
  });
});
