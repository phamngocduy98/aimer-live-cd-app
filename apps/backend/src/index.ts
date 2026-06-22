import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import http from "node:http";
import multer from "multer";
import path from "node:path";
import { v2 as webdav } from "webdav-server";
import { pinoHttp } from "pino-http";

import { dbClient } from "./db/Mongo.js";
import { WebdavServer } from "./webdav/webdav.js";
import { createLogger, getRootLogger, requestContext, randomReqId } from "./utils/log.js";
import {
  attachSession,
  requireAdmin,
  requireAuthenticated,
  requirePaidMedia
} from "./middleware/auth.js";
import { seedFirstAdmin } from "./services/authService.js";

import {
  handleGetHosts,
  handleCreateHost,
  handleDeleteHost,
  handleListHostFiles,
  handleGetAlbums,
  handleGetAlbum,
  handleGetAlbumBackup,
  handleGetAlbumCover,
  handleGetSongs,
  handleGetVideos,
  handleGetVideo,
  handleGetVideoCover,
  handleGetSong,
  handleGetSongCover,
  handleGetArtistImage,
  handleGetArtistTopTracks,
  handleGetArtistVideos,
  handleSearch
} from "./routes/metadata.js";
import {
  handleDeprecatedStream,
  handleDirectStreamAudioManifest,
  handleDirectStreamVideoManifest,
  handleStreamAudio,
  handleStreamVideo
} from "./routes/stream.js";
import {
  handleAdminGetLyricsProviders,
  handleAdminImportLyrics,
  handleAdminPreviewSrt,
  handleAdminRomanizeLyrics,
  handleAdminSaveLyrics,
  handleAdminSearchLyrics,
  handleAdminTranslateLyrics,
  handleGetLyrics
} from "./routes/lyrics.js";
import {
  handleListPlaylists,
  handleCreatePlaylist,
  handleGetPlaylist,
  handleUpdatePlaylist,
  handleDeletePlaylist,
  handleAddSongsToPlaylist,
  handleRemoveSongFromPlaylist,
  handleAddItemsToPlaylist,
  handleRemoveItemFromPlaylist
} from "./routes/playlist.js";
import {
  handleYoutubeVideoUpload,
  handleYoutubeVideoMetadata,
  handleYoutubeLyricsPreview,
  handleFileUpload,
  handleAlbumUpload,
  handleVideoChapters,
  handleUploadProgress,
  handleGetPart,
  handleAlbumBackup,
  handleAlbumBackup2
} from "./routes/upload.js";
import {
  handleAdminCreateHost,
  handleAdminDeleteAlbum,
  handleAdminDeleteHost,
  handleAdminDeleteSong,
  handleAdminDeleteVideo,
  handleAdminGetAlbums,
  handleAdminGetArtistImage,
  handleAdminGetArtists,
  handleAdminGetHosts,
  handleAdminGetSongs,
  handleAdminGetUploads,
  handleAdminGetVideos,
  handleAdminRenameArtist,
  handleAdminUpdateAlbum,
  handleAdminUpdateAlbumCover,
  handleAdminUpdateArtistImage,
  handleAdminUpdateHost,
  handleAdminUpdateSong,
  handleAdminUpdateVideo,
  handleAdminUpdateVideoCover
} from "./routes/admin.js";
import {
  handleAdminCreateUser,
  handleAdminListUsers,
  handleAdminUpdateUser,
  handleLogin,
  handleLogout,
  handleMe,
  handleRefresh
} from "./routes/auth.js";
import {
  handleAddRadioQueueItem,
  handleAdminDeleteRadioQueueItem,
  handleAdminRadioControl,
  handleGetRadioState,
  handleRadioEvents,
  handleRadioListenerHeartbeat,
  handleRadioDirectStreamManifest,
  handleRemoveRadioListener,
  handleRadioStream
} from "./routes/radio.js";

const rootDir = path.resolve();
const webdavEnabled = process.env.VERCEL !== "1";
const webdavServer = webdavEnabled ? new WebdavServer() : null;
let backendInitPromise: Promise<void> | null = null;

function parseConfiguredCorsOrigins(): Set<string> | true {
  const configured = process.env.CORS_ORIGIN;
  if (!configured) return true;

  return new Set(
    configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

const configuredCorsOrigins = parseConfiguredCorsOrigins();

function requestOrigin(req: express.Request): string | undefined {
  const host = req.get("x-forwarded-host") ?? req.get("host");
  if (!host) return undefined;
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${host}`;
}

function corsOptions(
  req: express.Request,
  callback: (error: Error | null, options?: cors.CorsOptions) => void
) {
  const origin = req.get("origin");
  if (
    !origin ||
    origin === "file://" ||
    origin === "null" ||
    configuredCorsOrigins === true ||
    configuredCorsOrigins.has(origin) ||
    origin === requestOrigin(req)
  ) {
    callback(null, { credentials: true, origin: true });
    return;
  }

  callback(new Error(`CORS origin not allowed: ${origin}`));
}

export const app = express();
app.use(bodyParser.json());
app.use(
  pinoHttp({
    logger: getRootLogger(),
    genReqId: () => randomReqId(),
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customReceivedMessage: (req) => `${req.method} ${req.url}`,
    customLogLevel: (_req, res) => (res.statusCode >= 400 ? "warn" : "info")
  })
);
app.use((req, _res, next) => {
  requestContext.run({ requestId: String(req.id) }, () => next());
});
app.use(cors(corsOptions));
app.use(attachSession);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
const staticPath = path.join(rootDir, "public");
createLogger("Status").info(`Serve static at ${staticPath}`);
app.use("/", express.static(staticPath));
if (webdavServer) {
  app.use(webdav.extensions.express("/webdav", webdavServer.server));
} else {
  app.use("/webdav", (_req, res) => {
    res.status(501).json({
      status: "error",
      message: "WebDAV is not supported on this deployment runtime"
    });
  });
}

const upload = multer();

app.post("/api/auth/login", handleLogin);
app.post("/api/auth/logout", handleLogout);
app.post("/api/auth/refresh", handleRefresh);
app.get("/api/auth/me", handleMe);

app.post("/api/videos/youtube/metadata", requireAdmin, handleYoutubeVideoMetadata);
app.post("/api/videos/youtube/lyrics-preview", requireAdmin, handleYoutubeLyricsPreview);
app.post("/api/videos/youtube", requireAdmin, upload.single("cover"), handleYoutubeVideoUpload);

app.post("/api/upload/:hostId?", requireAdmin, upload.single("audio"), handleFileUpload);
app.get("/api/upload-progress/:id", requireAdmin, handleUploadProgress);

app.post("/api/upload-album/:hostId?", requireAdmin, upload.array("audios"), handleAlbumUpload);

app.post(
  "/api/videos/:videoId/chapters",
  requireAdmin,
  bodyParser.text({ type: "*/*" }),
  handleVideoChapters
);

app.get("/api/admin/uploads", requireAdmin, handleAdminGetUploads);
app.get("/api/admin/songs", requireAdmin, handleAdminGetSongs);
app.get("/api/admin/videos", requireAdmin, handleAdminGetVideos);
app.get("/api/admin/albums", requireAdmin, handleAdminGetAlbums);
app.get("/api/admin/artists", requireAdmin, handleAdminGetArtists);
app.get("/api/admin/artists/:name/image", requireAdmin, handleAdminGetArtistImage);
app.get("/api/admin/hosts", requireAdmin, handleAdminGetHosts);
app.get("/api/admin/users", requireAdmin, handleAdminListUsers);
app.post("/api/admin/users", requireAdmin, handleAdminCreateUser);
app.put("/api/admin/users/:id", requireAdmin, handleAdminUpdateUser);
app.post("/api/admin/hosts", requireAdmin, handleAdminCreateHost);
app.put("/api/admin/songs/:id", requireAdmin, handleAdminUpdateSong);
app.put("/api/admin/videos/:id", requireAdmin, handleAdminUpdateVideo);
app.put(
  "/api/admin/videos/:id/cover",
  requireAdmin,
  upload.single("cover"),
  handleAdminUpdateVideoCover
);
app.put("/api/admin/lyrics/:mediaType/:mediaId/tracks", requireAdmin, handleAdminSaveLyrics);
app.get("/api/admin/lyrics/providers", requireAdmin, handleAdminGetLyricsProviders);
app.post(
  "/api/admin/lyrics/preview-srt",
  requireAdmin,
  upload.single("subtitle"),
  handleAdminPreviewSrt
);
app.post("/api/admin/lyrics/:mediaType/:mediaId/search", requireAdmin, handleAdminSearchLyrics);
app.post("/api/admin/lyrics/:mediaType/:mediaId/import", requireAdmin, handleAdminImportLyrics);
app.post("/api/admin/lyrics/romanize", requireAdmin, handleAdminRomanizeLyrics);
app.post("/api/admin/lyrics/translate", requireAdmin, handleAdminTranslateLyrics);
app.put("/api/admin/albums/:id", requireAdmin, handleAdminUpdateAlbum);
app.put(
  "/api/admin/albums/:id/cover",
  requireAdmin,
  upload.single("cover"),
  handleAdminUpdateAlbumCover
);
app.put("/api/admin/hosts/:id", requireAdmin, handleAdminUpdateHost);
app.put("/api/admin/artists/:name", requireAdmin, handleAdminRenameArtist);
app.put(
  "/api/admin/artists/:name/image",
  requireAdmin,
  upload.single("image"),
  handleAdminUpdateArtistImage
);
app.delete("/api/admin/songs/:id", requireAdmin, handleAdminDeleteSong);
app.delete("/api/admin/videos/:id", requireAdmin, handleAdminDeleteVideo);
app.delete("/api/admin/albums/:id", requireAdmin, handleAdminDeleteAlbum);
app.delete("/api/admin/hosts/:id", requireAdmin, handleAdminDeleteHost);
app.post("/api/admin/radio/control", requireAdmin, handleAdminRadioControl);
app.delete(
  "/api/admin/radio/queue/:queueItemId",
  requireAdmin,
  handleAdminDeleteRadioQueueItem
);

app.get("/api/hosts", handleGetHosts);

app.post("/api/hosts", requireAdmin, handleCreateHost);

app.delete("/api/hosts/:id", requireAdmin, handleDeleteHost);

app.get("/api/hosts/:id/files", requireAdmin, handleListHostFiles);

app.get("/api/albums", handleGetAlbums);

app.get("/api/album/:id", handleGetAlbum);

app.get("/api/album/:id/backup", handleGetAlbumBackup);

app.post("/api/album/:id/backup/:hostid", requireAdmin, handleAlbumBackup);

app.post("/api/album/:id/backup2/:hostid", requireAdmin, handleAlbumBackup2);

app.get("/api/album/:id/cover", handleGetAlbumCover);

app.get("/api/songs", handleGetSongs);

app.get("/api/videos", handleGetVideos);
app.get("/api/video/:id", handleGetVideo);
app.get("/api/video/:id/cover", handleGetVideoCover);
app.get("/api/lyrics/:mediaType/:mediaId", handleGetLyrics);

app.get("/api/song/:id", handleGetSong);

app.get("/api/stream/:id", handleDeprecatedStream);

app.get("/api/part/:id/:fileName", requirePaidMedia, handleGetPart);

app.get("/api/stream/audio/:id", requirePaidMedia, handleStreamAudio);

app.get("/api/stream/video/:id", requirePaidMedia, handleStreamVideo);

app.get("/api/stream/direct/audio/:id", requirePaidMedia, handleDirectStreamAudioManifest);

app.get("/api/stream/direct/video/:id", requirePaidMedia, handleDirectStreamVideoManifest);

app.get("/api/song/:id/cover", handleGetSongCover);

app.get("/api/artist/:name/image", handleGetArtistImage);

app.get("/api/artist/:name/top-tracks", handleGetArtistTopTracks);
app.get("/api/artist/:name/videos", handleGetArtistVideos);

app.get("/api/search", handleSearch);

app.get("/api/radio/state", handleGetRadioState);
app.get("/api/radio/events", handleRadioEvents);
app.get("/api/radio/direct/:slotId", handleRadioDirectStreamManifest);
app.get("/api/radio/stream/:slotId", handleRadioStream);
app.post("/api/radio/queue", requirePaidMedia, handleAddRadioQueueItem);
app.post("/api/radio/listeners/heartbeat", handleRadioListenerHeartbeat);
app.delete("/api/radio/listeners/:clientId", handleRemoveRadioListener);

// Playlist routes
app.get("/api/playlists", requireAuthenticated, handleListPlaylists);
app.post("/api/playlists", requireAuthenticated, handleCreatePlaylist);
app.get("/api/playlist/:id", requireAuthenticated, handleGetPlaylist);
app.put("/api/playlist/:id", requireAuthenticated, handleUpdatePlaylist);
app.delete("/api/playlist/:id", requireAuthenticated, handleDeletePlaylist);
app.post("/api/playlist/:id/songs", requireAuthenticated, handleAddSongsToPlaylist);
app.delete(
  "/api/playlist/:id/songs/:songId",
  requireAuthenticated,
  handleRemoveSongFromPlaylist
);
app.post("/api/playlist/:id/items", requireAuthenticated, handleAddItemsToPlaylist);
app.delete(
  "/api/playlist/:id/items/:itemId",
  requireAuthenticated,
  handleRemoveItemFromPlaylist
);

function handleCatchAll(_req, res) {
  res.sendFile(path.join(staticPath, "index.html"));
}

app.get("/*", handleCatchAll);

export async function initializeBackend(): Promise<void> {
  if (!backendInitPromise) {
    backendInitPromise = (async () => {
      const log = createLogger("Status");
      await dbClient.connect();
      log.info("DB connected");
      await seedFirstAdmin();
      if (webdavServer) {
        await webdavServer.init();
        log.info("Webdav served at /webdav");
      } else {
        log.info("Webdav disabled on this deployment runtime");
      }
    })().catch((error) => {
      backendInitPromise = null;
      throw error;
    });
  }

  return backendInitPromise;
}

export async function startServer(port: number): Promise<http.Server> {
  const log = createLogger("Status");
  await initializeBackend();

  return app.listen(port, () => log.info(`Stream server listening on port ${port}!`));
}
