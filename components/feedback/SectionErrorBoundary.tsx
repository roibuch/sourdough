"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SectionErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-950"
        >
          <p className="font-semibold">
            {this.props.title ?? "שגיאה בטעינת החלק"}
          </p>
          <p className="mt-2 leading-relaxed opacity-90">
            נסו לרענן את הדף. אם הבעיה נמשכת — נקו מטמון הדפדפן (או הסירו את האפליקיה
            מהמסך הבית והתקינו מחדש).
          </p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
              if (typeof window !== "undefined") window.location.reload();
            }}
          >
            רענון הדף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
