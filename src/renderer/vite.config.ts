import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: __dirname,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        password: resolve(__dirname, "password.html")
      }
    }
  },
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src"),
      "@app": resolve(__dirname, "src/app"),
      "@components": resolve(__dirname, "src/components"),
      "@features": resolve(__dirname, "src/features"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@lib": resolve(__dirname, "src/lib"),
      "@utils": resolve(__dirname, "src/utils")
    }
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" }
  }
});
