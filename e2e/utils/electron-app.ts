import { type Page, _electron as electron } from "@playwright/test";
import { join } from "path";
import { fileURLToPath } from "url";
import type { ElectronApp, ElectronTestContext, LaunchOptions } from "./types.js";
import { fillFormWithEnvInfoAndSubmit } from "./first-setup-dialog.js";
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
      MONGO_DB_NAME: process.env.MONGO_DB_NAME || E2E_DB_NAME
    },
    timeout: 60000
  });

  try {
    let window = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: options?.windowTimeout ?? 30000
    });
    await window.waitForLoadState("domcontentloaded");

    const windowTitle = await window.title();
    if (windowTitle.includes("Cấu hình")) {
      const mainWindowPromise = electronApp.waitForEvent("window", {
        predicate: (page: Page) =>
          page.title().then((title) => !title.includes("Cấu hình") && !title.includes("DevTools")),
        timeout: options?.windowTimeout ?? 30000
      });
      await fillFormWithEnvInfoAndSubmit(window);
      window = await mainWindowPromise;
      await window.waitForLoadState("domcontentloaded");
      await window.waitForTimeout(2000);
    }

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
