'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-1">Алдаа гарлаа</h3>
          <p className="text-sm text-[var(--esl-text-secondary)] mb-4 text-center max-w-sm">
            Хуудас ачааллахад алдаа гарлаа. Дахин оролдоно уу.
          </p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E8242C] text-white rounded-xl text-sm font-semibold hover:bg-[#C41E25] transition border-none cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Дахин оролдох
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
