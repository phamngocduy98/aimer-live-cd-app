import { test, expect } from "@playwright/test";
import { createTempDir, cleanupTempDir } from "./utils/temp-dir.js";
import { launchApp, type ElectronTestContext } from "./utils/electron-app.js";
import { seedE2eDatabase } from "./utils/test-data.js";

let testUserDataDir: string;

test.describe("Admin - Manage Hosts", () => {
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

  test("manage hosts dialog opens from avatar menu", async () => {
    await ctx.mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Manage Hosts" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Manage Hosts" });
    await expect(dialog).toBeVisible();
  });

  test("manage hosts dialog shows host list", async () => {
    await ctx.mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Manage Hosts" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Manage Hosts" });
    await expect(dialog).toBeVisible();
    const hostItems = dialog.getByRole("listitem");
    await expect(hostItems).not.toHaveCount(0);
    await expect(dialog.getByText("E2E Fixture Host")).toBeVisible();
  });

  test("manage hosts dialog can be closed", async () => {
    await ctx.mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Manage Hosts" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Manage Hosts" });
    await expect(dialog).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
