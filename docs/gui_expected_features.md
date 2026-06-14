# GUI Expected Features — Test Plan Guide

## 1. Basic Navigation & Screen Rendering

- **Playlists tab** → playlist view screen → play a song (open player)
- **Albums tab** → album view screen
- **Songs tab** → play a song (open player)
- **Videos tab** → play a video (open player)
- **Home** → Featured albums, Featured videos, and artist shortcuts
- **Artist detail** → top tracks, albums, and independent videos
- **Search result page** — search a song, press Enter (or click _More results_) to navigate to full search result page
- **Add/Edit Playlist dialog** (name/description) — verify input values reset after closing and reopening the dialog

## 2. Tab / Screen / Dialog Interactions

### Playlists

- Add playlist, edit playlist → create / edit playlist dialog
- Delete playlist
- **Playlist view:** play, shuffle (songs in playlist), edit, delete, remove song, play a specific song

### Albums

- Open album → album view screen
- Add album to playlist
- **Album view:** play, shuffle (songs in album)
  - Song list: add to playlist, play a song

### Songs Tab

- Song list: add to playlist, play a song

### Videos Tab

- Video list: play a video
- Home and Artist video shelves: open video detail or play within the displayed video collection
- **Video detail:** video cards open an album-style video page whose chapters
  are rendered as song-like rows; the explicit card play button starts playback
  directly from the current collection.
- **Video player:** play a chapter by loading one video queue entry and seeking
  to its position; Previous/Next traverses chapters before queued media.
- **Add / edit chapters:** add chapter markers (time + title), edit existing chapters

## 3. Global Features

### Search

- Search dropdown appears on input
- Click a song/video result → play it
- Click an album result → view album
- Click _Full search results_ → navigate to search result page

### Player

- **Control buttons:**
  - Play / pause (with loading state on play button)
  - Next, previous
  - Volume control
  - Navigate audio to album and all media to artist; video title navigation opens video detail
  - Seek bar
- **Player mode:** full-screen, minimized
- **Now playing list:**
  - Slide the play queue from right to left when opening and reverse the motion
    when closing
  - Navigate between songs in the list
  - Song moves: next up → playing → history
  - Clear playing list
  - Delete song from list
- **Synchronized lyrics:**
  - Open and close lyrics from the expanded player
  - Slide lyrics from right to left when opening and reverse the motion when
    closing, without interrupting playback
  - Display a large primary line with a smaller secondary translation
  - Switch Japanese/Romaji, Romaji/English, and Romaji/Vietnamese
  - Place the icon-only language button beside the play-queue action in player
    chrome, with minimal menu labels: Japanese, English, and Vietnamese
  - Hide Sync Lyrics while audio lyrics follow playback; manual scrolling shows
    it, and activating it restores follow mode and hides it again
  - Video lyrics always follow playback and never show Sync Lyrics
  - Click or keyboard-activate a lyric row to seek to its shared start time
  - Tablet hides artwork, desktop shares the stage with artwork, and mobile
    keeps lyrics above playback controls
  - Lyrics remain centered in their pane with an inset app-styled scrollbar
    and faded top/bottom edges
  - Expanded video displays bilingual floating subtitles without restarting
    playback

## 4. Admin Features

- **Admin dialog** — click user avatar → select _Admin_
- **Admin dialog tabs:**
  - Admin
  - Upload Song
- **Admin:** list hosting providers, browse files, delete files per host
- **Video metadata:** edit title, artists, year, genres, chapters, and dedicated cover artwork
- **Lyrics:** open a dedicated table-only Synchronized Lyrics dialog from
  song/video rows; import Japanese SRT or synchronized LRCLIB lyrics,
  automatically generate romaji, explicitly generate English/Vietnamese,
  edit all language cells, confirm replacement, and save all rows atomically

## 5. Responsive Design

- Each screen and the player are designed to work across different screen sizes
