import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";

dotenv.config();

export const E2E_DB_NAME = process.env.MONGO_DB_NAME || "musicbtxa_e2e";

export const testIds = {
  host: new Types.ObjectId("665000000000000000000001"),
  albumAlpha: new Types.ObjectId("665000000000000000000101"),
  albumBeta: new Types.ObjectId("665000000000000000000102"),
  songOne: new Types.ObjectId("665000000000000000000201"),
  songTwo: new Types.ObjectId("665000000000000000000202"),
  songThree: new Types.ObjectId("665000000000000000000203"),
  videoOne: new Types.ObjectId("665000000000000000000301"),
  playlistSeed: new Types.ObjectId("665000000000000000000401")
};

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function assertSafeDbName(dbName: string): void {
  if (!/(?:_e2e|_test)$/i.test(dbName)) {
    throw new Error(
      `Refusing to seed unsafe database "${dbName}". Use a name ending with _e2e or _test.`
    );
  }
}

async function connectToTestDatabase(): Promise<void> {
  process.env.MONGO_DB_NAME = E2E_DB_NAME;
  assertSafeDbName(E2E_DB_NAME);

  const dbhost = process.env.MONGO_DB_HOST;
  const dbusername = process.env.MONGO_DB_USER;
  const dbpassword = process.env.MONGO_DB_PW;
  if (!dbhost || !dbusername || !dbpassword) {
    throw new Error("Missing MongoDB env vars for E2E seed");
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(
    `mongodb+srv://${dbusername}:${dbpassword}@${dbhost}/?retryWrites=true&w=majority`,
    { dbName: E2E_DB_NAME }
  );
}

export async function seedE2eDatabase(): Promise<void> {
  await connectToTestDatabase();

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready");

  await Promise.all([
    db.collection("albums").deleteMany({}),
    db.collection("songs").deleteMany({}),
    db.collection("videos").deleteMany({}),
    db.collection("playlists").deleteMany({}),
    db.collection("hostings").deleteMany({})
  ]);

  await db.collection("hostings").insertOne({
    _id: testIds.host,
    name: "E2E Fixture Host",
    provider: "infinityfree.net",
    upload: {
      type: "ftp",
      ftpCredential: {
        host: "127.0.0.1",
        user: "e2e",
        password: "encrypted-placeholder",
        port: 21
      },
      ftpRoot: "/htdocs",
      path: "/audio",
      ftpLimit: 1024 * 1024,
      ftpExt: []
    },
    stream: {
      type: "http",
      host: "127.0.0.1",
      path: "/audio",
      partSize: 1024 * 1024
    }
  });

  await db.collection("albums").insertMany([
    {
      _id: testIds.albumAlpha,
      cover: tinyPng,
      title: "E2E Album Alpha",
      artist: "E2E Artist",
      genre: ["E2E"],
      year: 2026,
      trackList: [testIds.songOne, testIds.songTwo],
      videoList: [testIds.videoOne]
    },
    {
      _id: testIds.albumBeta,
      cover: tinyPng,
      title: "E2E Album Beta",
      artist: "E2E Artist",
      genre: ["E2E"],
      year: 2025,
      trackList: [testIds.songThree],
      videoList: []
    }
  ]);

  await db.collection("songs").insertMany([
    {
      _id: testIds.songOne,
      trackNo: 1,
      title: "E2E Song One",
      artist: ["E2E Artist"],
      size: 44100,
      duration: 5,
      format: "MPEG",
      lossless: false,
      bitrate: 128000,
      sampleRate: 44100,
      fileExtension: "wav",
      hostingList: [testIds.host],
      fileCount: 1,
      album: testIds.albumAlpha,
      iv: "00000000000000000000000000000000"
    },
    {
      _id: testIds.songTwo,
      trackNo: 2,
      title: "E2E Song Two",
      artist: ["E2E Artist"],
      size: 44100,
      duration: 6,
      format: "MPEG",
      lossless: false,
      bitrate: 128000,
      sampleRate: 44100,
      fileExtension: "wav",
      hostingList: [testIds.host],
      fileCount: 1,
      album: testIds.albumAlpha,
      iv: "00000000000000000000000000000000"
    },
    {
      _id: testIds.songThree,
      trackNo: 1,
      title: "E2E Search Ballad",
      artist: ["E2E Guest"],
      size: 44100,
      duration: 7,
      format: "FLAC",
      lossless: true,
      bitrate: 768000,
      bitsPerSample: 24,
      sampleRate: 96000,
      fileExtension: "flac",
      hostingList: [testIds.host],
      fileCount: 1,
      album: testIds.albumBeta,
      iv: "00000000000000000000000000000000"
    }
  ]);

  await db.collection("videos").insertOne({
    _id: testIds.videoOne,
    title: "E2E Video One",
    artist: ["E2E Artist"],
    size: 4096,
    duration: 12,
    videoWidth: 640,
    videoHeight: 360,
    videoCodecRaw: "h264",
    audioLossless: false,
    audioSampleRate: 44100,
    audioBitsPerSample: 16,
    audioCodecRaw: "aac",
    format: "MP4",
    bitrate: 256000,
    fileExtension: "mp4",
    hostingList: [testIds.host],
    fileCount: 1,
    chapters: [
      { time: 0, title: "E2E Intro", subTitle: "Opening" },
      { time: 5, title: "E2E Chorus", subTitle: "Main part" }
    ],
    album: testIds.albumAlpha,
    iv: "00000000000000000000000000000000"
  });

  await db.collection("playlists").insertOne({
    _id: testIds.playlistSeed,
    name: "E2E Playlist Seed",
    description: "Seeded playlist for E2E",
    songs: [testIds.songOne, testIds.songTwo]
  });

  await mongoose.disconnect();
}
