import { test, expect, type Page } from "@playwright/test";
import { cleanupTempDir, createTempDir } from "./utils/temp-dir.js";
import { launchApp, type ElectronTestContext } from "./utils/electron-app.js";
import { seedE2eDatabase } from "./utils/test-data.js";

let testUserDataDir: string;

async function openSidebarPage(page: Page, name: string): Promise<void> {
  await page.getByText(name, { exact: true }).first().click();
}

async function openCreatePlaylistDialog(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Create Playlist" }).click();
}

async function waitForHome(page: Page): Promise<void> {
  await expect(page.getByText("E2E Album Alpha")).toBeVisible({ timeout: 30000 });
}

async function openAlbum(page: Page): Promise<void> {
  await waitForHome(page);
  await page.locator('[title="E2E Album Alpha"]').click();
  await expect(page.getByText("E2E Song One")).toBeVisible();
}

async function openQueue(page: Page): Promise<void> {
  await page.locator("button:has(svg[data-testid='MenuIcon'])").click();
  await expect(page.getByText("Play queue")).toBeVisible();
}

test.describe("GUI expected features", () => {
  let ctx: ElectronTestContext;

  test.beforeAll(() => {
    testUserDataDir = createTempDir("aimer-test-gui");
  });

  test.afterAll(() => cleanupTempDir(testUserDataDir));

  test.beforeEach(async () => {
    await seedE2eDatabase();
    ctx = await launchApp(testUserDataDir, { windowSize: [1280, 800] });
  });

  test.afterEach(async () => {
    await ctx?.electronApp.close();
  });

  test("renders primary navigation screens from seeded backend data", async () => {
    await waitForHome(ctx.mainWindow);
    await expect(ctx.mainWindow.getByText("E2E Album Beta")).toBeVisible();

    await openSidebarPage(ctx.mainWindow, "Songs");
    const songFilter = ctx.mainWindow.getByLabel("Filter songs");
    await expect(songFilter).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "songs table" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await songFilter.fill("Search Ballad");
    await expect(ctx.mainWindow.getByText("E2E Song One")).not.toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();
    await songFilter.clear();

    await openSidebarPage(ctx.mainWindow, "Videos");
    await expect(ctx.mainWindow.getByRole("img", { name: "E2E Video One" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Video One").first()).toBeVisible();

    await openSidebarPage(ctx.mainWindow, "Playlists");
    await expect(ctx.mainWindow.getByLabel("Filter playlists")).toBeVisible();
    await expect(ctx.mainWindow.getByRole("main").getByText("E2E Playlist Seed")).toBeVisible();

    await openSidebarPage(ctx.mainWindow, "Albums");
    await expect(ctx.mainWindow.getByLabel("Filter albums")).toBeVisible();
    await openAlbum(ctx.mainWindow);
    await expect(ctx.mainWindow.getByText("E2E Video One")).toBeVisible();
  });

  test("search dropdown and full search results navigate to media", async () => {
    await waitForHome(ctx.mainWindow);

    const search = ctx.mainWindow.getByPlaceholder("Search");
    await search.fill("Ballad");
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();
    await ctx.mainWindow.getByText("More results").click();

    await expect(ctx.mainWindow.getByText("Search results")).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "search songs table" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();

    await ctx.mainWindow
      .getByRole("table", { name: "search songs table" })
      .getByText("E2E Album Beta")
      .click();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();
  });

  test("create playlist dialog resets inputs after close", async () => {
    await waitForHome(ctx.mainWindow);

    await openCreatePlaylistDialog(ctx.mainWindow);
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Create Playlist" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Playlist name").fill("Temporary Playlist");
    await dialog.getByLabel("Description").fill("Temporary description");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();

    await openCreatePlaylistDialog(ctx.mainWindow);
    await expect(dialog.getByLabel("Playlist name")).toHaveValue("");
    await expect(dialog.getByLabel("Description")).toHaveValue("");
  });

  test("creates playlist, adds a song, removes a song, and deletes playlist", async () => {
    await waitForHome(ctx.mainWindow);

    await openCreatePlaylistDialog(ctx.mainWindow);
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Create Playlist" });
    await dialog.getByLabel("Playlist name").fill("E2E Created Playlist");
    await dialog.getByLabel("Description").fill("Created from Playwright");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).not.toBeVisible();

    await openSidebarPage(ctx.mainWindow, "Songs");
    await ctx.mainWindow
      .getByRole("row", { name: /E2E Search Ballad/ })
      .getByRole("button", { name: "More actions" })
      .click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Add to Playlist" }).click();
    await ctx.mainWindow
      .getByRole("dialog", { name: "Add to Playlist" })
      .getByText("E2E Created Playlist")
      .click();

    await openSidebarPage(ctx.mainWindow, "Playlists");
    await ctx.mainWindow.getByRole("main").getByText("E2E Created Playlist").click();
    await expect(ctx.mainWindow.getByText("Created from Playwright")).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();

    await ctx.mainWindow
      .getByRole("row", { name: /E2E Search Ballad/ })
      .getByRole("button", { name: "More actions" })
      .click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Remove from playlist" }).click();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).not.toBeVisible();

    await ctx.mainWindow.getByRole("button", { name: "Delete" }).click();
    await expect(
      ctx.mainWindow.getByRole("main").getByText("E2E Created Playlist")
    ).not.toBeVisible();
  });

  test("plays a song and marks it as now playing", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    const songRow = ctx.mainWindow.getByRole("row", { name: /E2E Song One/ });
    await expect(songRow).toBeVisible();

    await songRow.dispatchEvent("dblclick");
    await expect(songRow).toHaveClass(/Mui-selected/);
  });

  test("renders the artist page with responsive actions, tracks, and albums", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await ctx.mainWindow
      .getByRole("row", { name: /E2E Song One/ })
      .getByText("E2E Artist", { exact: true })
      .last()
      .click();

    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Artist" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Following" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Artist radio" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "artist songs table" })).toBeVisible();
    await expect(ctx.mainWindow.getByTitle("E2E Album Alpha")).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));

    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
  });

  test("renders the album detail hero, actions, tracks, and related albums", async () => {
    await openAlbum(ctx.mainWindow);

    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Album Alpha" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Play all" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Shuffle play" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Credits" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "album songs table" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("More Albums by E2E Artist")).toBeVisible();
    await expect(ctx.mainWindow.getByTitle("E2E Album Beta")).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));

    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("Released 2026")).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
  });

  test("opens video queue and navigates chapters", async () => {
    await openAlbum(ctx.mainWindow);

    await ctx.mainWindow.getByTitle("E2E Video One").click();
    await expect(ctx.mainWindow.getByText("E2E Video One").first()).toBeVisible();
    await openQueue(ctx.mainWindow);
    await expect(ctx.mainWindow.getByText("PLAYING", { exact: true }).first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("IN THIS VIDEO", { exact: true }).first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Intro").first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Chorus").first()).toBeVisible();
    await ctx.mainWindow
      .getByRole("button", { name: /E2E Chorus/ })
      .last()
      .click();
  });

  test("responsive smoke renders screens and player at mobile width", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Songs actions" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Play all" }).click();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));

    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await ctx.mainWindow.mouse.click(195, 735);
    await expect(ctx.mainWindow.getByText("Playing from:", { exact: true })).toBeVisible();
  });

  test.skip("edits playlists through an edit playlist dialog", async () => {
    // The current renderer exposes create/delete playlist, but no edit playlist dialog.
  });

  test.skip("adds and edits video chapter markers through the GUI", async () => {
    // The current renderer displays video chapters, but no add/edit chapter dialog.
  });
});
