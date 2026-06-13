import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import http from "node:http";
import multer from "multer";
import path from "node:path";
import { v2 as webdav } from "webdav-server";
import pinoHttp from "pino-http";

import { dbClient } from "./db/Mongo.js";
import { WebdavServer } from "./webdav/webdav.js";
import { createLogger, getRootLogger, requestContext, randomReqId } from "./utils/log.js";

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
  handleGetSong,
  handleGetSongCover,
  handleGetArtistImage,
  handleGetArtistTopTracks,
  handleSearch
} from "./routes/metadata.js";
import { handleDeprecatedStream, handleStreamAudio, handleStreamVideo } from "./routes/stream.js";
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
  handleAdminUpdateVideo
} from "./routes/admin.js";

const rootDir = path.resolve();
const webdavServer = new WebdavServer();

const app = express();
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
app.use(cors());
const staticPath = path.join(rootDir, "src", "client");
createLogger("Status").info(`Serve static at ${staticPath}`);
app.use("/", express.static(staticPath));
app.use(webdav.extensions.express("/webdav", webdavServer.server));

const upload = multer();

app.post("/api/videos/youtube/:albumId?", handleYoutubeVideoUpload);

app.post("/api/upload/:hostId?", upload.single("audio"), handleFileUpload);
app.get("/api/upload-progress/:id", handleUploadProgress);

app.post("/api/upload-album/:hostId?", upload.array("audios"), handleAlbumUpload);

app.post("/api/videos/:videoId/chapters", bodyParser.text({ type: "*/*" }), handleVideoChapters);

app.get("/api/admin/uploads", handleAdminGetUploads);
app.get("/api/admin/songs", handleAdminGetSongs);
app.get("/api/admin/videos", handleAdminGetVideos);
app.get("/api/admin/albums", handleAdminGetAlbums);
app.get("/api/admin/artists", handleAdminGetArtists);
app.get("/api/admin/artists/:name/image", handleAdminGetArtistImage);
app.get("/api/admin/hosts", handleAdminGetHosts);
app.post("/api/admin/hosts", handleAdminCreateHost);
app.put("/api/admin/songs/:id", handleAdminUpdateSong);
app.put("/api/admin/videos/:id", handleAdminUpdateVideo);
app.put("/api/admin/lyrics/:mediaType/:mediaId/tracks", handleAdminSaveLyrics);
app.get("/api/admin/lyrics/providers", handleAdminGetLyricsProviders);
app.post("/api/admin/lyrics/preview-srt", upload.single("subtitle"), handleAdminPreviewSrt);
app.post("/api/admin/lyrics/:mediaType/:mediaId/search", handleAdminSearchLyrics);
app.post("/api/admin/lyrics/:mediaType/:mediaId/import", handleAdminImportLyrics);
app.post("/api/admin/lyrics/romanize", handleAdminRomanizeLyrics);
app.post("/api/admin/lyrics/translate", handleAdminTranslateLyrics);
app.put("/api/admin/albums/:id", handleAdminUpdateAlbum);
app.put("/api/admin/albums/:id/cover", upload.single("cover"), handleAdminUpdateAlbumCover);
app.put("/api/admin/hosts/:id", handleAdminUpdateHost);
app.put("/api/admin/artists/:name", handleAdminRenameArtist);
app.put("/api/admin/artists/:name/image", upload.single("image"), handleAdminUpdateArtistImage);
app.delete("/api/admin/songs/:id", handleAdminDeleteSong);
app.delete("/api/admin/videos/:id", handleAdminDeleteVideo);
app.delete("/api/admin/albums/:id", handleAdminDeleteAlbum);
app.delete("/api/admin/hosts/:id", handleAdminDeleteHost);

app.get("/api/hosts", handleGetHosts);

app.post("/api/hosts", handleCreateHost);

app.delete("/api/hosts/:id", handleDeleteHost);

app.get("/api/hosts/:id/files", handleListHostFiles);

app.get("/api/albums", handleGetAlbums);

app.get("/api/album/:id", handleGetAlbum);

app.get("/api/album/:id/backup", handleGetAlbumBackup);

app.post("/api/album/:id/backup/:hostid", handleAlbumBackup);

app.post("/api/album/:id/backup2/:hostid", handleAlbumBackup2);

app.get("/api/album/:id/cover", handleGetAlbumCover);

app.get("/api/songs", handleGetSongs);

app.get("/api/videos", handleGetVideos);
app.get("/api/lyrics/:mediaType/:mediaId", handleGetLyrics);

app.get("/api/song/:id", handleGetSong);

app.get("/api/stream/:id", handleDeprecatedStream);

app.get("/api/part/:id/:fileName", handleGetPart);

app.get("/api/stream/audio/:id", handleStreamAudio);

app.get("/api/stream/video/:id", handleStreamVideo);

app.get("/api/song/:id/cover", handleGetSongCover);

app.get("/api/artist/:name/image", handleGetArtistImage);

app.get("/api/artist/:name/top-tracks", handleGetArtistTopTracks);

app.get("/api/search", handleSearch);

// Playlist routes
app.get("/api/playlists", handleListPlaylists);
app.post("/api/playlists", handleCreatePlaylist);
app.get("/api/playlist/:id", handleGetPlaylist);
app.put("/api/playlist/:id", handleUpdatePlaylist);
app.delete("/api/playlist/:id", handleDeletePlaylist);
app.post("/api/playlist/:id/songs", handleAddSongsToPlaylist);
app.delete("/api/playlist/:id/songs/:songId", handleRemoveSongFromPlaylist);
app.post("/api/playlist/:id/items", handleAddItemsToPlaylist);
app.delete("/api/playlist/:id/items/:itemId", handleRemoveItemFromPlaylist);

function handleCatchAll(_req, res) {
  res.sendFile(path.join(staticPath, "index.html"));
}

app.get("/*", handleCatchAll);

export async function startServer(port: number): Promise<http.Server> {
  const log = createLogger("Status");
  await dbClient.connect();
  log.info("DB connected");
  await webdavServer.init();
  log.info("Webdav served at /webdav");

  return app.listen(port, () => log.info(`Stream server listening on port ${port}!`));
}
