import { test, expect, _electron as electron, Page } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DB_NAME = "musicbtxa_e2e_test";

const testUserDataDir = join(tmpdir(), `aimer-test-playlist-${crypto.randomUUID()}`);

test.describe("Playlist Feature E2E", () => {
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
    process.env.MONGO_DB_NAME = TEST_DB_NAME;
    electronApp = await electron.launch({
      args: [join(__dirname, "../out/main/index.js")],
      env: {
        ...process.env,
        APPDATA: testUserDataDir,
        DISABLE_DEVTOOLS: "true"
      },
      timeout: 60000
    });

    mainWindow = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: 30000
    });

    await mainWindow.waitForLoadState("domcontentloaded");

    // Set desktop window size so sidebar (md breakpoint) is visible
    const mainWindowHandle = await electronApp.browserWindow(mainWindow);
    await mainWindowHandle.evaluate((bw) => bw.setSize(1280, 800));

    const title = await mainWindow.title();
    if (title.includes("Cấu hình")) {
      await mainWindow.fill("#MONGO_DB_HOST", process.env.MONGO_DB_HOST || "");
      await mainWindow.fill("#MONGO_DB_USER", process.env.MONGO_DB_USER || "");
      await mainWindow.fill("#MONGO_DB_PW", process.env.MONGO_DB_PW || "");
      await mainWindow.fill("#AES_PW", process.env.AES_PW || "");
      await mainWindow.fill("#DB_STORE_PW", process.env.DB_STORE_PW || "");

      await mainWindow.click("button[type='submit']");

      await mainWindow.waitForTimeout(3000);

      const pages = await electronApp.windows();
      for (const page of pages) {
        const pageTitle = await page.title();
        if (!pageTitle.includes("DevTools") && !pageTitle.includes("Cấu hình")) {
          mainWindow = page;
          break;
        }
      }

      await mainWindow.waitForLoadState("domcontentloaded");
      await mainWindow.waitForTimeout(2000);
    }
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  const sidebar = () => mainWindow.locator("nav.MuiDrawer-paper, div.MuiDrawer-paper");

  const createPlaylist = async (name: string, description?: string) => {
    const createBtn = sidebar().getByText("Create Playlist", { exact: true });
    await createBtn.click();
    await mainWindow.waitForTimeout(500);

    const dialog = mainWindow.locator("[role='dialog']");
    await dialog.getByLabel("Playlist name").fill(name);
    if (description) {
      await dialog.getByLabel("Description (optional)").fill(description);
    }
    await dialog.getByRole("button", { name: "Create" }).click();
    await mainWindow.waitForTimeout(2000);

    return dialog;
  };

  const navigateToPlaylistsOverview = async () => {
    await sidebar().getByText("Playlists", { exact: true }).click();
    await mainWindow.waitForTimeout(1500);
  };

  const navigateToPlaylistDetailViaCard = async (name: string) => {
    await navigateToPlaylistsOverview();
    const card = mainWindow.locator("div.MuiCard-root").filter({ hasText: name }).first();
    await expect(card).toBeVisible();
    await card.click();
    await mainWindow.waitForTimeout(2000);
  };

  // ============================================================
  // 1. Playlists Overview Page
  // ============================================================

  test("playlists overview page displays Playlists title and count", async () => {
    await navigateToPlaylistsOverview();

    await expect(mainWindow.getByText("Playlists", { exact: true }).first()).toBeVisible();
    await expect(mainWindow.getByText(/playlists/i).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlists-overview.png" });
  });

  // ============================================================
  // 2. Create Playlist
  // ============================================================

  test("create playlist via sidebar button opens dialog", async () => {
    const createBtn = sidebar().getByText("Create Playlist", { exact: true });
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await mainWindow.waitForTimeout(500);

    const dialog = mainWindow.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Create Playlist")).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/create-playlist-dialog.png" });
  });

  test("sidebar refreshes after creating a playlist (REPRODUCER)", async () => {
    const playlistName = `SidebarRefresh-${crypto.randomUUID().slice(0, 8)}`;

    // Create playlist
    await createPlaylist(playlistName);

    // Immediately check sidebar — should show the new playlist
    // THIS WILL FAIL because Sidebar.tsx only fetches playlists on mount
    // with useEffect([], []) and never refreshes after creation
    await expect(sidebar().getByText(playlistName, { exact: true })).toBeVisible();
  });

  test("overview page updates after creating while on overview", async () => {
    const playlistName = `OverviewRefresh-${crypto.randomUUID().slice(0, 8)}`;

    // Navigate to playlists overview FIRST
    await navigateToPlaylistsOverview();

    // Confirm the playlist does not yet exist
    await expect(
      mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName })
    ).toHaveCount(0);

    // Create playlist while REMAINING on the overview page
    await createPlaylist(playlistName);

    // The new card should appear on the overview without navigating away
    // THIS WILL FAIL: PlaylistList.tsx useEffect([], []) never re-fetches
    await expect(
      mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName }).first()
    ).toBeVisible();
  });

  test("create playlist with name and description", async () => {
    const playlistName = `My Test-${crypto.randomUUID().slice(0, 8)}`;
    const description = "A playlist created during E2E testing";

    const dialog = await createPlaylist(playlistName, description);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();

    // Navigate to playlists overview to verify the playlist card exists
    await navigateToPlaylistsOverview();

    const card = mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName }).first();
    await expect(card).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlist-created-card.png" });
  });

  test("create playlist without description", async () => {
    const playlistName = `Minimal-${crypto.randomUUID().slice(0, 8)}`;
    await createPlaylist(playlistName);

    // Navigate to playlists overview to verify
    await navigateToPlaylistsOverview();

    const card = mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName }).first();
    await expect(card).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/minimal-playlist-card.png" });
  });

  // ============================================================
  // 3. Playlist Detail View
  // ============================================================

  test("navigate to playlist detail from overview card", async () => {
    const playlistName = `Detail-${crypto.randomUUID().slice(0, 8)}`;

    await createPlaylist(playlistName);

    // Navigate to detail via the card
    await navigateToPlaylistDetailViaCard(playlistName);

    // Detail view should show playlist info
    await expect(mainWindow.getByText("Playlist").first()).toBeVisible();
    await expect(mainWindow.getByText(playlistName, { exact: true }).first()).toBeVisible();
    await expect(mainWindow.getByText("0 songs").first()).toBeVisible();

    // Play, Shuffle, and Delete buttons should be present
    await expect(mainWindow.locator("button").filter({ hasText: "Play" }).first()).toBeVisible();
    await expect(mainWindow.locator("button").filter({ hasText: "Shuffle" }).first()).toBeVisible();
    await expect(mainWindow.locator("button").filter({ hasText: "Delete" }).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlist-detail-empty.png" });
  });

  test("playlist overview shows created playlist card", async () => {
    const playlistName = `Card Test-${crypto.randomUUID().slice(0, 8)}`;

    await createPlaylist(playlistName);

    // Navigate to playlists overview
    await navigateToPlaylistsOverview();

    // Card with playlist name and "0 songs" should be visible
    await expect(mainWindow.getByText(playlistName, { exact: true }).first()).toBeVisible();
    await expect(mainWindow.getByText("0 songs").first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlist-card.png" });
  });

  // ============================================================
  // 4. Add Song to Playlist via Context Menu
  // ============================================================

  test("add song to playlist via songs page context menu", async () => {
    const playlistName = `ContextMenu-${crypto.randomUUID().slice(0, 8)}`;

    await createPlaylist(playlistName);

    // Navigate to songs page
    await sidebar().getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(2000);

    // Check if there are songs to interact with
    const songRows = mainWindow.locator("table.MuiTable-root tbody tr");
    const songCount = await songRows.count();
    test.skip(songCount === 0, "No songs available to test context menu");

    // Click the MoreHoriz icon on the first song row
    const firstSongMoreButton = songRows.first().locator("button.MuiIconButton-root");
    await expect(firstSongMoreButton).toBeVisible();
    await firstSongMoreButton.click();
    await mainWindow.waitForTimeout(500);

    // Context menu should show "Add to Playlist"
    await expect(mainWindow.getByText("Add to Playlist").first()).toBeVisible();
    await mainWindow.getByText("Add to Playlist").first().click();
    await mainWindow.waitForTimeout(500);

    // Add to Playlist dialog should show our playlist
    const addDialog = mainWindow.locator("[role='dialog']");
    await expect(addDialog.getByText(playlistName, { exact: true }).first()).toBeVisible();

    // Click the playlist to add the song
    await addDialog.getByText(playlistName, { exact: true }).first().click();
    await mainWindow.waitForTimeout(1500);

    // Dialog should close
    await expect(addDialog).not.toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/song-added-to-playlist.png" });
  });

  test("playlist detail shows songs after adding", async () => {
    const playlistName = `SongCount-${crypto.randomUUID().slice(0, 8)}`;

    // Create playlist
    await createPlaylist(playlistName);

    // Navigate to songs and add first song
    await sidebar().getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(2000);

    const songRows = mainWindow.locator("table.MuiTable-root tbody tr");
    const songCount = await songRows.count();
    test.skip(songCount === 0, "No songs available");

    const firstSongMoreButton = songRows.first().locator("button.MuiIconButton-root");
    await firstSongMoreButton.click();
    await mainWindow.waitForTimeout(500);

    await mainWindow.getByText("Add to Playlist").first().click();
    await mainWindow.waitForTimeout(500);

    const addDialog = mainWindow.locator("[role='dialog']");
    await addDialog.getByText(playlistName, { exact: true }).first().click();
    await mainWindow.waitForTimeout(1500);

    // Navigate to playlist detail via overview card
    await navigateToPlaylistDetailViaCard(playlistName);

    // Should show "1 songs" and a song table
    await expect(mainWindow.getByText("1 songs").first()).toBeVisible();
    const playlistTable = mainWindow.locator("table[aria-label='playlist songs table']");
    await expect(playlistTable).toBeVisible();

    // Table should have at least one row
    const playlistSongRows = playlistTable.locator("tbody tr");
    await expect(playlistSongRows.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlist-with-song.png" });
  });

  // ============================================================
  // 5. Remove Song from Playlist
  // ============================================================

  test("remove song from playlist via context menu", async () => {
    const playlistName = `RemoveSong-${crypto.randomUUID().slice(0, 8)}`;

    // Create playlist
    await createPlaylist(playlistName);

    // Add a song
    await sidebar().getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(2000);

    const songRows = mainWindow.locator("table.MuiTable-root tbody tr");
    const songCount = await songRows.count();
    test.skip(songCount === 0, "No songs available");

    const firstSongMoreButton = songRows.first().locator("button.MuiIconButton-root");
    await firstSongMoreButton.click();
    await mainWindow.waitForTimeout(500);

    await mainWindow.getByText("Add to Playlist").first().click();
    await mainWindow.waitForTimeout(500);

    const addDialog = mainWindow.locator("[role='dialog']");
    await addDialog.getByText(playlistName, { exact: true }).click();
    await mainWindow.waitForTimeout(1500);

    // Navigate to playlist detail via overview card
    await navigateToPlaylistDetailViaCard(playlistName);

    // Should have 1 song
    await expect(mainWindow.getByText("1 songs").first()).toBeVisible();

    // Click the MoreHoriz icon in the playlist song row
    const playlistTable = mainWindow.locator("table[aria-label='playlist songs table']");
    const playlistSongRow = playlistTable.locator("tbody tr").first();
    const moreButton = playlistSongRow.locator("button.MuiIconButton-root");
    await expect(moreButton).toBeVisible();
    await moreButton.click();
    await mainWindow.waitForTimeout(500);

    // Context menu should have "Remove from playlist"
    await expect(mainWindow.getByText("Remove from playlist").first()).toBeVisible();
    await mainWindow.getByText("Remove from playlist").click();
    await mainWindow.waitForTimeout(1500);

    // Should now show "0 songs"
    await expect(mainWindow.getByText("0 songs").first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/song-removed-from-playlist.png" });
  });

  // ============================================================
  // 6. Delete Playlist
  // ============================================================

  test("delete playlist from detail view", async () => {
    const playlistName = `DeleteMe-${crypto.randomUUID().slice(0, 8)}`;

    await createPlaylist(playlistName);

    // Navigate to playlist detail via overview card
    await navigateToPlaylistDetailViaCard(playlistName);

    // Click Delete button
    await mainWindow.locator("button").filter({ hasText: "Delete" }).click();
    await mainWindow.waitForTimeout(1000);

    // Re-navigate to overview to ensure fresh data
    await navigateToPlaylistsOverview();

    // The playlist should no longer appear as a card
    const card = mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName });
    await expect(card).not.toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playlist-deleted.png" });
  });

  test("sidebar refreshes after deleting a playlist from detail view", async () => {
    const playlistName = `DeleteSidebar-${crypto.randomUUID().slice(0, 8)}`;

    await createPlaylist(playlistName);

    // Confirm playlist appears in sidebar
    await expect(sidebar().getByText(playlistName, { exact: true })).toBeVisible();

    // Navigate to playlist detail via overview card
    await navigateToPlaylistDetailViaCard(playlistName);

    // Click Delete button
    await mainWindow.locator("button").filter({ hasText: "Delete" }).click();
    await mainWindow.waitForTimeout(2000);

    // The sidebar should no longer show the deleted playlist
    // THIS WILL FAIL: PlaylistView has no way to trigger sidebar refresh
    await expect(sidebar().getByText(playlistName, { exact: true })).not.toBeVisible();
  });

  // ============================================================
  // 7. Cancel Create Playlist Dialog
  // ============================================================

  test("cancel create playlist dialog does not create playlist", async () => {
    const playlistName = "Should Not Appear";

    const createBtn = sidebar().getByText("Create Playlist", { exact: true });
    await createBtn.click();
    await mainWindow.waitForTimeout(500);

    const dialog = mainWindow.locator("[role='dialog']");
    await dialog.getByLabel("Playlist name").fill(playlistName);
    await dialog.getByText("Cancel").click();
    await mainWindow.waitForTimeout(500);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();

    // Navigate to playlists overview and verify no new playlist card
    await navigateToPlaylistsOverview();

    // The playlist should not appear as a card on the overview
    const card = mainWindow.locator("div.MuiCard-root").filter({ hasText: playlistName });
    await expect(card).toHaveCount(0);

    await mainWindow.screenshot({ path: "e2e/screens/create-playlist-cancelled.png" });
  });
});
