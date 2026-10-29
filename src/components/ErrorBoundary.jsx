import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold">Ops! Algo deu errado ao carregar</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'Erro inesperado na renderização.'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm text-white transition-all"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('theme');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-sm text-slate-300 transition-all"
              >
                Limpar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
