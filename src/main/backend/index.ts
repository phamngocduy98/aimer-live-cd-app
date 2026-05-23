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
  handleGetSong,
  handleGetSongCover,
  handleGetArtistTopTracks
} from "./routes/metadata.js";
import { handleDeprecatedStream, handleStreamAudio, handleStreamVideo } from "./routes/stream.js";
import {
  handleYoutubeVideoUpload,
  handleFileUpload,
  handleAlbumUpload,
  handleVideoChapters,
  handleGetPart,
  handleAlbumBackup,
  handleAlbumBackup2
} from "./routes/upload.js";

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

app.post("/api/upload-album/:hostId?", upload.array("audios"), handleAlbumUpload);

app.post("/api/videos/:videoId/chapters", bodyParser.text({ type: "*/*" }), handleVideoChapters);

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

app.get("/api/song/:id", handleGetSong);

app.get("/api/stream/:id", handleDeprecatedStream);

app.get("/api/part/:id/:fileName", handleGetPart);

app.get("/api/stream/audio/:id", handleStreamAudio);

app.get("/api/stream/video/:id", handleStreamVideo);

app.get("/api/song/:id/cover", handleGetSongCover);

app.get("/api/artist/:name/top-tracks", handleGetArtistTopTracks);

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
