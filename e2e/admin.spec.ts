import { test, expect } from "@playwright/test";
import { createTempDir, cleanupTempDir } from "./utils/temp-dir.js";
import { launchApp, type ElectronTestContext } from "./utils/electron-app.js";
import { seedE2eDatabase } from "./utils/test-data.js";

let testUserDataDir: string;

test.describe("Admin dialog", () => {
  let ctx: ElectronTestContext;

  test.beforeAll(() => {
    testUserDataDir = createTempDir("aimer-test-admin");
  });
  test.afterAll(() => cleanupTempDir(testUserDataDir));

  test.beforeEach(async () => {
    await seedE2eDatabase();
    ctx = await launchApp(testUserDataDir, { windowSize: [1280, 800] });
  });

  test.afterEach(async () => {
    await ctx?.electronApp.close();
  });

  test("admin dialog opens from avatar menu", async () => {
    await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Admin" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Admin" });
    await expect(dialog).toBeVisible();
  });

  test("admin dialog shows sections and hosting provider table", async () => {
    await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Admin" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Admin" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("navigation", { name: "Admin sections" })).toBeVisible();
    for (const section of ["Uploads", "Songs", "Videos", "Albums", "Artists", "Hosting Provider"]) {
      await expect(dialog.getByRole("button", { name: section })).toBeVisible();
    }

    await dialog.getByRole("button", { name: "Hosting Provider" }).click();
    await expect(dialog.getByRole("table", { name: "Admin hosting providers table" })).toBeVisible();
    await expect(dialog.getByText("E2E Fixture Host")).toBeVisible();
  });

  test("admin dialog can be closed", async () => {
    await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Admin" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Admin" });
    await expect(dialog).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("admin uploads table is available without old manage-host list", async () => {
    await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Admin" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Admin" });
    await expect(dialog.getByRole("table", { name: "Admin uploads table" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Upload media" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "List Files" })).toHaveCount(0);
  });
});
