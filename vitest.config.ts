import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "out", "dist"],
    coverage: {
      provider: "v8",
      include: ["src/main/backend/**"]
    },
    setupFiles: [path.resolve(__dirname, "src/main/backend/__tests__/setup.ts")]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/main/backend")
    }
  }
});
