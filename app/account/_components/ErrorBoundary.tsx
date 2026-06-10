"use client";

import React from "react";

// Tiny error boundary so production crashes show a readable message
// instead of Next.js's generic "Application error: a client-side exception".
//
// Class components can't use the i18n hook, so parents pass already-
// translated strings via props (with English fallbacks).

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    label?: string;
    errorTitle?: (label: string) => string;
    tryAgainLabel?: string;
  },
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
      const label = this.props.label || "Viewer";
      const title = this.props.errorTitle
        ? this.props.errorTitle(label)
        : `${label} hit an error`;
      return (
        <div className="mt-6 border border-red-200 bg-red-50 rounded p-4 text-sm">
          <div className="font-medium text-red-800 mb-2">{title}</div>
          <pre className="text-xs whitespace-pre-wrap break-words text-red-900/80">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 text-xs px-2 py-1 border border-red-200 bg-white rounded"
          >
            {this.props.tryAgainLabel || "Try again"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
