import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TONTO Frontend Caught Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-dvh bg-white text-[#111827] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#003F25]/10 text-[#003F25] flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#79867D] uppercase mb-1">
            TONTO CLOTHING
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003F25] uppercase tracking-tight mb-3">
            An Unexpected Display Glitch Occurred
          </h1>
          {import.meta.env.DEV && this.state.error && (
            <div className="text-left text-xs bg-red-50 border border-red-200 text-red-900 p-4 rounded max-w-3xl mx-auto overflow-auto mb-6 font-mono whitespace-pre-wrap">
              <p className="font-bold mb-1">{String(this.state.error?.message || this.state.error)}</p>
              <p className="text-[11px] text-red-700">{this.state.error?.stack}</p>
            </div>
          )}
          <p className="text-[13px] text-[#4B5563] max-w-md mx-auto mb-6 leading-relaxed">
            The page view encountered a display error. You can reload the page or return to the main storefront.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Reload Storefront</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/';
              }}
              className="px-6 py-3 border border-[#003F25] text-[#003F25] hover:bg-gray-50 text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
