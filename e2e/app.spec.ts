import { test, expect, _electron as electron, Page } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testUserDataDir = join(tmpdir(), `aimer-test-app-${crypto.randomUUID()}`);

test.describe("Aimer Live CD Music Player", () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>;
  let mainWindow: Page;

  test.beforeAll(() => {
    if (existsSync(testUserDataDir)) {
      rmSync(testUserDataDir, { recursive: true, force: true });
    }
    mkdirSync(testUserDataDir, { recursive: true });
  });

  test.afterAll(() => {
    if (existsSync(testUserDataDir)) {
      rmSync(testUserDataDir, { recursive: true, force: true });
    }
  });

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [join(__dirname, "../out/main/index.js"), `--user-data-dir=${testUserDataDir}`],
      env: {
        ...process.env,
        DISABLE_DEVTOOLS: "true"
      },
      timeout: 60000
    });

    mainWindow = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: 60000
    });

    await mainWindow.waitForLoadState("domcontentloaded");
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test("shows configuration dialog on first run", async () => {
    const title = await mainWindow.title();
    expect(title).toContain("Cấu hình");

    await mainWindow.screenshot({ path: "e2e/screens/config-dialog.png" });

    await expect(mainWindow.locator("#AES_PW")).toBeVisible();
    await expect(mainWindow.locator("#MONGO_DB_HOST")).toBeVisible();
    await expect(mainWindow.locator("#MONGO_DB_USER")).toBeVisible();
    await expect(mainWindow.locator("#MONGO_DB_PW")).toBeVisible();
    await expect(mainWindow.locator("#DB_STORE_PW")).toBeVisible();
    await expect(mainWindow.locator("button[type='submit']")).toBeVisible();
  });

  test("can fill configuration form", async () => {
    const title = await mainWindow.title();
    if (!title.includes("Cấu hình")) {
      test.skip();
    }

    await mainWindow.fill("#MONGO_DB_HOST", "mongodb://localhost:27017");
    await mainWindow.fill("#MONGO_DB_USER", "testuser");
    await mainWindow.fill("#MONGO_DB_PW", "testpass");
    await mainWindow.fill("#AES_PW", "a".repeat(64));
    await mainWindow.fill("#DB_STORE_PW", "storepass");

    await mainWindow.screenshot({ path: "e2e/screens/config-filled.png" });

    const mongoHost = await mainWindow.inputValue("#MONGO_DB_HOST");
    expect(mongoHost).toBe("mongodb://localhost:27017");

    const aesKey = await mainWindow.inputValue("#AES_PW");
    expect(aesKey).toBe("a".repeat(64));
  });

  test("renders main application window after configuration", async () => {
    const title = await mainWindow.title();
    if (title.includes("Cấu hình")) {
      test.skip();
    }

    await mainWindow.waitForTimeout(2000);

    await mainWindow.screenshot({ path: "e2e/screens/main-app.png" });

    const hasContent = await mainWindow.locator("body").textContent();
    expect(hasContent).toBeTruthy();
  });
});
