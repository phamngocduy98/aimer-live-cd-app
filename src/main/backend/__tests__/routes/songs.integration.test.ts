import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";

const mockSongData = vi.hoisted(() => {
  const songs = [
    {
      _id: "507f1f77bcf86cd799439011",
      trackNo: 1,
      title: "Brave Shine",
      artist: ["Aimer"],
      duration: 290,
      format: "FLAC",
      lossless: true,
      bitrate: 1411000,
      fileExtension: "flac",
      bitsPerSample: 24,
      sampleRate: 96000,
      size: 42000000,
      album: {
        _id: "507f1f77bcf86cd799439012",
        title: "Best Album",
        artist: "Aimer"
      }
    },
    {
      _id: "507f1f77bcf86cd799439013",
      trackNo: 2,
      title: "Ref:rain",
      artist: ["Aimer"],
      duration: 305,
      format: "MPEG",
      lossless: false,
      bitrate: 320000,
      fileExtension: "mp3",
      bitsPerSample: null,
      sampleRate: 44100,
      size: 12000000,
      album: {
        _id: "507f1f77bcf86cd799439012",
        title: "Best Album",
        artist: "Aimer"
      }
    }
  ];

  const mockExec = vi.fn();
  const mockLean = vi.fn(() => ({ exec: mockExec }));
  const mockSort = vi.fn(() => ({ lean: mockLean }));
  const mockLimit = vi.fn(() => ({ sort: mockSort }));
  const mockSkip = vi.fn(() => ({ limit: mockLimit }));
  const mockPopulate = vi.fn(() => ({ skip: mockSkip }));
  const mockFind = vi.fn(() => ({ populate: mockPopulate }));

  return { songs, mockExec, mockFind };
});

vi.mock("../../models/Song.js", () => ({
  Song: { find: mockSongData.mockFind }
}));

import { handleGetSongs } from "../../routes/metadata.js";

const app = express();
app.get("/api/songs", handleGetSongs);

describe("GET /api/songs", () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it("responds with 200 and JSON array of songs", async () => {
    mockSongData.mockExec.mockResolvedValue(mockSongData.songs);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/songs");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("returns all expected song fields", async () => {
    mockSongData.mockExec.mockResolvedValue(mockSongData.songs);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/songs");

    const song = res.body[0];
    expect(song).toHaveProperty("_id");
    expect(song).toHaveProperty("title", "Brave Shine");
    expect(song).toHaveProperty("artist", ["Aimer"]);
    expect(song).toHaveProperty("duration", 290);
    expect(song).toHaveProperty("format", "FLAC");
    expect(song).toHaveProperty("album");
    expect(song.album).toHaveProperty("title", "Best Album");
  });

  it("passes correct projection to populate and find", async () => {
    mockSongData.mockExec.mockResolvedValue(mockSongData.songs);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/songs");

    expect(mockSongData.mockFind).toHaveBeenCalledWith({}, { iv: 0, hostingList: 0 });
    // populate should only use inclusion fields, no mixed projections
    const populateArgs = mockSongData.mockFind.mock.results[0].value.populate.mock.calls[0];
    expect(populateArgs[0]).toBe("album");
    expect(populateArgs[1]).toEqual({ title: 1, artist: 1 });
    // Must NOT contain exclusion fields that would conflict
    expect(populateArgs[1].trackList).toBeUndefined();
    expect(populateArgs[1].videoList).toBeUndefined();
  });

  it("respects page and pageSize query params", async () => {
    mockSongData.mockExec.mockResolvedValue([mockSongData.songs[0]]);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/songs?page=1&pageSize=1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe("507f1f77bcf86cd799439011");
  });

  it("returns empty array when no songs exist", async () => {
    mockSongData.mockExec.mockResolvedValue([]);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/songs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
