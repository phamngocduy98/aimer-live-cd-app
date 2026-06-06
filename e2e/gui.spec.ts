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
  await page.getByRole("button", { name: "Open play queue" }).click();
  await expect(page.getByText("Play queue")).toBeVisible();
}

async function toggleFullScreenPlayer(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Toggle full screen player" })
    .click({ position: { x: 20, y: 2 } });
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
    await expect(ctx.mainWindow.getByRole("heading", { name: "Featured albums" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("heading", { name: "Artists to revisit" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("heading", { name: "Listen deeper" })).not.toBeVisible();
    await expect(ctx.mainWindow.getByRole("img", { name: "E2E Artist" }).locator("..")).toHaveCSS(
      "border-radius",
      "50%"
    );
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

  test("aligns the Songs list and provides a direct playlist action", async () => {
    await waitForHome(ctx.mainWindow);
    await openSidebarPage(ctx.mainWindow, "Songs");

    const songsTable = ctx.mainWindow.getByRole("table", { name: "songs table" });
    await expect(songsTable).toBeVisible();
    await expect(songsTable.getByText("QUALITY", { exact: true })).not.toBeVisible();

    const songsHeadingBox = await ctx.mainWindow
      .getByRole("heading", { name: "Songs" })
      .boundingBox();
    const songsTableBox = await songsTable.boundingBox();
    expect(Math.abs((songsHeadingBox?.x ?? 0) - (songsTableBox?.x ?? 0))).toBeLessThanOrEqual(1);

    await songsTable
      .getByRole("row", { name: /E2E Song One/ })
      .getByRole("button", { name: "Add E2E Song One to playlist" })
      .click();
    await expect(ctx.mainWindow.getByRole("dialog", { name: "Add to Playlist" })).toBeVisible();
  });

  test("aligns the Albums and Videos grids with their headers", async () => {
    await waitForHome(ctx.mainWindow);
    await ctx.mainWindow.getByRole("button", { name: "Explore" }).click();

    const albumsHeadingBox = await ctx.mainWindow
      .getByRole("heading", { name: "Albums" })
      .boundingBox();
    const firstAlbumBox = await ctx.mainWindow.getByRole("main").locator("img").first().boundingBox();
    expect(Math.abs((albumsHeadingBox?.x ?? 0) - (firstAlbumBox?.x ?? 0))).toBeLessThanOrEqual(1);

    await ctx.mainWindow.getByRole("button", { name: "Videos" }).click();
    const videosHeadingBox = await ctx.mainWindow
      .getByRole("heading", { name: "Videos" })
      .boundingBox();
    const firstVideoBox = await ctx.mainWindow
      .getByRole("img", { name: "E2E Video One" })
      .boundingBox();
    expect(Math.abs((videosHeadingBox?.x ?? 0) - (firstVideoBox?.x ?? 0))).toBeLessThanOrEqual(1);
  });

  test("shows bottom navigation at tablet width before a song is playing", async () => {
    await waitForHome(ctx.mainWindow);
    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).toBeVisible();
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
      .getByRole("button", { name: "Add E2E Search Ballad to playlist" })
      .click();
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
    await expect(ctx.mainWindow.getByRole("button", { name: "Add", exact: true })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Credits" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "album songs table" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("More Albums by E2E Artist")).toBeVisible();
    await expect(ctx.mainWindow.getByTitle("E2E Album Beta")).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "More", exact: true }).click();
    await expect(ctx.mainWindow.getByRole("menuitem", { name: "Add to Playlist" })).toBeVisible();
    await ctx.mainWindow.keyboard.press("Escape");
    await ctx.mainWindow.getByTitle("E2E Album Beta").click({ button: "right" });
    await expect(
      ctx.mainWindow.getByRole("menuitem", { name: "Add to My Collection" })
    ).toBeVisible();
    await ctx.mainWindow.keyboard.press("Escape");

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
    await expect(ctx.mainWindow.getByText("Videos", { exact: true }).first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("In this video", { exact: true }).first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Intro").first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Chorus").first()).toBeVisible();
    await ctx.mainWindow.getByText("E2E Chorus", { exact: true }).last().click();
    await ctx.mainWindow
      .getByRole("button", { name: "E2E Video One actions", exact: true })
      .click();
    await expect(ctx.mainWindow.getByRole("menuitem", { name: "Go to artist" })).toBeVisible();
    await ctx.mainWindow.getByRole("menuitem", { name: "Credits" }).click();
    if (await ctx.mainWindow.getByRole("button", { name: "Close play queue" }).isVisible()) {
      await ctx.mainWindow.getByRole("button", { name: "Close play queue" }).click();
    }
    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByRole("button", { name: "Video display mode" })).toBeVisible();
    await expect(ctx.mainWindow.locator("video").last()).toBeVisible();
  });

  test("responsive smoke renders screens and player at mobile width", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Songs actions" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Play all" }).click();

    await ctx.mainWindow.getByRole("button", { name: "Add to favorites" }).click();
    await expect(
      ctx.mainWindow.getByRole("button", { name: "Remove from favorites" })
    ).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Player track actions" }).click();
    await expect(ctx.mainWindow.getByRole("menuitem", { name: "Add to Playlist" })).toBeVisible();
    await ctx.mainWindow.keyboard.press("Escape");

    await ctx.mainWindow.getByRole("button", { name: "Mute" }).hover();
    await expect(ctx.mainWindow.getByRole("slider", { name: "Volume" })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Mute" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Unmute" })).toBeVisible();

    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByLabel("Album artwork")).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Enter fullscreen" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Exit fullscreen" }).click();
    await ctx.mainWindow.getByLabel("E2E Artist").hover();
    await expect(ctx.mainWindow.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Read more" })).toBeVisible();
    await ctx.mainWindow.getByLabel("E2E Artist").click();
    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Artist" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Minimize player" })).not.toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);
    await ctx.mainWindow.getByRole("button", { name: "Open play queue" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Close play queue" })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close play queue" }).click();
    await toggleFullScreenPlayer(ctx.mainWindow);

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(1024, 760)));

    await expect(ctx.mainWindow.getByRole("button", { name: "Expand navigation" })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Expand navigation" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Collapse navigation" })).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByText("Similar tracks", { exact: true })).toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));

    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Home" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Search", exact: true })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByLabel("E2E Artist")).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Minimize player" })).toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeVisible();
    await expect(
      ctx.mainWindow.locator('button[aria-label="play"], button[aria-label="pause"]').last()
    ).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Player options" }).click();
    await expect(
      ctx.mainWindow.getByRole("dialog", { name: "E2E Song One", exact: true })
    ).toBeVisible();
    await expect(ctx.mainWindow.getByText("Go to artist", { exact: true })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await ctx.mainWindow.getByRole("button", { name: "Playing queue" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Suggested tracks" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Album Alpha", { exact: true }).last()).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Playing queue" }).click();
  });

  test.skip("edits playlists through an edit playlist dialog", async () => {
    // The current renderer exposes create/delete playlist, but no edit playlist dialog.
  });

  test.skip("adds and edits video chapter markers through the GUI", async () => {
    // The current renderer displays video chapters, but no add/edit chapter dialog.
  });
});
