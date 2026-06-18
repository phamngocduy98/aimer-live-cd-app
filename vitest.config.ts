import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "apps/backend/src/**/*.test.ts"],
    exclude: ["node_modules", "out", "dist", "apps/backend/dist"],
    coverage: {
      provider: "v8",
      include: ["apps/backend/src/**"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/backend/src"),
      "@app": path.resolve(__dirname, "src/renderer/src/app"),
      "@components": path.resolve(__dirname, "src/renderer/src/components"),
      "@features": path.resolve(__dirname, "src/renderer/src/features"),
      "@lib": path.resolve(__dirname, "src/renderer/src/lib"),
      "@renderer": path.resolve(__dirname, "src/renderer/src"),
      "@utils": path.resolve(__dirname, "src/renderer/src/utils")
    }
  }
});
