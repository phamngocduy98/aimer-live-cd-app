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

## Features

### Music Streaming

- HTTP range-based streaming for both audio and video
- Automatic failover across multiple hosting providers

### Music Library

- **Songs** — full metadata, bitrate, file count
- **Videos** — stream with chapter support
- **Albums** — contain songs + videos
- **Playlists** — song-only collections
- **Artists** — top songs + albums view

### Media Upload

- Upload songs to hosting providers
- Partial upload resume — skip or limit parts for interrupted uploads
- YouTube video integration — add YouTube videos to your library

### Hosting Management

- Manage hosting provider FTP credentials
- List and browse media files per host
- Remove hosts with cleanup of orphaned media

### Video Chapters

- Add chapters to videos (time + title format)
- View and navigate chapters during playback
