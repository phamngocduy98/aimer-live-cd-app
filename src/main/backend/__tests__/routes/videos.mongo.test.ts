import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import express from "express";

import dotenv from "dotenv";
dotenv.config();

import { handleGetVideos } from "../../routes/metadata.js";
import { Album } from "../../models/Album.js";
import { Video } from "../../models/Video.js";

const TEST_DB_NAME = "musicbtxa_test_videos";

const app = express();
app.get("/api/videos", handleGetVideos);

describe("GET /api/videos with real MongoDB", () => {
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

    await Video.create([
      {
        title: "Test Video 1",
        artist: ["Test Artist"],
        size: 50000000,
        duration: 300,
        videoWidth: 1920,
        videoHeight: 1080,
        videoCodecRaw: "h264",
        audioLossless: false,
        audioSampleRate: 48000,
        audioBitsPerSample: 16,
        audioCodecRaw: "aac",
        fileExtension: "mp4",
        format: "MPEG",
        bitrate: 6000000,
        fileCount: 1,
        chapters: [],
        album: album._id,
        iv: "test-iv-video-123456"
      },
      {
        title: "Test Video 2",
        artist: ["Test Artist"],
        size: 30000000,
        duration: 200,
        videoWidth: 1280,
        videoHeight: 720,
        videoCodecRaw: "h264",
        audioLossless: false,
        audioSampleRate: 48000,
        audioBitsPerSample: 16,
        audioCodecRaw: "aac",
        fileExtension: "mkv",
        format: "MPEG",
        bitrate: 4000000,
        fileCount: 1,
        chapters: [],
        album: album._id,
        iv: "test-iv-video-123456"
      }
    ]);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropCollection("videos");
      await mongoose.connection.dropCollection("albums");
      await mongoose.disconnect();
    }
  }, 30000);

  it("returns videos with populated album data and no sensitive fields", async () => {
    const req = { query: { page: "0", pageSize: "50" } } as any;
    const sentData: any[] = [];
    const res = {
      send: (data: any) => { sentData.push(...data); },
      end: () => {}
    } as any;

    await handleGetVideos(req, res);

    expect(sentData).toHaveLength(2);
    expect(sentData[0]).toHaveProperty("title", "Test Video 1");
    expect(sentData[0]).toHaveProperty("artist", ["Test Artist"]);
    expect(sentData[0].album).toBeDefined();
    expect(sentData[0].album).toHaveProperty("title", "Test Album");
    expect(sentData[0].album).toHaveProperty("artist", "Test Artist");
    expect(sentData[0].album).toHaveProperty("year", 2024);
    expect(sentData[0].iv).toBeUndefined();
    expect(sentData[0].hostingList).toBeUndefined();
  });
});
