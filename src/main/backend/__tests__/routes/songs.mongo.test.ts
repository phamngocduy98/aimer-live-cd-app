import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import express from "express";

import dotenv from "dotenv";
dotenv.config();

import { handleGetSongs } from "../../routes/metadata.js";
import { Album } from "../../models/Album.js";
import { Song } from "../../models/Song.js";

const TEST_DB_NAME = "musicbtxa_test";

const app = express();
app.get("/api/songs", handleGetSongs);

describe("GET /api/songs with real MongoDB - projection reproduction", () => {
  beforeAll(async () => {
    const uri = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PW}@${process.env.MONGO_DB_HOST}/?retryWrites=true&w=majority`;
    await mongoose.connect(uri, { dbName: TEST_DB_NAME });

    const album = await Album.create({
      title: "Test Album",
      artist: "Test Artist",
      genre: ["Test"],
      year: 2024,
      trackList: [],
      videoList: []
    });

    await Song.create([
      {
        trackNo: 1,
        title: "Test Song 1",
        artist: ["Test Artist"],
        size: 1000,
        duration: 200,
        format: "FLAC",
        lossless: true,
        bitrate: 1411000,
        fileExtension: "flac",
        fileCount: 1,
        album: album._id,
        iv: "test-iv-1234567890abcdef"
      },
      {
        trackNo: 2,
        title: "Test Song 2",
        artist: ["Test Artist"],
        size: 2000,
        duration: 250,
        format: "MPEG",
        lossless: false,
        bitrate: 320000,
        fileExtension: "mp3",
        fileCount: 1,
        album: album._id,
        iv: "test-iv-1234567890abcdef"
      }
    ]);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropCollection("songs");
      await mongoose.connection.dropCollection("albums");
      await mongoose.disconnect();
    }
  }, 30000);

  it("returns songs with populated album data (no mixed projection error)", async () => {
    const req = { query: { page: "0", pageSize: "50" } } as any;
    const sentData: any[] = [];
    const res = {
      send: (data: any) => { sentData.push(...data); },
      end: () => {}
    } as any;

    await handleGetSongs(req, res);

    expect(sentData).toHaveLength(2);
    expect(sentData[0]).toHaveProperty("title", "Test Song 1");
    expect(sentData[0]).toHaveProperty("artist", ["Test Artist"]);
    expect(sentData[0].album).toBeDefined();
    expect(sentData[0].album).toHaveProperty("title", "Test Album");
    expect(sentData[0].album).toHaveProperty("artist", "Test Artist");
    // Sensitive fields must be excluded
    expect(sentData[0].iv).toBeUndefined();
    expect(sentData[0].hostingList).toBeUndefined();
  });
});
