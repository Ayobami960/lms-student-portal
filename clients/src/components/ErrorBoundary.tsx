import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <AlertTriangle size={40} className="mb-4 text-amber-500" />
          <h1 className="mb-1 text-xl font-bold">Something went wrong</h1>
          <p className="mb-4  text-sm text-muted-foreground">
            An unexpected error occurred. Try reloading the page — if it keeps happening, please report it.
          </p>
          <button className="btn-primary cursor-pointer" onClick={() => window.location.assign("/")}>
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
