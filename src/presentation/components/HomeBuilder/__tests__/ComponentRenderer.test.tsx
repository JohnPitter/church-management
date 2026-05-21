import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ComponentRenderer } from '../ComponentRenderer';
import { ComponentType } from '../../../../modules/content-management/home-builder/domain/entities/HomeBuilder';

var mockSanitize = jest.fn((html: string) => html);
var mockSubmitPrayerRequest = jest.fn();

jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: (html: string) => mockSanitize(html),
  },
}));

jest.mock('@modules/church-management/prayer-requests/application/services/PrayerRequestService', () => ({
  PrayerRequestService: class {
    submitPrayerRequest = (...args: unknown[]) => mockSubmitPrayerRequest(...args);
  },
}));

jest.mock('../../OpenStreetMap', () => ({
  OpenStreetMap: ({ address, churchName }: any) => (
    <div data-testid="osm-map">
      {churchName} - {address}
    </div>
  ),
}));

const baseComponent = {
  id: 'comp-1',
  order: 1,
  enabled: true,
  settings: {},
} as any;

describe('ComponentRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitPrayerRequest.mockResolvedValue({
      success: true,
      message: 'Pedido enviado',
    });
  });

  it('nao renderiza componente desabilitado fora do modo de edicao', () => {
    const { container } = render(
      <ComponentRenderer component={{ ...baseComponent, enabled: false, type: ComponentType.HERO }} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renderiza controles no modo de edicao e dispara callbacks', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggle = jest.fn();

    const { container } = render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.MENU,
          settings: { title: 'Menu Teste', textColor: '#000' },
        }}
        isEditMode
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Ocultar'));
    fireEvent.click(screen.getByTitle('Excluir'));

    expect(screen.getByText('Menu Teste')).toBeInTheDocument();
    expect(onEdit).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalledWith('comp-1');
    expect(onDelete).toHaveBeenCalledWith('comp-1');
  });

  it('renderiza hero com botoes de acao', () => {
    render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.HERO,
          settings: {
            title: 'Titulo Hero',
            subtitle: 'Subtitulo Hero',
            showButtons: true,
            primaryButtonLink: '/join',
            primaryButtonText: 'Participar',
            secondaryButtonText: 'Saiba Mais',
          },
        }}
      />
    );

    expect(screen.getByText('Titulo Hero')).toBeInTheDocument();
    expect(screen.getByText('Subtitulo Hero')).toBeInTheDocument();
  });

  it('renderiza bloco de mapa e usa o componente OpenStreetMap', () => {
    render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.MAP,
          settings: {
            title: 'Como Chegar',
            mapAddress: 'Rua A, 123',
            churchName: 'Igreja B',
          },
        }}
      />
    );

    expect(screen.getAllByText('Como Chegar').length).toBeGreaterThan(0);
    expect(screen.getByTestId('osm-map')).toHaveTextContent('Igreja B - Rua A, 123');
    expect(screen.getByText('Ver no Google Maps')).toBeInTheDocument();
  });

  it('renderiza prayer request e processa submit com sucesso', async () => {
    const { container } = render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.PRAYER_REQUEST,
          settings: {
            title: 'Pedidos',
          },
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Seu nome *'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText('Compartilhe seu pedido de oração... *'), {
      target: { value: 'Pedido de oração suficientemente longo' },
    });
    fireEvent.click(screen.getByText('Enviar Pedido'));

    await waitFor(() => {
      expect(mockSubmitPrayerRequest).toHaveBeenCalled();
      expect(screen.getByText('Pedido Enviado!')).toBeInTheDocument();
    });
  });

  it('renderiza custom html e sanitiza o conteudo', () => {
    const { container } = render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.CUSTOM_HTML,
          settings: { customHTML: '<div>HTML Livre</div>' },
        }}
      />
    );

    expect(mockSanitize).toHaveBeenCalledWith('<div>HTML Livre</div>');
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('renderiza social media, estatisticas, newsletter e fallback default', () => {
    const { rerender } = render(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.SOCIAL_MEDIA,
          settings: { title: 'Redes' },
        }}
      />
    );

    expect(screen.getByText('Redes')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();

    rerender(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.STATISTICS,
          settings: { title: 'Numeros' },
        }}
      />
    );
    expect(screen.getByText('Numeros')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();

    rerender(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: ComponentType.NEWSLETTER,
          settings: { title: 'Newsletter' },
        }}
      />
    );
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu melhor e-mail')).toBeInTheDocument();

    rerender(
      <ComponentRenderer
        component={{
          ...baseComponent,
          type: 'unknown-type' as ComponentType,
          settings: {},
        }}
      />
    );
    expect(screen.getByText(/Este componente ainda não foi implementado/)).toBeInTheDocument();
  });
});
