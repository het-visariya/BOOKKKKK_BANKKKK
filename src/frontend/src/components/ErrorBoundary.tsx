import { Component, type ErrorInfo, type ReactNode } from "react";
import { getLogoSrc } from "./layout/AppLayout";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches any crash and shows a helpful message
 * instead of the blank white screen with "Something went wrong!"
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SVGA ErrorBoundary]", error, info);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "#E8F4F8" }}
        >
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-white border-4 border-[#B8E0E8] overflow-hidden shadow-md p-1">
              <img
                src={getLogoSrc("default")}
                alt="SVGA Book Bank"
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#0c2340]">
                Oops! Something went wrong.
              </h1>
              <p className="text-sm text-[#1e3a5f]/70">
                The app ran into a problem. This usually fixes itself — try
                reloading the page.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-mono break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-[#5AC8D8] hover:bg-[#88D4E0] text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
