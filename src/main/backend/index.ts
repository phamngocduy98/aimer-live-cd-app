import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import path from "node:path";
import { v2 as webdav } from "webdav-server";

import { dbClient } from "./db/Mongo.js";
import { WebdavServer } from "./webdav/webdav.js";

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

const __dirname = path.resolve();
const webdavServer = new WebdavServer();

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
const staticPath = path.join(__dirname, "src", "client");
console.log(`[ ${"Serve static".padStart(15)} ] ${staticPath}`);
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

export async function startServer(port: number): Promise<void> {
  await dbClient.connect();
  console.log(`[ ${"Status".padStart(15)} ] DB connected`);
  await webdavServer.init();
  console.log(`[ ${"Status".padStart(15)} ] Webdav served at /webdav`);

  app.listen(port, () =>
    console.log(`[ ${"Status".padStart(15)} ] Stream server listening on port ${port}!`)
  );
}
