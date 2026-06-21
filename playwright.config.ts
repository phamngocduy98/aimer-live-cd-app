import { defineConfig } from "@playwright/test";
import "dotenv/config";
import { resolveE2eDbName } from "./apps/backend/src/config/databaseSafety.js";

const E2E_DB_NAME = resolveE2eDbName();

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000
  },
  webServer: {
    command: "pnpm backend:dev",
    url: "http://localhost:3001/api/health",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      ...process.env,
      E2E_TEST_MODE: "true",
      E2E_DB_NAME,
      MONGO_DB_NAME: E2E_DB_NAME
    }
  }
});
