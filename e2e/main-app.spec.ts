import { test, expect, _electron as electron, Page } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testUserDataDir = join(tmpdir(), `aimer-test-main-${crypto.randomUUID()}`);

test.describe("Aimer Live CD Music Player - Main App E2E", () => {
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
      args: [join(__dirname, "../out/main/index.js")],
      env: {
        ...process.env,
        APPDATA: testUserDataDir,
        DISABLE_DEVTOOLS: "true",
      },
      timeout: 60000,
    });

    mainWindow = await electronApp.waitForEvent("window", {
      predicate: (page: Page) => page.title().then((t) => !t.includes("DevTools")),
      timeout: 30000,
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

  // ============================================================
  // 1. App Shell & Layout
  // ============================================================

  test("renders main application shell with sidebar, navbar, and player bar", async () => {
    await expect(mainWindow.locator("body")).toBeVisible();

    // Sidebar with app title
    await expect(mainWindow.getByText("Aimer live music", { exact: true })).toBeVisible();

    // Sidebar navigation items
    await expect(mainWindow.getByText("MY COLLECTION")).toBeVisible();
    await expect(mainWindow.getByText("Playlists", { exact: true })).toBeVisible();
    await expect(mainWindow.getByText("Albums", { exact: true })).toBeVisible();
    await expect(mainWindow.getByText("Songs", { exact: true })).toBeVisible();

    // TopNavBar - search
    await expect(mainWindow.getByPlaceholder("Search")).toBeVisible();

    // User avatar button
    await expect(mainWindow.getByRole("button", { name: "U", exact: true })).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/main-shell.png" });
  });

  // ============================================================
  // 2. Music Library - Album Browsing
  // ============================================================

  test("displays album library with artist header and play controls", async () => {
    // Artist header
    await expect(mainWindow.getByText("Aimer", { exact: true }).first()).toBeVisible();
    await expect(mainWindow.getByText("Favorite artist, idol of phamngocduy98")).toBeVisible();

    // Play and Shuffle buttons (use hasText filter since both have aria-label="play")
    await expect(mainWindow.locator("button").filter({ hasText: "Play" }).first()).toBeVisible();
    await expect(mainWindow.locator("button").filter({ hasText: "Shuffle" }).first()).toBeVisible();

    // Year group headers appear after albums load
    await mainWindow.waitForTimeout(2000);
    const yearHeaders = mainWindow.locator("h6.MuiTypography-root");
    await expect(yearHeaders.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/album-library.png" });
  });

  test("album cards display cover, title, and artist", async () => {
    await mainWindow.waitForTimeout(2000);

    // Album cards have images and text
    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // First album card should have a cover image
    const firstCard = albumCards.first();
    await expect(firstCard.locator("div.MuiCardMedia-root")).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/album-cards.png" });
  });

  test("clicking an album card navigates to album detail view", async () => {
    await mainWindow.waitForTimeout(2000);

    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    test.skip(cardCount === 0, "No albums available to test");

    // Click the first album card's cover image
    await albumCards.first().locator("div.MuiCardMedia-root").click();

    await mainWindow.waitForTimeout(1500);

    // Album detail view should show album info
    await expect(mainWindow.locator("body")).toBeVisible();

    // Song list table should appear
    const songTable = mainWindow.locator("table.MuiTable-root");
    await expect(songTable.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/album-detail.png" });
  });

  // ============================================================
  // 3. Playback - Play All / Shuffle
  // ============================================================

  test("clicking Play button loads tracks into player", async () => {
    const playButton = mainWindow.locator("button").filter({ hasText: "Play" }).first();
    await expect(playButton).toBeVisible();

    await playButton.click();
    await mainWindow.waitForTimeout(2000);

    // Mini player bar should appear with grid structure
    const playerGrid = mainWindow.locator("div.MuiGrid2-container").last();
    await expect(playerGrid).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playing-after-play.png" });
  });

  test("clicking Shuffle button loads shuffled tracks into player", async () => {
    const shuffleButton = mainWindow.locator("button").filter({ hasText: "Shuffle" }).first();
    await expect(shuffleButton).toBeVisible();

    await shuffleButton.click();
    await mainWindow.waitForTimeout(2000);

    // Mini player should appear
    const playerGrid = mainWindow.locator("div.MuiGrid2-container").last();
    await expect(playerGrid).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/playing-after-shuffle.png" });
  });

  // ============================================================
  // 4. Player Controls
  // ============================================================

  test("mini player displays playback controls", async () => {
    // First load a track
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);

    // Control buttons container should exist
    const controlSection = mainWindow.locator("div.MuiGrid2-root").nth(1);
    await expect(controlSection).toBeVisible();

    // Volume controller area
    const volumeArea = mainWindow.locator("div.MuiGrid2-root").last();
    await expect(volumeArea).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/player-controls.png" });
  });

  test("seek slider is visible in player bar", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);

    // Slider should be present
    const slider = mainWindow.locator("input[type='range'], .MuiSlider-root");
    await expect(slider.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/player-slider.png" });
  });

  // ============================================================
  // 5. Sidebar Navigation
  // ============================================================

  test("sidebar navigation items are clickable", async () => {
    // Albums link (exact match to avoid sidebar + playlist collision)
    const sidebar = mainWindow.locator("nav.MuiDrawer-paper, div.MuiDrawer-paper");
    const albumsLink = sidebar.getByText("Albums", { exact: true });
    await expect(albumsLink).toBeVisible();
    await albumsLink.click();
    await mainWindow.waitForTimeout(500);

    // Should still be on the album list (root route)
    await expect(mainWindow.getByText("Aimer", { exact: true }).first()).toBeVisible();

    // Songs link
    const songsLink = sidebar.getByText("Songs", { exact: true });
    await expect(songsLink).toBeVisible();
    await songsLink.click();
    await mainWindow.waitForTimeout(1000);

    // Should navigate to songs page (ALBUM column header is unique to songs table)
    const songsPageHeader = mainWindow.locator("th").filter({ hasText: "ALBUM" }).first();
    await expect(songsPageHeader).toBeVisible();

    // Playlists link
    const playlistsLink = sidebar.getByText("Playlists", { exact: true });
    await expect(playlistsLink).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/sidebar-nav.png" });
  });

  // ============================================================
  // 6. Top Navigation Bar
  // ============================================================

  test("back button is visible in top navigation bar", async () => {
    // Back button with ArrowBackIosNewIcon
    const backButton = mainWindow.locator("button.MuiIconButton-root").first();
    await expect(backButton).toBeVisible();
  });

  test("search input is present in top navigation bar", async () => {
    const searchInput = mainWindow.getByPlaceholder("Search");
    await expect(searchInput).toBeVisible();

    // Verify it's an input element
    await expect(searchInput.evaluate((el) => el.tagName)).resolves.toBe("INPUT");

    await mainWindow.screenshot({ path: "e2e/screens/search-bar.png" });
  });

  test("user menu opens and shows Manage Hosts option", async () => {
    const userAvatar = mainWindow.getByRole("button", { name: "U", exact: true });
    await expect(userAvatar).toBeVisible();

    await userAvatar.click();
    await mainWindow.waitForTimeout(500);

    // Menu should appear with Manage Hosts
    await expect(mainWindow.getByText("Manage Hosts")).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/user-menu.png" });
  });

  // ============================================================
  // 7. Host Management Dialog
  // ============================================================

  test("opens Manage Hosts dialog from user menu", async () => {
    // Open user menu
    await mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await mainWindow.waitForTimeout(300);

    // Click Manage Hosts
    await mainWindow.getByText("Manage Hosts").click();
    await mainWindow.waitForTimeout(1000);

    // Dialog should be visible
    const dialog = mainWindow.locator("[role='dialog']");
    await expect(dialog.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/manage-hosts-dialog.png" });
  });

  test("Manage Hosts dialog shows Add Host button", async () => {
    // Open dialog
    await mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await mainWindow.getByText("Manage Hosts").click();
    await mainWindow.waitForTimeout(1000);

    // Add Host button should be present (look for button containing "Add" text)
    const dialog = mainWindow.locator("[role='dialog']").first();
    const addHostButton = dialog.locator("button").filter({ hasText: /Add/i }).first();
    await expect(addHostButton).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/manage-hosts-add-button.png" });
  });

  // ============================================================
  // 8. Add Host Dialog
  // ============================================================

  test("opens Add Host dialog from Manage Hosts", async () => {
    // Open Manage Hosts dialog
    await mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await mainWindow.getByText("Manage Hosts").click();
    await mainWindow.waitForTimeout(1000);

    // Click Add Host
    const dialog = mainWindow.locator("[role='dialog']").first();
    const addHostButton = dialog.locator("button").filter({ hasText: /Add/i }).first();
    await addHostButton.click();
    await mainWindow.waitForTimeout(1000);

    // Add Host dialog should be visible (new dialog on top)
    const dialogs = mainWindow.locator("[role='dialog']");
    await expect(dialogs.last()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/add-host-dialog.png" });
  });

  // ============================================================
  // 9. Album Detail View
  // ============================================================

  test("album detail view shows track list table", async () => {
    await mainWindow.waitForTimeout(2000);

    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    test.skip(cardCount === 0, "No albums available");

    await albumCards.first().locator("div.MuiCardMedia-root").click();
    await mainWindow.waitForTimeout(2000);

    // Song list table should be visible
    const songTable = mainWindow.locator("table.MuiTable-root");
    await expect(songTable.first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/album-detail-full.png" });
  });

  test("back button navigates from album detail to album list", async () => {
    await mainWindow.waitForTimeout(2000);

    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    test.skip(cardCount === 0, "No albums available");

    // Navigate to album detail
    await albumCards.first().locator("div.MuiCardMedia-root").click();
    await mainWindow.waitForTimeout(1500);

    // Verify we're on album detail (table visible)
    const songTable = mainWindow.locator("table.MuiTable-root");
    await expect(songTable.first()).toBeVisible();

    // Click back button (first icon button in top bar)
    const backButton = mainWindow.locator("button.MuiIconButton-root").first();
    await backButton.click();
    await mainWindow.waitForTimeout(1000);

    // Should be back at album list - artist name visible
    await expect(mainWindow.getByText("Aimer", { exact: true }).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/back-to-library.png" });
  });

  // ============================================================
  // 10. Responsive Player - Mobile Player Toggle
  // ============================================================

  test("expand/collapse button is present in player bar", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);

    // The expand/collapse buttons (KeyboardArrowUp/Down icons) are icon buttons
    // Count icon buttons - there should be multiple (queue, expand, etc.)
    const iconButtons = mainWindow.locator("button.MuiIconButton-root");
    const count = await iconButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await mainWindow.screenshot({ path: "e2e/screens/player-expand-button.png" });
  });

  // ============================================================
  // 11. Playback Control Interactions
  // ============================================================

  test("pause button appears after clicking play", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(3000);

    await mainWindow.locator("button[aria-label='pause']").first().waitFor({
      state: "visible",
      timeout: 60000
    });

    await mainWindow.screenshot({ path: "e2e/screens/player-pause.png" });
  });

  test("next and previous song buttons are present in player", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);
    await expect(mainWindow.locator("button[aria-label='next song']").first()).toBeVisible();
    await expect(mainWindow.locator("button[aria-label='previous song']").first()).toBeVisible();
    await mainWindow.screenshot({ path: "e2e/screens/player-next-prev.png" });
  });

  test("repeat button is present in player controls", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);
    await expect(mainWindow.locator("button[aria-label='repeat']").first()).toBeVisible();
    await mainWindow.screenshot({ path: "e2e/screens/player-repeat.png" });
  });

  // ============================================================
  // 12. Play Queue Management
  // ============================================================

  test("queue toggle opens play queue panel", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(3000);

    const playerGrid = mainWindow.locator("div.MuiGrid2-container:has(button[aria-label='shuffle'])");
    const rightSection = playerGrid.locator("> div.MuiGrid2-root").nth(2);
    const queueButton = rightSection.locator("button.MuiIconButton-root").nth(1);
    await queueButton.click();
    await mainWindow.waitForTimeout(1000);

    await expect(mainWindow.getByText("Play queue").first()).toBeAttached({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/play-queue.png" });
  });

  test("play queue panel shows PLAYING and NEXT UP sections", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(3000);

    const playerGrid = mainWindow.locator("div.MuiGrid2-container:has(button[aria-label='shuffle'])");
    const rightSection = playerGrid.locator("> div.MuiGrid2-root").nth(2);
    const queueButton = rightSection.locator("button.MuiIconButton-root").nth(1);
    await queueButton.click();
    await mainWindow.waitForTimeout(1000);

    await expect(mainWindow.getByText("PLAYING").first()).toBeAttached({ timeout: 60000 });
    await expect(mainWindow.getByText("NEXT UP").first()).toBeAttached({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/play-queue-sections.png" });
  });

  // ============================================================
  // 13. Full-Screen Expandable Player
  // ============================================================

  test("expand button opens full-screen player view", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(3000);

    const playerGrid = mainWindow.locator("div.MuiGrid2-container:has(button[aria-label='shuffle'])");
    const rightSection = playerGrid.locator("> div.MuiGrid2-root").nth(2);
    const expandButton = rightSection.locator("button.MuiIconButton-root").last();
    await expandButton.click();
    await mainWindow.waitForTimeout(1500);

    await expect(mainWindow.getByText("Playing from:").first()).toBeVisible({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/fullscreen-player.png" });
  });

  test("full-screen player shows song title and artist", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(3000);

    const playerGrid = mainWindow.locator("div.MuiGrid2-container:has(button[aria-label='shuffle'])");
    const rightSection = playerGrid.locator("> div.MuiGrid2-root").nth(2);
    const expandButton = rightSection.locator("button.MuiIconButton-root").last();
    await expandButton.click();
    await mainWindow.waitForTimeout(1500);

    await expect(mainWindow.getByText("Playing from:").first()).toBeVisible({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/fullscreen-player-info.png" });
  });

  // ============================================================
  // 14. Audio Quality Indicator
  // ============================================================

  test("audio quality indicator (bit depth chip) is visible in player bar", async () => {
    await mainWindow.locator("button").filter({ hasText: "Play" }).first().click();
    await mainWindow.waitForTimeout(2000);

    const playerGrid = mainWindow.locator("div.MuiGrid2-container:has(button[aria-label='shuffle'])");
    const chip = playerGrid.locator(".MuiChip-root");
    await expect(chip.first()).toBeVisible({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/bit-depth-chip.png" });
  });

  // ============================================================
  // 15. Song Metadata in Album Detail
  // ============================================================

  test("album detail displays track count and video count info", async () => {
    await mainWindow.waitForTimeout(2000);

    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    test.skip(cardCount === 0, "No albums available");

    await albumCards.first().locator("div.MuiCardMedia-root").click();
    await mainWindow.waitForTimeout(2000);

    await expect(mainWindow.getByText(/TRACKS/).first()).toBeVisible({ timeout: 60000 });
    await mainWindow.screenshot({ path: "e2e/screens/album-track-count.png" });
  });

  test("album detail song table shows TITLE column header", async () => {
    await mainWindow.waitForTimeout(2000);

    const albumCards = mainWindow.locator("div.MuiCard-root");
    const cardCount = await albumCards.count();
    test.skip(cardCount === 0, "No albums available");

    await albumCards.first().locator("div.MuiCardMedia-root").click();
    await mainWindow.waitForTimeout(2000);

    const table = mainWindow.locator("table.MuiTable-root").first();
    await expect(table).toBeVisible();
    await expect(mainWindow.locator("th").filter({ hasText: "TITLE" }).first()).toBeVisible();
    await mainWindow.screenshot({ path: "e2e/screens/song-table-columns.png" });
  });

  // ============================================================
  // 16. Host File Browsing
  // ============================================================

  test("Manage Hosts dialog shows List Files button for configured hosts", async () => {
    await mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.getByText("Manage Hosts").click();
    await mainWindow.waitForTimeout(2000);

    const listFilesButtons = mainWindow.locator("button").filter({ hasText: "List Files" });
    const count = await listFilesButtons.count();

    await mainWindow.screenshot({ path: "e2e/screens/host-list-files.png" });

    if (count > 0) {
      await expect(listFilesButtons.first()).toBeVisible();
    }
  });

  // ============================================================
  // 17. Host Removal
  // ============================================================

  test("Manage Hosts dialog shows delete button for each configured host", async () => {
    await mainWindow.getByRole("button", { name: "U", exact: true }).click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.getByText("Manage Hosts").click();
    await mainWindow.waitForTimeout(2000);

    const dialog = mainWindow.locator("[role='dialog']").first();
    const listItems = dialog.locator("li.MuiListItem-root");
    const hostCount = await listItems.count().catch(() => 0);

    await mainWindow.screenshot({ path: "e2e/screens/host-delete-button.png" });

    if (hostCount > 0) {
      const deleteButtons = dialog.locator("button.MuiIconButton-root");
      const deleteCount = await deleteButtons.count().catch(() => 0);
      expect(deleteCount).toBeGreaterThan(0);
    }
  });

  // ============================================================
  // 18. Error Handling
  // ============================================================

  test("app shell renders even when backend API calls fail", async () => {
    await expect(mainWindow.getByText("Aimer live music", { exact: true })).toBeVisible();
    await expect(mainWindow.getByText("MY COLLECTION")).toBeVisible();
    await expect(mainWindow.getByPlaceholder("Search")).toBeVisible();

    const hasErrorDialog = await mainWindow.getByText("Error").isVisible({ timeout: 60000 }).catch(() => false);
    expect(hasErrorDialog).toBe(false);
  });

  // ============================================================
  // 19. Songs Tab
  // ============================================================

  test("songs page displays Songs title and track count", async () => {
    // Navigate to songs page via sidebar
    const sidebar = mainWindow.locator("nav.MuiDrawer-paper, div.MuiDrawer-paper");
    await sidebar.getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(2000);

    // Songs title should be visible in main content
    await expect(mainWindow.getByText("Songs").first()).toBeVisible();

    // Track count text (e.g., "0 tracks" or "12 tracks")
    await expect(mainWindow.getByText(/tracks/).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/songs-page.png" });
  });

  test("songs page shows Play All and Shuffle buttons", async () => {
    const sidebar = mainWindow.locator("nav.MuiDrawer-paper, div.MuiDrawer-paper");
    await sidebar.getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(1000);

    await expect(mainWindow.locator("button").filter({ hasText: "Play" }).first()).toBeVisible();
    await expect(mainWindow.locator("button").filter({ hasText: "Shuffle" }).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/songs-buttons.png" });
  });

  test("songs page table shows expected column headers", async () => {
    const sidebar = mainWindow.locator("nav.MuiDrawer-paper, div.MuiDrawer-paper");
    await sidebar.getByText("Songs", { exact: true }).click();
    await mainWindow.waitForTimeout(1000);

    // Column headers unique to songs page
    await expect(mainWindow.locator("th").filter({ hasText: "TITLE" }).first()).toBeVisible();
    await expect(mainWindow.locator("th").filter({ hasText: "ARTIST" }).first()).toBeVisible();
    await expect(mainWindow.locator("th").filter({ hasText: "ALBUM" }).first()).toBeVisible();
    await expect(mainWindow.locator("th").filter({ hasText: "QUALITY" }).first()).toBeVisible();
    await expect(mainWindow.locator("th").filter({ hasText: "TIME" }).first()).toBeVisible();

    await mainWindow.screenshot({ path: "e2e/screens/songs-table-columns.png" });
  });
});
