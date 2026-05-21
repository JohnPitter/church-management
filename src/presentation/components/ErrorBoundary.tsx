import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const CHUNK_RELOAD_KEY = 'chunk-reload-attempt';
const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Loading CSS chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed'
];

const isChunkLoadError = (error: Error | null): boolean => {
  if (!error) return false;
  const message = `${error.name} ${error.message}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } else {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
  }

  handleReset = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const chunkError = isChunkLoadError(this.state.error);
      const title = chunkError ? 'Nova versão disponível' : 'Algo deu errado';
      const description = chunkError
        ? 'O aplicativo foi atualizado. Recarregue a página para carregar a versão mais recente.'
        : 'Ocorreu um erro inesperado. Tente recarregar a pagina.';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">:(</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {title}
            </h2>
            <p className="text-gray-600 mb-6">
              {description}
            </p>
            <div className="space-x-3">
              {!chunkError && (
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tentar novamente
                </button>
              )}
              <button
                onClick={this.handleHardReload}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Recarregar pagina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
