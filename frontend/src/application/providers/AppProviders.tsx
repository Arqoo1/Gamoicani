import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/application/providers/auth";
import { SettingsProvider } from "@/application/providers/settings";
import { SocketProvider } from "@/application/providers/socket";
import { ThemeProvider } from "@/application/providers/theme";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const providerTree = useMemo(
    () => (
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SettingsProvider>
                <AuthProvider>
                  <SocketProvider>{children}</SocketProvider>
                </AuthProvider>
              </SettingsProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    ),
    [children]
  );

  return providerTree;
}
