import { expect, type Page, _electron as electron } from "@playwright/test";
import { join } from "path";
import { fileURLToPath } from "url";
import type { ElectronApp, ElectronTestContext, LaunchOptions } from "./types.js";
import { E2E_DB_NAME } from "./test-data.js";

export type { ElectronTestContext, LaunchOptions };

function attachRendererFailureTracking(page: Page, errors: string[]): void {
  page.on("console", (message) => {
    if (message.type() === "error") {
      if (/^Failed to load resource: /.test(message.text())) return;
      errors.push(`console.error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.stack || error.message}`);
  });
  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    if (!url.includes("/api/") || status < 400) return;
    if (status === 401 && /\/api\/auth\/(me|refresh)$/.test(url)) return;
    if (status === 404 && /\/api\/artist\/.+\/image$/.test(url)) return;
    if (status === 404 && /\/api\/lyrics\/(audio|video)\/.+$/.test(url)) return;
    if (status === 400 && /\/api\/admin\/lyrics\/preview-srt$/.test(url)) return;
    if (status === 409 && /\/api\/playlist\/.+\/items$/.test(url)) return;

    errors.push(`api response ${status}: ${url}`);
  });
  page.on("crash", () => {
    errors.push("page crashed");
  });
}

export function expectNoRendererFailures(ctx: ElectronTestContext): void {
  expect(ctx.rendererErrors, "renderer console errors, page errors, or crashes").toEqual([]);
}

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
      E2E_DB_NAME,
      MONGO_DB_NAME: E2E_DB_NAME,
      API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3001/api",
      STREAM_BASE_URL: process.env.STREAM_BASE_URL || "http://localhost:3001/api"
    },
    timeout: 60000
  });

  try {
    const rendererErrors: string[] = [];
    let window = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: options?.windowTimeout ?? 30000
    });
    attachRendererFailureTracking(window, rendererErrors);
    await window.waitForLoadState("domcontentloaded");

    if (options?.windowSize) {
      const [width, height] = options.windowSize;
      const electronWin = await electronApp.browserWindow(window);
      await electronWin.evaluate((win, { width, height }) => win.setSize(width, height), {
        width,
        height
      });
    }

    return { electronApp, mainWindow: window, rendererErrors };
  } catch (error) {
    await electronApp.close();
    throw error;
  }
}
