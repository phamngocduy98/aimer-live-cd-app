import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    build: {
      lib: {
        entry: "./src/preload/index.ts",
        formats: ["cjs"]
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          main: "./src/renderer/index.html",
          password: "./src/renderer/password.html"
        }
      }
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@app": resolve("src/renderer/src/app"),
        "@components": resolve("src/renderer/src/components"),
        "@features": resolve("src/renderer/src/features"),
        "@hooks": resolve("src/renderer/src/hooks"),
        "@lib": resolve("src/renderer/src/lib"),
        "@utils": resolve("src/renderer/src/utils")
      }
    },
    plugins: [react()]
  }
});
