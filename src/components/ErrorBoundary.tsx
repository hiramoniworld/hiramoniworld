import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060810] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-slate-800 bg-[#0C1120] rounded-xl p-8 space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-amber-300/80">
              HIRA · Recovery
            </p>
            <h1 className="text-2xl font-semibold text-slate-100">
              Something interrupted this view
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              The request could not be completed safely. Please refresh or return to the main universe.
            </p>
            <pre className="text-xs font-mono text-slate-400 bg-[#060810] border border-slate-800/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {this.state.message}
            </pre>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-300/90 text-slate-950 hover:bg-amber-200 transition-colors"
              >
                Return Home
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
