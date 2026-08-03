import "react-native-gesture-handler";

import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/application/providers/auth";
import { SettingsProvider } from "@/application/providers/settings";
import { SocketProvider } from "@/application/providers/socket";
import { ThemeProvider } from "@/application/providers/theme";
import { AppBootstrap } from "@/application/bootstrap/AppBootstrap";
import { initAudioPool } from "@/shared/services/sound";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    initAudioPool().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SettingsProvider>
              <AuthProvider>
                <SocketProvider>
                  <AppBootstrap />
                </SocketProvider>
              </AuthProvider>
            </SettingsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
