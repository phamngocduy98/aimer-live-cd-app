# Backend Expected Features

This document is the backend counterpart to `docs/gui_expected_features.md`.
Use it as the expected behavior checklist for backend API work and backend
test planning.

## 1. Startup, Configuration, And Safety

- **Server startup:** connects to MongoDB before accepting API traffic.
- **Electron mode:** reads encrypted app configuration from the main process environment.
- **Standalone mode:** supports `.env` through `src/main/backend/standalone.ts`.
- **E2E mode:** uses `E2E_TEST_MODE=true` and a database name ending in `_e2e` or `_test`.
- **Request logging:** emits request logs with request IDs and structured backend module logs.
- **Optional lyrics services:** `MYMEMORY_EMAIL` raises the free MyMemory quota;
  `LIBRETRANSLATE_URL` enables LibreTranslate and
  `LIBRETRANSLATE_API_KEY` supplies its optional key.

## 2. Library Metadata APIs

- **Albums:** list albums, load album details, return album covers, and report album backup status.
- **Songs:** list songs, load one song, return album cover for a song.
- **Videos:** list independent releases with artists, year, genres, and
  chapters; retrieve metadata through `/api/video/:id` and artwork through
  `/api/video/:id/cover`.
- **Artists:** return top tracks and independent videos for an artist name.
- **Search:** search albums, songs, and videos with empty-query handling.
- **Pagination:** list endpoints that accept `page` and `pageSize` should return stable sorted slices.

## 3. Streaming And Part Access

- **Audio streaming:** `/api/stream/audio/:id` streams encrypted media parts as one playable response.
- **Video streaming:** `/api/stream/video/:id` streams video media with the same failover behavior.
- **Legacy streaming:** `/api/stream/:id` remains available for backward compatibility.
- **Part fetch:** `/api/part/:id/:fileName` fetches a raw part from any hosting provider serving the media.
- **Hosting failover:** if one hosting provider fails, streaming attempts the next provider in `hostingList`.
- **Part health:** provider `listFiles()` returns zero-based part numbers that match expected parts `0..fileCount-1`.

## 4. Upload And Backup

- **Media upload:** multipart `/api/upload/:hostId?` uploads one audio/video
  file in field `audio` to a selected or default host.
- **Upload result:** upload returns the created media identity as `{ id, type }`.
- **Upload progress:** `/api/upload-progress/:id` sends server-sent events for upload lifecycle and part progress.
- **Album upload:** `/api/upload-album/:hostId?` uploads multiple audio files in sequence.
- **Partial upload:** `skipPart` and `limitPart` support retrying interrupted uploads.
- **File metadata extraction:** audio uploads retain album creation. Video
  uploads extract embedded cover, year, and genres and never create or attach
  an album.
- **YouTube video:** multipart `/api/videos/youtube` accepts required text field
  `metadata` containing JSON with `title`, `artists`, `youtubeUrl`, `duration`,
  optional `year`, `genres`, and `chapters`, plus optional image field `cover`.
  It creates or updates an independent video and returns `{ id, type: "video" }`.
- **YouTube validation:** malformed or missing metadata, invalid chapter/year/
  duration values, and non-image covers return HTTP 400.
- **Video chapters:** every video persists at least one chapter. Empty chapter
  input becomes a `0:00` chapter named after the video.
- **Album backup:** `/api/album/:id/backup/:hostid` and
  `/api/album/:id/backup2/:hostid` copy album songs only.

## 5. Hosting Provider Management

- **Host listing:** list configured providers without exposing encrypted credentials.
- **Host creation:** creates FTP upload and HTTP stream configuration, encrypts FTP password, creates remote upload directory, and uploads `sync.php` / `status.php`.
- **Host file listing:** lists remote files through `status.php`, groups part files by media ID, and enriches rows with song/video titles.
- **Host deletion:** removes the host from song/video `hostingList`, deletes orphaned media, and cleans album references.

## 6. Admin APIs

- **Uploads table:** `/api/admin/uploads` aggregates files across all hosts, enriches media names, and calculates:
  - `healthy` when the union of available parts covers all expected parts.
  - `HA` as the number of hosts with at least one part for that media ID.
- **Admin tables:** `/api/admin/songs`, `/videos`, `/albums`, `/artists`, and `/hosts` return table-ready data.
- **Metadata update:** admin update endpoints modify core song, video, album, host, and artist metadata.
- **Video chapters:** admin video update accepts editable chapter rows with `time`, `title`, and optional `subTitle`.
- **Album cover:** `/api/admin/albums/:id/cover` replaces album cover image data.
- **Video cover:** `/api/admin/videos/:id/cover` replaces video artwork.
- **Artist rename:** `/api/admin/artists/:name` renames an artist string across songs, videos, and albums.
- **Artist image:** `/api/admin/artists/:name/image` stores and serves an artist profile image.
- **Song/video delete:** deletes remote media files first; database rows are deleted only after remote cleanup succeeds or files are confirmed absent.
- **Synchronized lyrics:** searches LRCLIB from the backend with retry and
  timeout handling, imports Japanese timed results, previews Japanese SRT,
  generates Hepburn romaji locally, translates rows through an enabled
  provider, and atomically saves one multilingual row set with provenance.

## 7. Playlist APIs

- **Playlist list:** returns playlist summaries with media counts.
- **Create/edit/delete:** supports playlist create, update, and delete.
- **Detail:** returns playlist items with resolved song/video media.
- **Mixed media items:** supports both audio and video playlist items.
- **Legacy song routes:** song-only add/remove endpoints remain compatible with older playlist usage.
- **Duplicate handling:** playlist item identity remains occurrence-based, not only media-ID based.

## 8. Persistence And Cleanup Rules

- **Songs:** store media metadata, file extension, file count, IV, album reference, and hosting list.
- **Videos:** store independent cover, title, artists, genres, year, chapters,
  file metadata, IV, and hosting list; they never store an album reference.
- **Albums:** store cover, title, artist, genre, year, and song track list only.
- **Artist profiles:** store image data keyed by canonical artist name.
- **Host credentials:** store encrypted FTP passwords in MongoDB.
- **Reference cleanup:** deleting hosts, albums, songs, or videos must not leave stale album or playlist references.

## 9. Backend Test Scenarios

- Upload health aggregation: complete union, missing parts, unavailable hosts, unknown media.
- Provider file parsing: first part is part `0`, suffix `_N` is part `N`.
- Upload progress: SSE connection, started/uploading/done/error events.
- Remote delete: generated part filenames, missing file as success, remote errors block DB deletion.
- Admin metadata: song/video/album/host update and artist rename.
- Album/video cover and artist image upload/serve.
- YouTube multipart metadata parsing and cover validation.
- Artist video filtering and release sorting.
- Playlist create/update/delete and mixed item resolution.
- Stream failover across multiple hosting providers.
- LRC parsing, LRCLIB normalization, duration matching, romaji generation,
  translation timestamp preservation, and atomic lyric-track updates.
