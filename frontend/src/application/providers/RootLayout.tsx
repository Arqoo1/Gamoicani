import "react-native-gesture-handler";

import { useAudioBootstrap } from "@/application/providers/useAudioBootstrap";
import { AppBootstrap } from "@/application/providers/AppBootstrap";
import { AppProviders } from "@/application/providers/AppProviders";

export default function RootLayout() {
  useAudioBootstrap();

  return (
    <AppProviders>
      <AppBootstrap />
    </AppProviders>
  );
}
