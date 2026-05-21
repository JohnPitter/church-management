import { render, screen, waitFor } from '@testing-library/react';
import { OpenStreetMap } from '../OpenStreetMap';

var mockSetView = jest.fn((_coords: unknown, _zoom: unknown) => undefined);
var mockTileAddTo = jest.fn((_map: unknown) => undefined);
var mockBindPopup = jest.fn();
var mockOpenPopup = jest.fn();
var mockMarkerAddTo = jest.fn((_map: unknown) => ({
  bindPopup: (content: string) => {
    mockBindPopup(content);
    return { openPopup: mockOpenPopup };
  },
}));
var mockRemove = jest.fn();
var mockMap = jest.fn(() => {
  const instance = {
    setView: (coords: unknown, zoom: unknown) => {
      mockSetView(coords, zoom);
      return instance;
    },
    remove: mockRemove,
  };
  return instance;
});
var mockTileLayer = jest.fn(() => ({
  addTo: (map: unknown) => mockTileAddTo(map),
}));
var mockMarker = jest.fn(() => ({
  addTo: (map: unknown) => mockMarkerAddTo(map),
}));

jest.mock('leaflet', () => {
  const leafletMock = {
    divIcon: jest.fn(() => 'icon'),
    map: (...args: unknown[]) => (mockMap as jest.Mock)(...args),
    tileLayer: (...args: unknown[]) => (mockTileLayer as jest.Mock)(...args),
    marker: (...args: unknown[]) => (mockMarker as jest.Mock)(...args),
  };

  return {
    __esModule: true,
    default: leafletMock,
    ...leafletMock,
  };
});

jest.mock('leaflet/dist/leaflet.css', () => ({}));

describe('OpenStreetMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '-23.5', lon: '-46.6' }],
    }) as any;
  });

  it('renderiza loading e mostra fallback de erro quando a inicializacao falha', async () => {
    const { container } = render(
      <OpenStreetMap latitude={-23.5} longitude={-46.6} churchName="Igreja" address="Rua 1" />
    );

    expect(screen.getByText('Carregando mapa...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockMap).toHaveBeenCalled();
    });

    expect(await screen.findByText('Erro ao carregar o mapa')).toBeInTheDocument();
    expect(container.textContent).toContain('Rua 1');
  });

  it('faz geocoding quando recebe endereco sem coordenadas', async () => {
    render(<OpenStreetMap address="Endereco Teste" churchName="Igreja" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockMap).toHaveBeenCalled();
    });
  });
});
