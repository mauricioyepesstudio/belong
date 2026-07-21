"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "@/components/error/error-fallback";

type SegmentErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  fallback?: ReactNode;
};

type SegmentErrorBoundaryState = {
  error: Error | null;
};

export class SegmentErrorBoundary extends Component<
  SegmentErrorBoundaryProps,
  SegmentErrorBoundaryState
> {
  state: SegmentErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SegmentErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SegmentErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          reset={this.handleReset}
          title={this.props.title ?? "Something went wrong"}
        />
      );
    }

    return this.props.children;
  }
}
