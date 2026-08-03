import React, { ReactNode } from "react";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  route: string;
  fallback?: ReactNode;
}

export function FeatureErrorBoundary({ children, route, fallback }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary route={route} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
