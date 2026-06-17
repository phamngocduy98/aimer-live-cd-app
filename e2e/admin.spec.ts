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
    for (const section of [
      "Uploads",
      "Songs",
      "Videos",
      "Albums",
      "Artists",
      "Hosting Provider",
      "Users"
    ]) {
      await expect(dialog.getByRole("button", { name: section })).toBeVisible();
    }

    await dialog.getByRole("button", { name: "Hosting Provider" }).click();
    await expect(
      dialog.getByRole("table", { name: "Admin hosting providers table" })
    ).toBeVisible();
    await expect(dialog.getByText("E2E Fixture Host")).toBeVisible();
  });

  test("admin creates a paid member from the Users section", async () => {
    const dialog = await openAdmin(ctx);
    await dialog.getByRole("button", { name: "Users" }).click();
    await expect(dialog.getByRole("table", { name: "Admin users table" })).toBeVisible();
    await dialog.getByRole("button", { name: "Add user" }).click();
    const editor = ctx.mainWindow.getByRole("dialog", { name: "Create user" });
    await editor.getByLabel("Username").fill("newpaid");
    await editor.getByLabel("Display name").fill("New Paid");
    await editor.getByLabel("Password").fill("new-paid-password");
    await editor.getByLabel("Plan").fill("plus");
    await editor.getByLabel("Status").click();
    await ctx.mainWindow.getByRole("option", { name: "active" }).click();
    await editor.getByRole("button", { name: "Save user" }).click();
    await expect(editor).not.toBeVisible();
    await expect(dialog.getByRole("row", { name: /newpaid/ })).toBeVisible();
  });

  test("admin dialog can be closed", async () => {
    const dialog = await openAdmin(ctx);
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("admin uploads table is available without old manage-host list", async () => {
    const dialog = await openAdmin(ctx);
    await dialog.getByRole("button", { name: "Uploads" }).click();
    const uploadsTable = dialog.getByRole("table", { name: "Admin uploads table" });
    await expect(uploadsTable).toBeVisible();
    await expect(uploadsTable.getByRole("columnheader", { name: "Health" })).toBeVisible();
    await expect(uploadsTable.getByRole("columnheader", { name: "Hostings" })).toBeVisible();
  });

  test("adds a YouTube video from loaded metadata", async () => {
    await ctx.mainWindow.route("**/api/videos/youtube/metadata", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          title: "E2E YouTube Import",
          artists: ["E2E Channel"],
          youtubeUrl: "https://www.youtube.com/watch?v=e2e-import",
          duration: 186,
          videoCodecRaw: "avc1.640028",
          audioCodecRaw: "mp4a.40.2",
          audioSampleRate: 44100,
          bitrate: 256000,
          fileExtension: "mp4",
          chapters: [
            { time: 0, title: "Cold open", subTitle: "" },
            { time: 60, title: "Main part", subTitle: "" }
          ],
          subtitles: [{ language: "en", ext: "vtt", automatic: false }],
          cover: {
            mimeType: "image/png",
            base64:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
          }
        })
      });
    });
    await ctx.mainWindow.route("**/api/videos/youtube/lyrics-preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [
            {
              startMs: 0,
              endMs: 2000,
              ja: "映像の歌詞",
              romaji: "romaji preview 1",
              en: "Video lyrics",
              vi: "Lời video"
            }
          ]
        })
      });
    });

    const admin = await openAdmin(ctx);
    await admin.getByRole("button", { name: "Videos" }).click();
    await admin.getByRole("button", { name: "Add YouTube video" }).click();

    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Add YouTube video" });
    await dialog.getByLabel("YouTube URL").fill("https://youtu.be/e2e-import");
    await dialog.getByRole("button", { name: "Load" }).click();
    await expect(dialog.getByText("Metadata loaded.")).toBeVisible();
    await expect(dialog.getByLabel("Title")).toHaveValue("E2E YouTube Import");
    await expect(dialog.getByLabel("Video codec")).toHaveValue("avc1.640028");
    await expect(dialog.getByText("en .vtt")).toBeVisible();
    await expect(dialog.getByRole("table", { name: "YouTube lyrics preview table" })).toBeVisible();
    await expect(dialog.getByText("映像の歌詞")).toBeVisible();
    await dialog.getByLabel("Genres").fill("Live, Imported");
    await dialog.getByRole("button", { name: "Save YouTube video" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(admin.getByRole("row", { name: /E2E YouTube Import/ })).toBeVisible();
  });

  test("replaces video cover artwork and serves the new image immediately", async () => {
    const admin = await openAdmin(ctx);
    await admin.getByRole("button", { name: "Videos" }).click();
    await admin
      .getByRole("row", { name: /E2E Video One/ })
      .getByRole("button", { name: "Edit" })
      .click();

    const editor = ctx.mainWindow.getByRole("dialog", { name: "Edit video metadata" });
    const replacementCover = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    );
    await editor.locator('input[type="file"][accept="image/*"]').setInputFiles({
      name: "replacement-cover.png",
      mimeType: "image/png",
      buffer: replacementCover
    });
    await expect(editor.getByText("replacement-cover.png")).toBeVisible();
    await editor.getByRole("button", { name: "Save changes" }).click();
    await expect(editor).not.toBeVisible();

    const result = await ctx.mainWindow.evaluate(async (videoId) => {
      const electronAPI = (
        window as unknown as { electronAPI: { getApiBaseUrl: () => Promise<string> } }
      ).electronAPI;
      const apiBaseUrl = await electronAPI.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/video/${videoId}/cover`, {
        cache: "reload"
      });
      return {
        cacheControl: response.headers.get("cache-control"),
        contentType: response.headers.get("content-type"),
        bytes: Array.from(new Uint8Array(await response.arrayBuffer()))
      };
    }, "665000000000000000000301");

    expect(result.cacheControl).toBe("no-cache");
    expect(result.contentType).toBe("image/png");
    expect(Buffer.from(result.bytes)).toEqual(replacementCover);
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
  const loginMenu = ctx.mainWindow.getByRole("menuitem", { name: "Login" });
  if (await loginMenu.isVisible()) {
    await loginMenu.click();
    const login = ctx.mainWindow.getByRole("dialog", { name: "Login" });
    await login.getByLabel("Username").fill("admin");
    await login.getByLabel("Password").fill("admin-password");
    await login.getByRole("button", { name: "Login" }).click();
    await expect(login).not.toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "User menu" }).click();
  }
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
