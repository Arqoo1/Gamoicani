import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/shared/api/client", replacement: path.resolve(import.meta.dirname, "src/test/mocks/apiClient.ts") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
    ],
  },
  test: {
    environment: "node",
    globals: false,
  },
});
