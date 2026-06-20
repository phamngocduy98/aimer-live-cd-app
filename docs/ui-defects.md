# Responsive UI Defects

Audit date: 2026-06-07

Scope: renderer shell, library/detail pages, shared media components, dialogs, and
player behavior across the documented width bands:

- Mobile: below 600 px
- Compact desktop/tablet: 600-1199 px
- Expanded desktop: 1200 px and above

The findings below are confirmed from responsive code paths and current E2E
coverage. They focus on behavior or identity that changes inconsistently across
widths, rather than normal responsive simplification.

## Critical

### UI-003: Creating the first playlist is unavailable on mobile

- **Affected:** Mobile, below 600 px
- **Observed:** The only shell-level Create Playlist button is in the sidebar,
  which is hidden on mobile. The Playlists empty state still instructs the user
  to create one "from the sidebar", and Add to Playlist says to create one first
  without providing an action.
- **Expected:** The Playlists page or mobile navigation must expose Create
  Playlist. Empty states should contain a working create action and
  width-appropriate copy.
- **References:**
  `src/renderer/src/components/layout/Sidebar.tsx:74`,
  `src/renderer/src/components/layout/Sidebar.tsx:179`,
  `src/renderer/src/features/playlist/components/PlaylistList.tsx:40`,
  `src/renderer/src/features/playlist/components/AddToPlaylistDialog.tsx:54`

### UI-004: Song and playlist rows rely on double-click at touch widths

- **Affected:** Mobile and touch-oriented tablet use
- **Observed:** Song and playlist rows start playback only through
  `onDoubleClick`. There is no responsive single-tap row handler. Search and
  Artist song tables also leave `showActions` at its default `false`, so those
  mobile rows have neither a visible play control nor a visible actions button.
- **Desktop behavior:** Mouse users can double-click or use a context menu.
- **Expected:** A single tap or an explicit touch-sized play button must start
  playback. Secondary actions should remain reachable without right-click.
- **References:**
  `src/renderer/src/components/media/SongTable.tsx:60`,
  `src/renderer/src/components/media/SongTable.tsx:123`,
  `src/renderer/src/components/media/SongTable.tsx:124`,
  `src/renderer/src/features/playlist/components/PlaylistItemsTable.tsx:103`,
  `src/renderer/src/features/search/components/SearchResults.tsx:74`,
  `src/renderer/src/features/artist/components/ArtistView.tsx:206`

## High

### UI-006: Expanded mobile queue loses Create Playlist and Clear Queue

- **Affected:** Mobile expanded player
- **Observed:** Desktop queue presentations pass `onClear` and render Create
  playlist from queue. The mobile expanded player renders `<QueuePanel mobile />`
  without `onClear`; the mobile header branch also omits the create button.
- **Expected:** Queue mutation actions should remain available in the mobile
  action surface, even if represented by a menu or compact buttons.
- **References:**
  `src/renderer/src/features/player/components/MobilePlayerUI.tsx:77`,
  `src/renderer/src/features/player/components/MobilePlayerUI.tsx:98`,
  `src/renderer/src/features/player/components/FloatingQueueList.tsx:103`,
  `src/renderer/src/features/player/components/FloatingQueueList.tsx:118`,
  `src/renderer/src/features/player/components/FloatingQueueList.tsx:172`

### UI-008: Album card actions are exposed by right-click on desktop but have no mobile opener

- **Affected:** Mobile album grids and shelves
- **Observed:** `AlbumActionsMenu` is opened only by `onContextMenu`. Mobile
  cards permanently show Play and Favorite overlays, but no More button, so
  actions such as Go to artist, Credits, Share, and collection actions cannot
  open from the card.
- **Expected:** Mobile cards need a visible More action that opens the existing
  responsive dialog action surface.
- **References:**
  `src/renderer/src/components/media/AlbumCard.tsx:26`,
  `src/renderer/src/components/media/AlbumCard.tsx:66`,
  `src/renderer/src/components/media/AlbumCard.tsx:130`

### UI-009: Tablet volume adjustment depends on mouse hover

- **Affected:** Compact desktop/tablet, especially touch devices
- **Observed:** At `sm` and above the player shows `VolumeController`, but its
  slider opens only on `onMouseEnter` and closes on `onMouseLeave`. Touch users
  can toggle mute, but cannot reliably reveal or adjust the volume slider.
- **Expected:** Clicking/tapping the volume control should toggle the slider, or
  the compact tablet layout should provide a touch-accessible volume surface.
- **References:**
  `src/renderer/src/features/player/components/MPlayerUI.tsx:179`,
  `src/renderer/src/features/player/components/VolumeController.tsx:35`,
  `src/renderer/src/features/player/components/VolumeController.tsx:86`

## Medium


### UI-011: Responsive action behavior exists, but several touch surfaces cannot open it

- **Affected:** Mobile media collections
- **Observed:** `ResponsiveActionSurface` correctly switches menus to a mobile
  dialog, but callers such as action-less Song tables and Album cards depend on
  right-click/context-menu events. The responsive component therefore exists
  without a reachable touch trigger on several screens.
- **Expected:** Every mobile media representation should expose a visible,
  consistently named More actions button.
- **References:**
  `src/renderer/src/components/media/MediaActionsMenu.tsx:176`,
  `src/renderer/src/components/media/SongTable.tsx:124`,
  `src/renderer/src/components/media/SongTable.tsx:244`,
  `src/renderer/src/components/media/AlbumCard.tsx:26`

## Missing Responsive Regression Coverage

Current E2E coverage checks shell visibility, selected responsive layouts, and
player geometry, but it does not protect the workflows above. Add mobile or
touch-oriented E2E scenarios for:

1. Entering and submitting a search query from mobile navigation.
2. Reaching the Videos collection on mobile.
3. Creating the first playlist on mobile.
4. Playing Search, Artist, Songs, Album, and Playlist rows with one tap/click.
5. Opening media actions without right-click.
6. Opening Admin on mobile.
7. Creating a playlist from and clearing the expanded mobile queue.
8. Navigating to an artist from expanded mobile track details.
9. Adjusting volume at tablet width without hover.
10. Rendering the same brand identity at mobile and desktop widths.
