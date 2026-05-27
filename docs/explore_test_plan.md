# Explore Test Plan — Additional Test Categories

> **App:** Aimer Live CD Music Player (browser mode)
> **URL:** http://localhost:5173
> **Authored:** 2026-05-27

---

## A. API Integration & Data Flow

| #   | Scenario                    | What to Test                                                         |
| --- | --------------------------- | -------------------------------------------------------------------- |
| A1  | Albums load correctly       | Verify API response populates album cards (titles, years, covers)    |
| A2  | Album detail fetches tracks | Navigate to album, verify songs + videos match expected count        |
| A3  | Song metadata rendering     | Check title, artist, album name, duration, bitrate displayed per row |
| A4  | Search API response         | Type query, verify dropdown shows matching songs/albums/videos       |
| A5  | Search debounce behavior    | Type rapidly, verify only one API call fires after 300ms settle      |
| A6  | Playlist list loads         | Verify sidebar and overview show same playlist set                   |

---

## B. State Management (Redux)

| #   | Scenario                          | What to Test                                                                          |
| --- | --------------------------------- | ------------------------------------------------------------------------------------- |
| B1  | Playing track persists across nav | Play a song, navigate Albums → Songs → Playlist, verify player still shows same track |
| B2  | Queue survives page navigation    | Queue 3+ songs, navigate away and back, verify queue intact                           |
| B3  | Shuffle state persists            | Toggle shuffle on, navigate pages, verify shuffle still active                        |
| B4  | Repeat mode cycles correctly      | Click repeat: 0 → 1 → 2 → 0, verify icon changes at each step                         |
| B5  | Play history accumulates          | Play 3+ tracks, open queue, verify History section shows previous tracks              |
| B6  | Queue clear resets all state      | Clear queue, verify track stops, player bar disappears                                |

---

## C. Error Handling & Edge Cases

| #   | Scenario             | What to Test                                                               |
| --- | -------------------- | -------------------------------------------------------------------------- |
| C1  | Backend unavailable  | Stop server, reload UI, verify graceful error (no crash, snackbar/message) |
| C2  | Empty search results | Search for gibberish `"zzzzzzzzz"`, verify "No results found"              |
| C3  | No playlists yet     | Fresh DB, navigate to `/playlists`, verify empty state message             |
| C4  | Single-item queue    | Play one song, verify Next is disabled (no more songs in queue)            |
| C5  | Repeat one loops     | Set repeat=2 with one song, let it end, verify it restarts                 |
| C6  | Empty album          | If any album has no media, verify graceful empty display                   |

---

## D. User Workflows (End-to-End)

| #   | Scenario                              | What to Test                                                                                                                               |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Full playlist lifecycle               | Create playlist → add 3 songs from Songs page → navigate to detail → verify 3 songs → play all → shuffle → remove 1 song → delete playlist |
| D2  | Search → Play journey                 | Search for a song → click result → verify player starts → verify queue shows that song                                                     |
| D3  | Album → Song playback                 | Navigate to album → double-click track #3 → verify it starts from track 3, queue has tracks 4+                                             |
| D4  | Cross-page navigation during playback | While playing, navigate: Songs → Album → Playlist → Home, verify player uninterrupted                                                      |
| D5  | Queue reordering (skip/remove)        | Queue 5 songs → skip to #3 → remove #4 → verify current track still playing, queue correct                                                 |

---

## E. Dialog & Form Behavior

| #   | Scenario                        | What to Test                                                                |
| --- | ------------------------------- | --------------------------------------------------------------------------- |
| E1  | Create playlist validation      | Click Create with empty name → button disabled → type name → button enables |
| E2  | Add to playlist lists correctly | From Songs context menu → verify dialog lists all existing playlists        |
| E3  | Dialog close without action     | Open CreatePlaylist → type name → Cancel → verify no playlist created       |
| E4  | Add Host form fields            | Verify all 8 fields present, required fields marked, default values         |
| E5  | User menu open/close            | Click avatar → menu opens → click outside → menu closes                     |
| E6  | Multiple dialog stacking        | Open ManageHosts → click Add Host → verify both dialogs properly layered    |

---

## F. Playback Behavior

| #   | Scenario                                     | What to Test                                                                           |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| F1  | Double-click in Songs starts from that track | Click row #5 → verify player shows track 5 with tracks 6+ queued                       |
| F2  | Double-click in Search plays single track    | Search → double-click result → verify ONLY that track plays (no follow-up queue)       |
| F3  | Shuffle randomizes order                     | Play 10 tracks shuffled → note order → reload → play shuffled → verify different order |
| F4  | Next track auto-plays                        | Click Next → verify next track in queue starts automatically                           |
| F5  | Album Play vs Shuffle buttons                | Click Play → track order. Click Shuffle → different order                              |

---

## G. Search Deep-Dive

| #   | Scenario                         | What to Test                                                          |
| --- | -------------------------------- | --------------------------------------------------------------------- |
| G1  | Dropdown sections                | Type query, verify Songs (≤5), Albums (≤4, horizontal), Videos (≤5)   |
| G2  | Dropdown play-on-click           | Click song in dropdown → verify it plays immediately, dropdown closes |
| G3  | Dropdown album navigation        | Click album in dropdown → verify navigates to album detail            |
| G4  | Dropdown "More results"          | Click footer → verify navigates to full search results page           |
| G5  | Dropdown keyboard dismiss        | Open dropdown → Escape → verify closes, input blurs                   |
| G6  | Search results page completeness | Submit search → verify Songs table, Albums grid, Videos table present |

---

## H. Play / Shuffle Button Consistency

| #   | Scenario                     | What to Test                                                               |
| --- | ---------------------------- | -------------------------------------------------------------------------- |
| H1  | Home page Play/Shuffle       | Both buttons present, Play is contained white, Shuffle is text/transparent |
| H2  | Album detail Play/Shuffle    | Same styling, Play uses trackList if available else videoList              |
| H3  | Playlist detail Play/Shuffle | Verify both use `playlist.songs`                                           |
| H4  | Songs page Play/Shuffle      | Verify both use all songs from API                                         |

---

## I. Context Menu Consistency

| #   | Scenario                             | What to Test                                      |
| --- | ------------------------------------ | ------------------------------------------------- |
| I1  | Songs page context menu              | More icon → verify only "Add to Playlist" appears |
| I2  | Album detail context menu            | Same — only "Add to Playlist"                     |
| I3  | Playlist detail context menu         | Verify only "Remove from playlist" (not Add)      |
| I4  | Context menu closes on outside click | Open menu → click elsewhere → verify menu closes  |

---

## J. Navigation & Routing

| #   | Scenario                    | What to Test                                                             |
| --- | --------------------------- | ------------------------------------------------------------------------ |
| J1  | Hash routing works          | Navigate to `/#/songs`, `/#/videos`, `/#/playlists` — correct page loads |
| J2  | Back button conditionally   | Home: no back button. Non-home: back button visible                      |
| J3  | Album name links in tables  | In Songs, Playlists, Search — click album name → navigates to album      |
| J4  | Artist name links clickable | In player info, album detail — click artist → navigates home             |
| J5  | Direct URL navigation       | Open `/#/album/<real-id>` → verify album detail loads                    |

---

## K. Time & Duration Formatting

| #   | Scenario           | What to Test                                                      |
| --- | ------------------ | ----------------------------------------------------------------- |
| K1  | Duration in tables | Verify tracks show `mm:ss` format (not raw seconds)               |
| K2  | Seek slider time   | Play track → verify elapsed `mm:ss` and remaining `-mm:ss`        |
| K3  | Album stats line   | Album detail → "N TRACKS (time) / M VIDEOS (time)" format correct |

---

## L. Quality Chip Display

| #   | Scenario       | What to Test                                                    |
| --- | -------------- | --------------------------------------------------------------- |
| L1  | Chip per track | Every Songs/Playlist/Search row shows quality chip              |
| L2  | Chip tooltip   | Hover chip → verify tooltip matches bitrate/format              |
| L3  | Color coding   | MPEG=default, FLAC24/96=orange, FLAC24=teal, other FLAC=default |

---

## M. Keyboard & Accessibility

| #   | Scenario               | What to Test                                                  |
| --- | ---------------------- | ------------------------------------------------------------- |
| M1  | Enter submits search   | Type query, press Enter → navigates to search results page    |
| M2  | Escape closes dropdown | Type query (dropdown opens) → Escape → dropdown closes        |
| M3  | Tab order in dialogs   | Open CreatePlaylist → Tab through fields → verify focus order |
