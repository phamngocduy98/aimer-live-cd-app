import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";

const mockVideoData = vi.hoisted(() => {
  const videos = [
    {
      _id: "507f1f77bcf86cd799439021",
      title: "Brave Shine (Live)",
      artist: ["Aimer"],
      duration: 320,
      format: "MPEG",
      videoWidth: 1920,
      videoHeight: 1080,
      bitrate: 6000000,
      fileExtension: "mp4",
      album: {
        _id: "507f1f77bcf86cd799439012",
        title: "Best Album",
        artist: "Aimer",
        year: 2024
      }
    },
    {
      _id: "507f1f77bcf86cd799439022",
      title: "Ref:rain (Live)",
      artist: ["Aimer"],
      duration: 340,
      format: "MPEG",
      videoWidth: 1280,
      videoHeight: 720,
      bitrate: 4000000,
      fileExtension: "mkv",
      album: {
        _id: "507f1f77bcf86cd799439012",
        title: "Best Album",
        artist: "Aimer",
        year: 2024
      }
    }
  ];

  const mockAggregate = vi.fn();

  return { videos, mockAggregate };
});

vi.mock("../../models/Video.js", () => ({
  Video: { aggregate: mockVideoData.mockAggregate }
}));

import { handleGetVideos } from "../../routes/metadata.js";

const app = express();
app.get("/api/videos", handleGetVideos);

describe("GET /api/videos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responds with 200 and JSON array of videos", async () => {
    mockVideoData.mockAggregate.mockResolvedValue(mockVideoData.videos);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/videos");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("returns all expected video fields", async () => {
    mockVideoData.mockAggregate.mockResolvedValue(mockVideoData.videos);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/videos");

    const video = res.body[0];
    expect(video).toHaveProperty("_id");
    expect(video).toHaveProperty("title", "Brave Shine (Live)");
    expect(video).toHaveProperty("artist", ["Aimer"]);
    expect(video).toHaveProperty("duration", 320);
    expect(video).toHaveProperty("format", "MPEG");
    expect(video).toHaveProperty("album");
    expect(video.album).toHaveProperty("title", "Best Album");
  });

  it("returns correct aggregation pipeline structure", async () => {
    mockVideoData.mockAggregate.mockResolvedValue(mockVideoData.videos);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/videos");

    expect(mockVideoData.mockAggregate).toHaveBeenCalledOnce();
    const pipeline = mockVideoData.mockAggregate.mock.calls[0][0];
    expect(pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ $project: { iv: 0, hostingList: 0 } }),
        expect.objectContaining({ $sort: { "album.year": -1, title: 1 } })
      ])
    );
  });

  it("respects page and pageSize query params", async () => {
    mockVideoData.mockAggregate.mockResolvedValue([mockVideoData.videos[0]]);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/videos?page=1&pageSize=1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe("507f1f77bcf86cd799439021");
  });

  it("returns empty array when no videos exist", async () => {
    mockVideoData.mockAggregate.mockResolvedValue([]);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/videos");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
