# Implementation & Design

## Architecture

### Media File Management

- Files are split into encrypted chunks
- Uploaded via FTP to hosting providers
- Stream song/video via HTTP range requests

### Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Frontend         | React + Vite (+ Electron for desktop app)       |
| Frontend libs    | Material-UI (dark theme), React Router, Redux   |
| Backend          | Node.js, Express.js                             |
| Database         | MongoDB (Mongoose)                              |
| File storage     | FTP-based, split into encrypted parts           |
| Encryption       | AES-256-CTR (per-file IV)                       |

### Renderer Folder Structure

The renderer uses a feature-based layout:

- `src/renderer/src/app/` owns application providers, routing, Redux setup, and the layout shell.
- `src/renderer/src/features/` owns domain APIs, React Query hooks, types, and UI for player, library, albums, playlists, search, artists, and hosts.
- `src/renderer/src/components/` contains shared layout, media, view, search, and common components.
- `src/renderer/src/lib/` contains the configured Axios client and TanStack Query client.
- `src/renderer/src/types/` contains types shared across multiple features.

Routes are lazy-loaded by feature. Redux remains scoped to player state, while server state is loaded and invalidated through TanStack Query. See `docs/superpowers/specs/2026-06-06-renderer-refactor-design.md` for the full structure.

## Features

### Music Streaming

- HTTP range-based streaming for both audio and video
- Automatic failover across multiple hosting providers

### Music Library

- **Songs** — full metadata, bitrate, file count
- **Videos** — independent artist releases with cover, year, genres,
  album-style detail, and chapter-based playback
- **Albums** — song releases
- **Playlists** — mixed song/video collections
- **Artists** — top songs plus album and video release shelves

### Media Upload

- Upload songs and videos to hosting providers; video metadata is independent
  and never creates or attaches an album
- Partial upload resume — skip or limit parts for interrupted uploads
- Multipart YouTube video integration with metadata JSON and optional cover

### Hosting Management

- Manage hosting provider FTP credentials
- List and browse media files per host
- Remove hosts with cleanup of orphaned media

### Video Chapters

- Add chapters to videos (time + title format)
- View and navigate chapters during playback
