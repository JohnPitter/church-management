import React from 'react';

describe('index.tsx', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    jest.resetModules();
  });

  it('inicializa a aplicacao no elemento root e chama reportWebVitals', () => {
    const mockRender = jest.fn();
    const mockCreateRoot = jest.fn(() => ({ render: mockRender }));
    const mockReportWebVitals = jest.fn();

    jest.doMock('react-dom/client', () => ({
      __esModule: true,
      default: {
        createRoot: mockCreateRoot,
      },
      createRoot: mockCreateRoot,
    }));

    jest.doMock('../App', () => ({
      __esModule: true,
      default: () => <div data-testid="app">Mocked App</div>,
    }));

    jest.doMock('../reportWebVitals', () => ({
      __esModule: true,
      default: mockReportWebVitals,
    }));

    jest.isolateModules(() => {
      require('../index');
    });

    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedTree = mockRender.mock.calls[0][0] as React.ReactElement<{ children: React.ReactNode }>;
    expect(renderedTree.type).toBe(React.StrictMode);

    const appElement = React.Children.only(renderedTree.props.children) as React.ReactElement;
    expect(appElement.type).toBeDefined();
    expect(mockReportWebVitals).toHaveBeenCalledTimes(1);
  });
});
