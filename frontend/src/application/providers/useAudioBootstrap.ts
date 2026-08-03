import { useEffect } from "react";

import { initAudioPool } from "@/shared/services/sound";

export function useAudioBootstrap() {
  useEffect(() => {
    initAudioPool().catch(() => {});
  }, []);
}
