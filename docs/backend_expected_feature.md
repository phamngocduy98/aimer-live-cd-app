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

## 2. Library Metadata APIs

- **Albums:** list albums, load album details, return album covers, and report album backup status.
- **Songs:** list songs, load one song, return album cover for a song.
- **Videos:** list videos with album metadata and chapter metadata.
- **Artists:** return top tracks for an artist name.
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

- **Media upload:** `/api/upload/:hostId?` uploads one audio/video file to a selected or default host.
- **Upload result:** upload returns the created media identity as `{ id, type }`.
- **Upload progress:** `/api/upload-progress/:id` sends server-sent events for upload lifecycle and part progress.
- **Album upload:** `/api/upload-album/:hostId?` uploads multiple audio files in sequence.
- **Partial upload:** `skipPart` and `limitPart` support retrying interrupted uploads.
- **YouTube video:** `/api/videos/youtube/:albumId?` creates a YouTube-backed video record.
- **Album backup:** `/api/album/:id/backup/:hostid` and `/api/album/:id/backup2/:hostid` copy album media to another host.

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
- **Artist rename:** `/api/admin/artists/:name` renames an artist string across songs, videos, and albums.
- **Artist image:** `/api/admin/artists/:name/image` stores and serves an artist profile image.
- **Song/video delete:** deletes remote media files first; database rows are deleted only after remote cleanup succeeds or files are confirmed absent.

## 7. Playlist APIs

- **Playlist list:** returns playlist summaries with media counts.
- **Create/edit/delete:** supports playlist create, update, and delete.
- **Detail:** returns playlist items with resolved song/video media.
- **Mixed media items:** supports both audio and video playlist items.
- **Legacy song routes:** song-only add/remove endpoints remain compatible with older playlist usage.
- **Duplicate handling:** playlist item identity remains occurrence-based, not only media-ID based.

## 8. Persistence And Cleanup Rules

- **Songs/videos:** store media metadata, file extension, file count, IV, album reference, and hosting list.
- **Albums:** store cover, title, artist, genre, year, track list, and video list.
- **Artist profiles:** store image data keyed by canonical artist name.
- **Host credentials:** store encrypted FTP passwords in MongoDB.
- **Reference cleanup:** deleting hosts, albums, songs, or videos must not leave stale album or playlist references.

## 9. Backend Test Scenarios

- Upload health aggregation: complete union, missing parts, unavailable hosts, unknown media.
- Provider file parsing: first part is part `0`, suffix `_N` is part `N`.
- Upload progress: SSE connection, started/uploading/done/error events.
- Remote delete: generated part filenames, missing file as success, remote errors block DB deletion.
- Admin metadata: song/video/album/host update and artist rename.
- Album cover and artist image upload/serve.
- Playlist create/update/delete and mixed item resolution.
- Stream failover across multiple hosting providers.
