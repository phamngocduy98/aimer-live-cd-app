import { type Page, _electron as electron } from "@playwright/test";
import { join } from "path";
import { fileURLToPath } from "url";
import type { ElectronApp, ElectronTestContext, LaunchOptions } from "./types.js";
import { E2E_DB_NAME } from "./test-data.js";

export type { ElectronTestContext, LaunchOptions };

export async function launchApp(
  testUserDataDir: string,
  options?: LaunchOptions
): Promise<ElectronTestContext> {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const electronApp: ElectronApp = await electron.launch({
    args: [
      `--user-data-dir=${testUserDataDir}`,
      join(fileURLToPath(import.meta.url), "../../../out/main/index.js")
    ],
    env: {
      ...launchEnv,
      APPDATA: testUserDataDir,
      DISABLE_DEVTOOLS: "true",
      E2E_TEST_MODE: "true",
      MONGO_DB_NAME: process.env.MONGO_DB_NAME || E2E_DB_NAME,
      API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3001/api",
      STREAM_BASE_URL: process.env.STREAM_BASE_URL || "http://localhost:3001/api"
    },
    timeout: 60000
  });

  try {
    let window = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: options?.windowTimeout ?? 30000
    });
    await window.waitForLoadState("domcontentloaded");

    if (options?.windowSize) {
      const [width, height] = options.windowSize;
      const electronWin = await electronApp.browserWindow(window);
      await electronWin.evaluate((win, { width, height }) => win.setSize(width, height), {
        width,
        height
      });
    }

    return { electronApp, mainWindow: window };
  } catch (error) {
    await electronApp.close();
    throw error;
  }
}
