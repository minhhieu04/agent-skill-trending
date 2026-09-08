import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleCopyLog = () => {
    const errorText = `[Application Error Log]\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent Stack: ${this.state.errorInfo?.componentStack || 'N/A'}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[500px] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
          <div className="max-w-2xl w-full p-6 sm:p-7 rounded-3xl neu-modal space-y-5 text-[var(--text-main)] animate-in zoom-in-95">
            {/* Error Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--shadow-dark)]/20">
              <div className="w-10 h-10 rounded-2xl neu-inset text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                  Đã xảy ra lỗi giao diện / Application Error
                </h3>
                <p className="text-xs text-rose-500 font-mono mt-0.5 break-all">
                  {this.state.error?.message || 'Unexpected application render state'}
                </p>
              </div>
            </div>

            {/* Error Details Log Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Chi tiết lỗi & Call Stack</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={this.handleCopyLog}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn-sm text-[var(--text-muted)] hover:text-[var(--primary)] text-xs font-semibold transition-colors cursor-pointer"
                >
                  {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{this.state.copied ? 'Đã sao chép Log!' : 'Sao chép Log'}</span>
                </button>
              </div>

              {this.state.showDetails && (
                <div className="p-4 rounded-2xl neu-inset text-[11px] font-mono text-rose-400 overflow-x-auto max-h-60 leading-relaxed select-all whitespace-pre-wrap">
                  <div><strong>Error:</strong> {this.state.error?.message}</div>
                  {this.state.error?.stack && (
                    <div className="mt-2 text-[var(--text-muted)]">{this.state.error.stack}</div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 text-[var(--text-muted)]/70">{this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--shadow-dark)]/20">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-primary text-white text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang / Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
