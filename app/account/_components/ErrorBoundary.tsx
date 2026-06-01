"use client";

import React from "react";

// Tiny error boundary so production crashes show a readable message
// instead of Next.js's generic "Application error: a client-side exception".

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; label?: string },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Draw Tree viewer crashed:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mt-6 border border-red-200 bg-red-50 rounded p-4 text-sm">
          <div className="font-medium text-red-800 mb-2">
            {this.props.label || "Viewer"} hit an error
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words text-red-900/80">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 text-xs px-2 py-1 border border-red-200 bg-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
