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
    await openAdmin(ctx);
    await expect(ctx.mainWindow.getByRole("dialog", { name: "Admin" })).toBeVisible();
  });

  test("admin dialog shows sections and hosting provider table", async () => {
    const dialog = await openAdmin(ctx);
    await expect(dialog.getByRole("navigation", { name: "Admin sections" })).toBeVisible();
    for (const section of ["Uploads", "Songs", "Videos", "Albums", "Artists", "Hosting Provider"]) {
      await expect(dialog.getByRole("button", { name: section })).toBeVisible();
    }

    await dialog.getByRole("button", { name: "Hosting Provider" }).click();
    await expect(
      dialog.getByRole("table", { name: "Admin hosting providers table" })
    ).toBeVisible();
    await expect(dialog.getByText("E2E Fixture Host")).toBeVisible();
  });

  test("admin dialog can be closed", async () => {
    const dialog = await openAdmin(ctx);
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("admin uploads table is available without old manage-host list", async () => {
    const dialog = await openAdmin(ctx);
    await expect(dialog.getByRole("table", { name: "Admin uploads table" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Upload media" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "List Files" })).toHaveCount(0);
  });

  test("imports Japanese SRT, generates Romaji, edits rows, and saves all languages", async () => {
    let savedPayload: { provenance?: Record<string, { source?: string }> } | undefined;
    await ctx.mainWindow.route("**/api/admin/lyrics/audio/*/tracks", async (route) => {
      savedPayload = route.request().postDataJSON();
      await route.continue();
    });
    const lyrics = await openSongLyrics(ctx);
    const table = lyrics.getByRole("table", { name: "Synchronized lyrics table" });
    await expect(table).toBeVisible();
    await expect(lyrics.getByRole("button", { name: "Import SRT" })).toBeVisible();
    await expect(lyrics.getByText("Import synchronized lyrics")).toHaveCount(0);

    await lyrics.getByRole("button", { name: "Import SRT" }).click();
    const srt = ctx.mainWindow.getByRole("dialog", { name: "Import Japanese SRT" });
    await srt.locator('input[type="file"]').setInputFiles({
      name: "lyrics.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from("1\n00:00:00,000 --> 00:00:05,000\n更新した歌詞\n")
    });

    await expect(table.getByLabel("Row 1 Japanese")).toHaveValue("更新した歌詞");
    await expect(table.getByLabel("Row 1 Romaji")).toHaveValue("romaji preview 1");
    await table.getByLabel("Row 1 English").fill("Edited English");
    await table.getByLabel("Row 1 Vietnamese").fill("Tiếng Việt đã sửa");
    await lyrics.getByRole("button", { name: "Save lyrics" }).click();
    await ctx.mainWindow
      .getByRole("dialog", { name: "Replace existing lyrics?" })
      .getByRole("button", { name: "Replace and save" })
      .click();
    await expect(lyrics.getByText("Synchronized lyrics saved.")).toBeVisible();
    expect(savedPayload?.provenance?.en?.source).toBe("manual");
    expect(savedPayload?.provenance?.vi?.source).toBe("manual");
  });

  test("shows SRT import failures in the import dialog", async () => {
    await ctx.mainWindow.route("**/api/admin/lyrics/preview-srt", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid Japanese SRT" })
      });
    });
    const lyrics = await openSongLyrics(ctx);
    await lyrics.getByRole("button", { name: "Import SRT" }).click();
    const srt = ctx.mainWindow.getByRole("dialog", { name: "Import Japanese SRT" });
    await srt.locator('input[type="file"]').setInputFiles({
      name: "invalid.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from("invalid")
    });
    await expect(srt.getByText("Invalid Japanese SRT")).toBeVisible();
  });

  test("imports LRCLIB rows and generates English and Vietnamese", async () => {
    const lyrics = await openSongLyrics(ctx);
    await lyrics.getByRole("button", { name: "Import LRCLIB" }).click();
    const importDialog = ctx.mainWindow.getByRole("dialog", {
      name: "Import Japanese lyrics from LRCLIB"
    });
    await importDialog.getByRole("button", { name: "Search LRCLIB" }).click();
    const results = importDialog.getByRole("table", { name: "LRCLIB results" });
    await expect(results.getByText("Synchronized")).toBeVisible();
    await results.getByRole("button", { name: "Import" }).click();

    const table = lyrics.getByRole("table", { name: "Synchronized lyrics table" });
    await expect(table.getByLabel("Row 1 Japanese")).toHaveValue("最初の自動歌詞");
    await expect(table.getByLabel("Row 1 Romaji")).toHaveValue("romaji preview 1");
    await lyrics.getByRole("button", { name: "Generate English" }).click();
    await expect(table.getByLabel("Row 1 English")).toHaveValue("English preview 1");
    await lyrics.getByRole("button", { name: "Generate Vietnamese" }).click();
    await expect(table.getByLabel("Row 1 Vietnamese")).toHaveValue("Bản dịch 1");
  });
});

async function openAdmin(ctx: ElectronTestContext) {
  await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
  await ctx.mainWindow.getByRole("menuitem", { name: "Admin" }).click();
  return ctx.mainWindow.getByRole("dialog", { name: "Admin" });
}

async function openSongLyrics(ctx: ElectronTestContext) {
  const admin = await openAdmin(ctx);
  await admin.getByRole("button", { name: "Songs" }).click();
  await admin
    .getByRole("row", { name: /E2E Song One/ })
    .getByRole("button", { name: "Lyrics" })
    .click();
  const lyrics = ctx.mainWindow.getByRole("dialog", {
    name: "Synchronized Lyrics: E2E Song One"
  });
  await expect(lyrics).toBeVisible();
  return lyrics;
}
