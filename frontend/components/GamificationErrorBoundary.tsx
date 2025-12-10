"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
}

export function GamificationErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Failed to load gamification data</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
