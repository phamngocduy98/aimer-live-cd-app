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
  const compactQueue = page.getByTestId("compact-queue-transition");
  if (await compactQueue.isVisible()) {
    await expect(compactQueue).toHaveCSS("opacity", "1");
    await expect(compactQueue).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  }
  await expect(page.getByRole("button", { name: "Close play queue" }).first()).toBeVisible();
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
    await expect(ctx.mainWindow.getByRole("heading", { name: "Featured videos" })).toBeVisible();
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
    await expect(ctx.mainWindow.getByText("E2E Video One")).not.toBeVisible();
  });

  test("plays an album from its card and routes the card artist to the artist page", async () => {
    await openSidebarPage(ctx.mainWindow, "Albums");

    const albumCard = ctx.mainWindow.getByTitle("E2E Album Alpha");
    await albumCard.hover();
    await albumCard.getByRole("button", { name: "Play E2E Album Alpha" }).click();

    await expect(ctx.mainWindow.getByRole("heading", { name: "Albums" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();

    await ctx.mainWindow.getByText("E2E Artist", { exact: true }).first().click();
    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Artist" })).toBeVisible();
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
    await ctx.mainWindow.getByRole("link", { name: "Albums" }).click();

    const albumsHeadingBox = await ctx.mainWindow
      .getByRole("heading", { name: "Albums" })
      .boundingBox();
    const firstAlbumBox = await ctx.mainWindow
      .getByRole("main")
      .locator("img")
      .first()
      .boundingBox();
    expect(Math.abs((albumsHeadingBox?.x ?? 0) - (firstAlbumBox?.x ?? 0))).toBeLessThanOrEqual(1);

    await ctx.mainWindow.getByRole("link", { name: "Videos" }).click();
    const videosHeadingBox = await ctx.mainWindow
      .getByRole("heading", { name: "Videos" })
      .boundingBox();
    const firstVideoBox = await ctx.mainWindow
      .getByRole("img", { name: "E2E Video One" })
      .boundingBox();
    expect(Math.abs((videosHeadingBox?.x ?? 0) - (firstVideoBox?.x ?? 0))).toBeLessThanOrEqual(1);
  });

  test("shows collapsed left navigation at tablet width before a song is playing", async () => {
    await waitForHome(ctx.mainWindow);
    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(ctx.mainWindow.getByRole("button", { name: "Expand navigation" })).toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeVisible();
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
    await ctx.mainWindow
      .getByRole("row", { name: /E2E Search Ballad/ })
      .getByRole("button", { name: "Add E2E Search Ballad to playlist" })
      .click();
    await ctx.mainWindow
      .getByRole("dialog", { name: "Add to Playlist" })
      .getByText("E2E Created Playlist")
      .click();
    const duplicateDialog = ctx.mainWindow.getByRole("dialog", { name: "Add duplicate items?" });
    await expect(duplicateDialog).toBeVisible();
    await duplicateDialog.getByRole("button", { name: "Cancel" }).click();
    await ctx.mainWindow
      .getByRole("dialog", { name: "Add to Playlist" })
      .getByRole("button", { name: "Cancel" })
      .click();

    await openSidebarPage(ctx.mainWindow, "Playlists");
    await ctx.mainWindow.getByRole("main").getByText("E2E Created Playlist").click();
    await expect(ctx.mainWindow.getByText("Created from Playwright")).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Search Ballad")).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(ctx.mainWindow.getByLabel("Filter playlist")).toBeVisible();

    const playlistTable = ctx.mainWindow.getByRole("table", { name: "playlist items table" });
    const tableContainer = ctx.mainWindow.getByTestId("playlist-table-container");
    await expect(playlistTable.getByText("ALBUM", { exact: true })).toBeVisible();
    await expect(playlistTable.getByText("TIME", { exact: true })).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(1024, 760)));
    await expect(playlistTable.getByText("ALBUM", { exact: true })).not.toBeVisible();
    await expect(playlistTable.getByText("TIME", { exact: true })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(ctx.mainWindow.getByTestId("playlist-media-hero")).toHaveCSS(
      "min-height",
      "360px"
    );
    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Created Playlist" })).toHaveCSS(
      "font-size",
      "28px"
    );
    await expect(playlistTable.getByText("ARTIST", { exact: true })).toBeVisible();
    await expect(playlistTable.getByText("TIME", { exact: true })).not.toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).not.toBeVisible();
    await expect(ctx.mainWindow.getByText("Shuffle", { exact: true })).not.toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(700, 760)));
    await expect(playlistTable.getByText("ARTIST", { exact: true })).not.toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));
    await expect(ctx.mainWindow.getByTestId("playlist-media-hero")).toHaveCSS(
      "min-height",
      "500px"
    );
    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Created Playlist" })).toHaveCSS(
      "font-size",
      "24px"
    );
    await expect(playlistTable).toHaveCSS("table-layout", "fixed");
    await expect(playlistTable.getByText("TITLE", { exact: true })).not.toBeVisible();
    await expect(playlistTable.getByText("E2E Search Ballad")).toHaveCSS("font-size", "17px");
    await expect(playlistTable.getByText("E2E Search Ballad")).toHaveCSS("font-weight", "400");
    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("Shuffle", { exact: true })).toBeVisible();
    expect(
      await tableContainer.evaluate((element) => element.scrollWidth <= element.clientWidth)
    ).toBe(true);
    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(1280, 800)));
    await expect(playlistTable.getByText("TITLE", { exact: true })).toBeVisible();
    const playlistSongRow = playlistTable.getByRole("row", { name: /E2E Search Ballad/ });
    await playlistSongRow.dispatchEvent("dblclick");
    await expect(playlistSongRow.getByText("E2E Search Ballad")).toHaveCSS(
      "color",
      "rgb(255, 212, 42)"
    );

    await ctx.mainWindow.getByRole("button", { name: "Edit" }).click();
    const editDialog = ctx.mainWindow.getByRole("dialog", { name: "Edit Playlist" });
    await editDialog.getByLabel("Playlist name").fill("E2E Updated Playlist");
    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      ctx.mainWindow.getByRole("heading", { name: "E2E Updated Playlist" })
    ).toBeVisible();

    await ctx.mainWindow.getByLabel("Filter playlist").fill("missing song");
    await expect(ctx.mainWindow.getByText("No items match “missing song”")).toBeVisible();
    await ctx.mainWindow.getByLabel("Filter playlist").fill("");

    await ctx.mainWindow
      .getByRole("row", { name: /E2E Search Ballad/ })
      .getByRole("button", { name: "E2E Search Ballad actions" })
      .click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Remove from playlist" }).click();
    await expect(
      ctx.mainWindow
        .getByRole("table", { name: "playlist items table" })
        .getByText("E2E Search Ballad")
    ).not.toBeVisible();

    await ctx.mainWindow.getByRole("button", { name: "More", exact: true }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Delete playlist" }).click();
    await expect(
      ctx.mainWindow.getByRole("main").getByText("E2E Updated Playlist")
    ).not.toBeVisible();
  });

  test("plays a song and marks it as now playing", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    const songRow = ctx.mainWindow.getByRole("row", { name: /E2E Song One/ });
    await expect(songRow).toBeVisible();

    await songRow.dispatchEvent("dblclick");
    await expect(songRow).toHaveClass(/Mui-selected/);
  });

  test("renders bilingual synchronized lyrics and switches language pairs", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await ctx.mainWindow.getByRole("row", { name: /E2E Song One/ }).dispatchEvent("dblclick");
    await toggleFullScreenPlayer(ctx.mainWindow);
    await ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true }).click();

    const lyrics = ctx.mainWindow.getByTestId("lyrics-experience");
    const lyricStage = ctx.mainWindow.getByTestId("expanded-lyrics-stage");
    await expect(lyricStage).toHaveCSS("opacity", "1");
    await expect(lyricStage).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(lyrics.getByText("最初の歌詞")).toBeVisible();
    await expect(lyrics.getByText("Saisho no kashi")).toBeVisible();
    const artwork = ctx.mainWindow.getByTestId("lyrics-artwork");
    await expect(artwork).toBeVisible();
    const artworkBox = await artwork.boundingBox();
    const firstLyricBox = await lyrics
      .getByRole("button", { name: "Seek to lyric: 最初の歌詞" })
      .boundingBox();
    expect(firstLyricBox?.x ?? 0).toBeGreaterThanOrEqual(
      (artworkBox?.x ?? 0) + (artworkBox?.width ?? 0)
    );
    const lyricScrollerBox = await lyrics
      .getByRole("feed", { name: "Synchronized lyrics" })
      .boundingBox();
    expect(
      1280 - ((lyricScrollerBox?.x ?? 0) + (lyricScrollerBox?.width ?? 0))
    ).toBeGreaterThanOrEqual(16);

    const languageButton = ctx.mainWindow.getByRole("button", { name: "Lyrics language" });
    await expect(languageButton).not.toContainText("Japanese");
    const languageButtonBox = await languageButton.boundingBox();
    expect(languageButtonBox?.width).toBeCloseTo(40, 0);
    expect(languageButtonBox?.height).toBeCloseTo(40, 0);
    await languageButton.click();
    await expect(ctx.mainWindow.getByRole("menuitem", { name: "Japanese" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("menuitem", { name: "Vietnamese" })).toBeVisible();
    await ctx.mainWindow.getByRole("menuitem", { name: "English" }).click();
    await expect(lyrics.getByText("The first lyric")).toBeVisible();

    const secondLyric = lyrics.getByRole("button", { name: "Seek to lyric: Tsugi no kashi" });
    await secondLyric.click();
    await expect(secondLyric).toHaveAttribute("aria-current", "true");

    const queueButton = ctx.mainWindow.getByRole("button", { name: "Open play queue" });
    const languageButtonPosition = await languageButton.boundingBox();
    const queueButtonPosition = await queueButton.boundingBox();
    expect(languageButtonPosition?.x ?? 0).toBeLessThan(queueButtonPosition?.x ?? 0);

    const sync = lyrics.getByRole("button", { name: "Sync Lyrics" });
    await expect(sync).toHaveCount(0);
    await lyrics.getByRole("feed", { name: "Synchronized lyrics" }).dispatchEvent("wheel");
    await expect(sync).toBeVisible();
    await expect(sync).toHaveAttribute("aria-pressed", "false");
    await sync.click();
    await expect(sync).toHaveCount(0);

    await ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true }).click();
    await expect(lyricStage).toHaveCSS("opacity", "0");
    await expect(lyricStage).toHaveCSS("visibility", "hidden");
    await expect(lyricStage).toHaveCSS("transform", "matrix(1, 0, 0, 1, 48, 0)");
    await ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true }).click();
    await expect(lyricStage).toHaveCSS("opacity", "1");
    await expect(sync).toHaveCount(0);

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(ctx.mainWindow.getByTestId("lyrics-artwork")).not.toBeVisible();
    await expect(lyrics).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));
    await expect(lyrics).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true })).toBeVisible();
    const mobileLanguage = ctx.mainWindow.getByRole("button", { name: "Lyrics language" });
    const mobileQueueButton = ctx.mainWindow.getByRole("button", { name: "Playing queue" });
    await expect(mobileLanguage).toBeVisible();
    expect((await mobileLanguage.boundingBox())?.x ?? 0).toBeLessThan(
      (await mobileQueueButton.boundingBox())?.x ?? 0
    );
    await lyrics.getByRole("feed", { name: "Synchronized lyrics" }).dispatchEvent("touchmove");
    const mobileSync = lyrics.getByRole("button", { name: "Sync Lyrics" });
    await expect(mobileSync).toBeVisible();
    await mobileSync.click();
    await expect(mobileSync).toHaveCount(0);
  });

  test("disables lyrics when the current song has no lyrics document", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await ctx.mainWindow.getByRole("row", { name: /E2E Song Two/ }).dispatchEvent("dblclick");
    await toggleFullScreenPlayer(ctx.mainWindow);
    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));
    await expect(
      ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true })
    ).toBeDisabled();
  });

  test("shows bilingual lyrics over video without remounting the runtime", async () => {
    await openSidebarPage(ctx.mainWindow, "Videos");
    await ctx.mainWindow.getByRole("button", { name: "Play E2E Video One" }).click();
    await toggleFullScreenPlayer(ctx.mainWindow);
    const runtime = ctx.mainWindow.getByTestId("persistent-video-runtime");
    await expect(runtime).toHaveCount(1);

    await ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true }).click();
    const videoLyricsTransition = ctx.mainWindow.getByTestId("video-lyrics-transition");
    await expect(videoLyricsTransition).toHaveCSS("opacity", "1");
    await expect(ctx.mainWindow.getByRole("button", { name: "Lyrics language" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Sync Lyrics" })).toHaveCount(0);
    await expect(ctx.mainWindow.getByTestId("video-lyrics-overlay")).toContainText("映像の歌詞");
    await expect(runtime).toHaveCount(1);
    await ctx.mainWindow.getByRole("button", { name: "Lyrics", exact: true }).click();
    await expect(videoLyricsTransition).toHaveCSS("opacity", "0");
    await expect(videoLyricsTransition).toHaveCSS("visibility", "hidden");
    await expect(runtime).toHaveCount(1);
  });

  test("creates a playlist from the current play queue", async () => {
    await openSidebarPage(ctx.mainWindow, "Songs");
    await ctx.mainWindow.getByRole("button", { name: "Songs actions" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Play all" }).click();
    await openQueue(ctx.mainWindow);

    await ctx.mainWindow.getByRole("button", { name: "Create playlist from queue" }).click();
    const dialog = ctx.mainWindow.getByRole("dialog", { name: "Create Playlist" });
    await dialog.getByLabel("Playlist name").fill("E2E Queue Playlist");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).not.toBeVisible();

    await ctx.mainWindow.getByRole("button", { name: "Close play queue" }).click();
    await openSidebarPage(ctx.mainWindow, "Playlists");
    await ctx.mainWindow.getByRole("main").getByText("E2E Queue Playlist").click();
    await expect(
      ctx.mainWindow.getByRole("table", { name: "playlist items table" }).getByText("E2E Song One")
    ).toBeVisible();
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
    await expect(ctx.mainWindow.getByTitle("E2E Video One")).toBeVisible();

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
    await expect(ctx.mainWindow.getByRole("heading", { name: "Videos" })).not.toBeVisible();
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
    await openSidebarPage(ctx.mainWindow, "Videos");
    await ctx.mainWindow.getByTitle("E2E Video One").click();
    await expect(ctx.mainWindow.getByRole("heading", { name: "E2E Video One" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Credits" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "More", exact: true })).toBeVisible();
    await expect(ctx.mainWindow.getByText("16-bit, 44.1 kHz")).toBeVisible();
    await expect(ctx.mainWindow.getByRole("table", { name: "video chapters table" })).toBeVisible();
    await expect(
      ctx.mainWindow
        .getByRole("table", { name: "video chapters table" })
        .getByRole("columnheader", { name: "ARTIST" })
    ).toBeVisible();
    await expect(
      ctx.mainWindow
        .getByRole("table", { name: "video chapters table" })
        .getByRole("columnheader", { name: "START" })
    ).toHaveCount(0);
    await expect(
      ctx.mainWindow
        .getByRole("table", { name: "video chapters table" })
        .getByRole("button", { name: "More actions" })
    ).toHaveCount(2);
    await expect(ctx.mainWindow.getByRole("heading", { name: "Chapters" })).toHaveCount(0);
    await expect(ctx.mainWindow.getByText("Released 2026 · 2 chapters")).toBeVisible();
    await expect(ctx.mainWindow.getByText("Genre: E2E Live")).toBeVisible();
    await ctx.mainWindow.getByText("E2E Intro", { exact: true }).click();
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
    await ctx.mainWindow.getByRole("button", { name: "Open play queue" }).click();
    const expandedQueue = ctx.mainWindow.getByTestId("expanded-desktop-queue-transition");
    await expect(expandedQueue).toHaveCSS("opacity", "1");
    await expect(expandedQueue).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(ctx.mainWindow.getByRole("button", { name: "Close play queue" })).toBeVisible();
    await ctx.mainWindow.getByText("E2E Chorus", { exact: true }).last().click();
    await expect(
      expandedQueue.locator('[aria-current="true"]').filter({ hasText: "E2E Chorus" })
    ).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close play queue" }).click();
    await expect(expandedQueue).toHaveCSS("opacity", "0");
    await expect(expandedQueue).toHaveCSS("visibility", "hidden");
    await expect(expandedQueue).toHaveCSS("transform", "matrix(1, 0, 0, 1, 48, 0)");
    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));
    const mobileRuntimeBox = await ctx.mainWindow
      .getByTestId("persistent-video-runtime")
      .boundingBox();
    const mobileVideoBox = await ctx.mainWindow.locator("[data-video-aspect-frame]").boundingBox();
    expect((mobileVideoBox?.width ?? 0) / (mobileVideoBox?.height ?? 1)).toBeCloseTo(16 / 9, 1);
    expect(
      (mobileVideoBox?.x ?? 0) +
        (mobileVideoBox?.width ?? 0) / 2 -
        ((mobileRuntimeBox?.x ?? 0) + (mobileRuntimeBox?.width ?? 0) / 2)
    ).toBeCloseTo(0, 0);
    expect(
      (mobileVideoBox?.y ?? 0) +
        (mobileVideoBox?.height ?? 0) / 2 -
        ((mobileRuntimeBox?.y ?? 0) + (mobileRuntimeBox?.height ?? 0) / 2)
    ).toBeCloseTo(0, 0);
  });

  test("adds video to a mixed playlist and keeps one video runtime while resizing", async () => {
    await openSidebarPage(ctx.mainWindow, "Videos");
    await ctx.mainWindow.getByRole("button", { name: "Play E2E Video One" }).click();
    await ctx.mainWindow.getByRole("button", { name: "Player track actions" }).click();
    await ctx.mainWindow.getByRole("menuitem", { name: "Add to Playlist" }).click();
    await ctx.mainWindow
      .getByRole("dialog", { name: "Add to Playlist" })
      .getByText("E2E Playlist Seed")
      .click();

    await openSidebarPage(ctx.mainWindow, "Playlists");
    await ctx.mainWindow.getByRole("main").getByText("E2E Playlist Seed").click();
    const videoRow = ctx.mainWindow.getByRole("row", { name: /E2E Video One/ });
    await expect(videoRow).toBeVisible();
    await videoRow.dispatchEvent("dblclick");
    await expect(videoRow).toHaveClass(/Mui-selected/);
    const runtime = ctx.mainWindow.getByTestId("persistent-video-runtime");
    const compactAnchor = ctx.mainWindow.locator("[data-video-player-anchor]");
    await expect(runtime).toHaveCount(1);
    const compactRuntimeBox = await runtime.boundingBox();
    const compactAnchorBox = await compactAnchor.boundingBox();
    expect(compactRuntimeBox?.height).toBeCloseTo(compactAnchorBox?.height ?? 0, 0);
    expect(compactRuntimeBox?.width).toBeCloseTo(compactAnchorBox?.width ?? 0, 0);

    await ctx.mainWindow.getByRole("button", { name: "Expand video player" }).click();
    await expect(runtime).toHaveCount(1);
    const backdrop = ctx.mainWindow.getByTestId("expanded-video-backdrop");
    await expect(backdrop).toBeVisible();
    await expect(backdrop).not.toHaveCSS("background-color", "rgb(0, 0, 0)");
    await ctx.mainWindow.getByRole("button", { name: "Minimize player" }).click();
    await expect(runtime).toHaveCount(1);
    await expect(backdrop).not.toBeVisible();
    await ctx.mainWindow.waitForTimeout(500);
    const collapsedRuntimeBox = await runtime.boundingBox();
    const collapsedAnchorBox = await compactAnchor.boundingBox();
    expect(collapsedRuntimeBox?.height).toBeCloseTo(collapsedAnchorBox?.height ?? 0, 0);
    expect(collapsedRuntimeBox?.width).toBeCloseTo(collapsedAnchorBox?.width ?? 0, 0);

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(compactAnchor).not.toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));
    await expect(compactAnchor).toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Expand video player" })).toBeVisible();
    const mobileCompactRuntimeBox = await runtime.boundingBox();
    expect(mobileCompactRuntimeBox?.width).toBeGreaterThanOrEqual(70);
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
    const expandedArtwork = ctx.mainWindow
      .getByTestId("expanded-mobile-artwork-stage")
      .getByLabel("Album artwork");
    await expect(expandedArtwork).toBeVisible();
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
    await expect(ctx.mainWindow.locator("[data-player-artwork]")).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Expand navigation" }).click();
    await expect(ctx.mainWindow.getByRole("button", { name: "Collapse navigation" })).toBeVisible();

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(800, 760)));
    await expect(ctx.mainWindow.getByRole("button", { name: "Expand navigation" })).toBeVisible();
    await expect(ctx.mainWindow.locator("[data-player-artwork]")).not.toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByText("Similar tracks", { exact: true })).toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);

    await ctx.electronApp
      .browserWindow(ctx.mainWindow)
      .then((win) => win.evaluate((browserWindow) => browserWindow.setSize(390, 760)));

    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).toBeVisible();
    await expect(ctx.mainWindow.locator("[data-player-artwork]")).toBeVisible();
    await expect(ctx.mainWindow.locator("[data-player-track-info]")).toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("button", { name: "Remove from favorites" })
    ).not.toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("button", { name: "Player track actions" })
    ).not.toBeVisible();
    await expect(ctx.mainWindow.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(ctx.mainWindow.getByRole("link", { name: "Search", exact: true })).toBeVisible();
    await ctx.mainWindow.getByRole("link", { name: "Songs", exact: true }).click();
    await expect(ctx.mainWindow.getByRole("link", { name: "Songs", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(ctx.mainWindow.getByRole("link", { name: "Songs", exact: true })).toHaveCSS(
      "color",
      "rgb(255, 255, 255)"
    );
    await expect(ctx.mainWindow.getByRole("link", { name: "Search", exact: true })).toHaveCSS(
      "color",
      "rgba(239, 235, 220, 0.62)"
    );
    await expect(ctx.mainWindow.getByTestId("player-control-shell")).not.toHaveCSS(
      "background-image",
      "none"
    );
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Song One").first()).toBeVisible();
    await toggleFullScreenPlayer(ctx.mainWindow);
    await expect(ctx.mainWindow.getByTestId("player-control-shell")).toHaveCSS(
      "background-image",
      "none"
    );
    await expect(ctx.mainWindow.getByLabel("E2E Artist")).toBeVisible();
    await ctx.mainWindow.getByLabel("E2E Artist").hover();
    await expect(
      ctx.mainWindow.getByRole("button", { name: "Follow", exact: true })
    ).not.toBeVisible();
    await expect(ctx.mainWindow.getByRole("button", { name: "Minimize player" })).toBeVisible();
    await expect(
      ctx.mainWindow.getByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeVisible();
    await expect(
      ctx.mainWindow.locator('button[aria-label="play"], button[aria-label="pause"]').last()
    ).toBeVisible();
    const artworkBox = await expandedArtwork.boundingBox();
    const detailsBox = await ctx.mainWindow
      .getByTestId("expanded-mobile-track-details")
      .boundingBox();
    const sliderBox = await ctx.mainWindow
      .getByRole("slider", { name: "Playback position" })
      .boundingBox();
    expect(artworkBox?.width).toBeLessThanOrEqual(264);
    expect(artworkBox?.width).toBeCloseTo(artworkBox?.height ?? 0, 0);
    expect(
      (sliderBox?.y ?? 0) - ((detailsBox?.y ?? 0) + (detailsBox?.height ?? 0))
    ).toBeGreaterThan(24);
    await expect(
      ctx.mainWindow.getByTestId("expanded-mobile-track-details").getByText("E2E Song One")
    ).toHaveCSS("font-size", "20px");
    await ctx.mainWindow.getByRole("button", { name: "Player options" }).click();
    await expect(
      ctx.mainWindow.getByRole("dialog", { name: "E2E Song One", exact: true })
    ).toBeVisible();
    await expect(ctx.mainWindow.getByText("Go to artist", { exact: true })).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Close" }).click();
    await ctx.mainWindow.getByRole("button", { name: "Playing queue" }).click();
    const mobileQueue = ctx.mainWindow.getByTestId("expanded-mobile-queue-transition");
    await expect(mobileQueue).toHaveCSS("opacity", "1");
    await expect(mobileQueue).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(ctx.mainWindow.getByRole("button", { name: "Suggested tracks" })).toBeVisible();
    await expect(ctx.mainWindow.getByText("E2E Album Alpha", { exact: true }).last()).toBeVisible();
    await ctx.mainWindow.getByRole("button", { name: "Playing queue" }).click();
    await expect(mobileQueue).toHaveCSS("opacity", "0");
    await expect(mobileQueue).toHaveCSS("visibility", "hidden");
    await expect(mobileQueue).toHaveCSS("transform", "matrix(1, 0, 0, 1, 48, 0)");
  });

  test.skip("edits playlists through an edit playlist dialog", async () => {
    // The current renderer exposes create/delete playlist, but no edit playlist dialog.
  });

  test.skip("adds and edits video chapter markers through the GUI", async () => {
    // The current renderer displays video chapters, but no add/edit chapter dialog.
  });
});
