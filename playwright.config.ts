import { defineConfig, _electron as electron } from "@playwright/test";
import { join } from "path";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000
  }
});
