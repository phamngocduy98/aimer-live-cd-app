import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import { hashPassword } from "../../apps/backend/src/services/authService.js";

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
  videoYoutube: new Types.ObjectId("665000000000000000000302"),
  adminUser: new Types.ObjectId("665000000000000000000501"),
  paidUser: new Types.ObjectId("665000000000000000000502"),
  freeUser: new Types.ObjectId("665000000000000000000503"),
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
    db.collection("hostings").deleteMany({}),
    db.collection("lyrics").deleteMany({}),
    db.collection("users").deleteMany({})
  ]);

  const [adminPassword, paidPassword, freePassword] = await Promise.all([
    hashPassword("admin-password"),
    hashPassword("paid-password"),
    hashPassword("free-password")
  ]);

  await db.collection("users").insertMany([
    {
      _id: testIds.adminUser,
      username: "admin",
      displayName: "E2E Admin",
      passwordHash: adminPassword.hash,
      passwordSalt: adminPassword.salt,
      role: "admin",
      enabled: true,
      subscription: { plan: "admin", status: "active" },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: testIds.paidUser,
      username: "paid",
      displayName: "E2E Paid",
      passwordHash: paidPassword.hash,
      passwordSalt: paidPassword.salt,
      role: "member",
      enabled: true,
      subscription: { plan: "plus", status: "active" },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: testIds.freeUser,
      username: "free",
      displayName: "E2E Free",
      passwordHash: freePassword.hash,
      passwordSalt: freePassword.salt,
      role: "member",
      enabled: true,
      subscription: { plan: "free", status: "none" },
      createdAt: new Date(),
      updatedAt: new Date()
    }
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
      trackList: [testIds.songOne, testIds.songTwo]
    },
    {
      _id: testIds.albumBeta,
      cover: tinyPng,
      title: "E2E Album Beta",
      artist: "E2E Artist",
      genre: ["E2E"],
      year: 2025,
      trackList: [testIds.songThree]
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
    cover: tinyPng,
    title: "E2E Video One",
    artist: ["E2E Artist"],
    genre: ["E2E Live"],
    year: 2026,
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
    iv: "00000000000000000000000000000000"
  });

  await db.collection("videos").insertOne({
    _id: testIds.videoYoutube,
    cover: tinyPng,
    title: "E2E YouTube Video",
    artist: ["E2E Channel"],
    genre: ["E2E"],
    year: 2026,
    size: 0,
    duration: 10,
    videoWidth: 1280,
    videoHeight: 720,
    videoCodecRaw: "youtube",
    audioLossless: false,
    audioSampleRate: 0,
    audioBitsPerSample: 0,
    audioCodecRaw: "",
    format: "youtube",
    bitrate: 0,
    fileExtension: "mp4",
    hostingList: [],
    fileCount: 0,
    youtubeUrl: "https://www.youtube.com/watch?v=e2e-youtube",
    chapters: [{ time: 0, title: "E2E YouTube Video", subTitle: "" }],
    iv: "00000000000000000000000000000000"
  });

  await db.collection("lyrics").insertMany([
    {
      mediaType: "audio",
      mediaId: testIds.songOne,
      rows: [
        {
          startMs: 0,
          endMs: 2500,
          ja: "最初の歌詞",
          romaji: "Saisho no kashi",
          en: "The first lyric",
          vi: "Lời đầu tiên"
        },
        {
          startMs: 2500,
          endMs: 5000,
          ja: "次の歌詞",
          romaji: "Tsugi no kashi",
          en: "The next lyric",
          vi: "Lời tiếp theo"
        }
      ],
      provenance: {
        ja: { source: "manual-srt", generatedAt: new Date("2026-01-01") },
        romaji: { source: "kuroshiro", generatedAt: new Date("2026-01-01") },
        en: { source: "mymemory", generatedAt: new Date("2026-01-01") },
        vi: { source: "mymemory", generatedAt: new Date("2026-01-01") }
      }
    },
    {
      mediaType: "video",
      mediaId: testIds.videoOne,
      rows: [
        {
          startMs: 0,
          endMs: 12000,
          ja: "映像の歌詞",
          romaji: "Eizou no kashi",
          en: "Video lyric",
          vi: "Lời video"
        }
      ],
      provenance: {
        ja: { source: "manual-srt", generatedAt: new Date("2026-01-01") },
        romaji: { source: "kuroshiro", generatedAt: new Date("2026-01-01") },
        en: { source: "mymemory", generatedAt: new Date("2026-01-01") },
        vi: { source: "mymemory", generatedAt: new Date("2026-01-01") }
      }
    }
  ]);

  await db.collection("playlists").insertOne({
    _id: testIds.playlistSeed,
    name: "E2E Playlist Seed",
    description: "Seeded playlist for E2E",
    songs: [testIds.songOne, testIds.songTwo]
  });

  await mongoose.disconnect();
}
