# Aimer Live CD Music Player - User Features

## What the App Does

Aimer Live CD is a desktop music streaming application that lets you build, manage, and stream a personal music library distributed across multiple free hosting providers. Files are split into encrypted chunks and uploaded via FTP, then streamed back on demand with automatic failover.

---

## Core User Experience

### Music Streaming

- Stream audio tracks from a personal music library
- Stream video content alongside audio
- HTTP range-based streaming — seek anywhere instantly
- Automatic fallback across multiple hosts if one is unavailable

### Music Library

- Browse albums sorted by year
- View album details with full tracklists and video lists
- View song metadata — title, artist, album, bitrate, file count
- View artist track collections
- Album and song cover art display

### Playback Controls

- Play / pause / next / previous
- Shuffle and repeat modes
- Seek bar with progress tracking
- Volume control
- Play queue management (floating list)
- Mini player (always visible) and full-screen expandable player
- Audio quality indicator (bit depth display)

---

## Power User / Admin Features

### Multi-Host Streaming

- Stream from multiple hosting providers simultaneously
- Automatic host failover — tries the next host if one fails
- Encrypted chunked file storage (AES-256)

### Host Management

- Add new hosting providers with FTP credentials
- View all configured hosts
- Browse files stored on each host with metadata enrichment
- Remove hosts with automatic cleanup of orphaned media

### Media Upload

- Upload individual songs to hosting providers
- Upload full albums (batch upload)
- Partial upload resume — skip or limit parts for interrupted uploads
- YouTube video integration — add YouTube videos to your library

### Backup & Redundancy

- View backup status per album — fully hosted, partial, or not hosted
- Backup entire albums to new hosts
- Fast server-side sync backup (via deployed `sync.php`)
- Cross-host replication for reliability

### Video Features

- Video streaming with chapter support
- Add chapter markers to videos (time + title format)

---

## Architecture Highlights

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Desktop shell    | Electron + Vite                                 |
| Frontend         | React + Material-UI (dark theme) + React Router |
| State management | Redux Toolkit                                   |
| Backend          | Express.js                                      |
| Database         | MongoDB (Mongoose)                              |
| File storage     | FTP-based, split into encrypted parts           |
| Encryption       | AES-256-CTR (per-file IV)                       |
| Target hosts     | Free hosting providers (e.g., infinityfree.net) |
