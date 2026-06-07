# Unified Media Player Implementation Decisions

## Architecture

- Playback state is owned by the Redux player feature. `QueueEntry` wraps each `Song` or `Video`
  with a unique occurrence ID, a source item key, and navigable `PlaySource` metadata.
- `playContext` replaces queue contents from an album, playlist, artist, search, or library
  context. The selected index becomes current, earlier entries become history, and later entries
  become up next.
- `playingTrack` remains as a compatibility projection of `currentEntry.media`. New queue and
  history code uses `QueueEntry`.
- `PlaybackEngine` is the only component that loads media. It coordinates the global
  `react-use-audio-player` runtime and one persistent `ReactPlayer` instance.
- Starting audio stops video; starting video stops audio. The same `ReactPlayer` DOM instance is
  resized between the bottom player and expanded player, so expanding or minimizing does not
  reload or seek the video.
- Local media uses `/api/stream/audio/:id` and `/api/stream/video/:id`. A video's `youtubeUrl` is
  passed directly to `ReactPlayer`.

## Public Types and Commands

- `PlaySource`: typed source metadata containing source type, optional ID, display label, and
  route.
- `QueueEntry`: unique queue occurrence containing media, `playFrom`, and `sourceItemKey`.
- `playContext`: creates a context-aware queue with optional start index, shuffle, and explicit
  source item keys.
- Source screens compare the current queue entry with their own source and item key. This prevents
  duplicate media occurrences or the same media in another context from all appearing active.

## Mixed Playlists

- Playlist documents now contain ordered `items` subdocuments with an occurrence `_id`,
  `mediaType`, and `mediaId`.
- Playlist detail responses populate each item as audio or video while preserving stored order and
  occurrence identity.
- `POST /api/playlist/:id/items` adds mixed entries. Duplicate media is rejected with HTTP 409
  unless `allowDuplicates` is true.
- `DELETE /api/playlist/:id/items/:itemId` removes one occurrence rather than every matching media
  reference.
- Existing song endpoints remain available as compatibility wrappers.
- Legacy `songs[]` playlists are converted to audio items when first read. The explicit
  `pnpm migrate:playlist-items` command performs the same migration in advance.
- Album-level Play remains audio-only. Selecting a video from an album queues that album's videos.

## Verification

- `pnpm test -- playerSlice.test playlistLogic.test`: 4 tests passed.
- `pnpm typecheck:web`: passed.
- `pnpm typecheck:e2e`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e -- e2e/gui.spec.ts`: 14 passed, 2 existing skipped tests.
- Focused ESLint run completed with zero errors. Remaining warnings are existing style rules such as
  explicit return types.
- `pnpm typecheck:node` remains blocked by existing unused-symbol errors across backend builder,
  stream, crypto, and WebDAV modules. The playlist files introduced by this change have no remaining
  TypeScript errors in that output.

## Known Limitations

- Queue state remains in memory and is not restored after application restart.
- The persistent video runtime is verified with the deterministic local E2E fixture. Live YouTube
  playback still depends on network availability and provider embedding policy.
- Playlist reordering is represented by the ordered schema but no drag-and-drop reorder UI or
  reorder endpoint was added.
- Legacy `songs[]` is retained temporarily for compatibility; new writes use `items`.
