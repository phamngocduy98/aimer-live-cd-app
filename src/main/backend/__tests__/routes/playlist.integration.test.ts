import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";

const mockData = vi.hoisted(() => {
  const playlists = [
    {
      _id: "507f1f77bcf86cd799439011",
      name: "Chill Vibes",
      description: "Relaxing tracks",
      songCount: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439012",
      name: "Workout",
      description: "High energy",
      songCount: 5,
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z"
    }
  ];

  const populatedPlaylist = {
    _id: "507f1f77bcf86cd799439011",
    name: "Chill Vibes",
    description: "Relaxing tracks",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    songs: [
      {
        _id: "507f1f77bcf86cd799439013",
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
        album: { _id: "507f1f77bcf86cd799439014", title: "Best Album", artist: "Aimer" }
      }
    ]
  };

  const mockQueryExec = vi.fn();
  const mockQuery = {
    populate: vi.fn(() => mockQuery),
    lean: vi.fn(() => mockQuery),
    exec: mockQueryExec,
    sort: vi.fn(() => mockQuery),
    limit: vi.fn(() => mockQuery),
    skip: vi.fn(() => mockQuery)
  };

  const mockAggregate = vi.fn();
  const mockFindById = vi.fn(() => mockQuery);
  const mockFindByIdAndUpdate = vi.fn(() => mockQuery);
  const mockFindByIdAndDelete = vi.fn(() => mockQuery);
  const mockUpdateOne = vi.fn(() => mockQuery);

  const mockSave = vi.fn();
  const mockPlaylistCtor = vi.fn().mockImplementation(function () {
    return { save: mockSave, id: "playlist-new-id" };
  });

  return {
    playlists,
    populatedPlaylist,
    mockQueryExec,
    mockQuery,
    mockAggregate,
    mockFindById,
    mockFindByIdAndUpdate,
    mockFindByIdAndDelete,
    mockUpdateOne,
    mockSave,
    mockPlaylistCtor
  };
});

vi.mock("../../models/Playlist.js", () => {
  const Playlist = Object.assign(mockData.mockPlaylistCtor, {
    aggregate: mockData.mockAggregate,
    findById: mockData.mockFindById,
    findByIdAndUpdate: mockData.mockFindByIdAndUpdate,
    findByIdAndDelete: mockData.mockFindByIdAndDelete,
    updateOne: mockData.mockUpdateOne
  });
  return { Playlist };
});

import {
  handleListPlaylists,
  handleCreatePlaylist,
  handleGetPlaylist,
  handleUpdatePlaylist,
  handleDeletePlaylist,
  handleAddSongsToPlaylist,
  handleRemoveSongFromPlaylist
} from "../../routes/playlist.js";

const app = express();
app.use(express.json());

app.get("/api/playlists", handleListPlaylists);
app.post("/api/playlists", handleCreatePlaylist);
app.get("/api/playlist/:id", handleGetPlaylist);
app.put("/api/playlist/:id", handleUpdatePlaylist);
app.delete("/api/playlist/:id", handleDeletePlaylist);
app.post("/api/playlist/:id/songs", handleAddSongsToPlaylist);
app.delete("/api/playlist/:id/songs/:songId", handleRemoveSongFromPlaylist);

describe("GET /api/playlists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responds with 200 and JSON array of playlists", async () => {
    mockData.mockAggregate.mockResolvedValue(mockData.playlists);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlists");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("returns all expected playlist fields", async () => {
    mockData.mockAggregate.mockResolvedValue(mockData.playlists);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlists");

    const pl = res.body[0];
    expect(pl).toHaveProperty("_id");
    expect(pl).toHaveProperty("name", "Chill Vibes");
    expect(pl).toHaveProperty("description", "Relaxing tracks");
    expect(pl).toHaveProperty("songCount", 3);
    expect(pl).toHaveProperty("createdAt");
    expect(pl).toHaveProperty("updatedAt");
  });

  it("includes songCount in aggregation projection", async () => {
    mockData.mockAggregate.mockResolvedValue(mockData.playlists);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/playlists");

    const pipeline = mockData.mockAggregate.mock.calls[0][0];
    const projectStage = pipeline.find((s: any) => s.$project !== undefined);
    expect(projectStage.$project).toHaveProperty("songCount");
    expect(projectStage.$project.songCount).toEqual({ $size: { $ifNull: ["$songs", []] } });
  });

  it("sorts by updatedAt descending", async () => {
    mockData.mockAggregate.mockResolvedValue(mockData.playlists);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/playlists");

    const pipeline = mockData.mockAggregate.mock.calls[0][0];
    const sortStage = pipeline.find((s: any) => s.$sort !== undefined);
    expect(sortStage.$sort).toEqual({ updatedAt: -1 });
  });

  it("returns empty array when no playlists exist", async () => {
    mockData.mockAggregate.mockResolvedValue([]);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlists");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/playlists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a playlist with valid name and returns its ID", async () => {
    mockData.mockSave.mockResolvedValue(undefined);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlists")
      .send({ name: "My Playlist", description: "My description" })
      .set("Content-Type", "application/json");

    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("playlist-new-id");
    expect(mockData.mockPlaylistCtor).toHaveBeenCalledWith({
      name: "My Playlist",
      description: "My description"
    });
    expect(mockData.mockSave).toHaveBeenCalled();
  });

  it("creates a playlist without description", async () => {
    mockData.mockSave.mockResolvedValue(undefined);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlists")
      .send({ name: "Minimal" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(mockData.mockPlaylistCtor).toHaveBeenCalledWith({
      name: "Minimal",
      description: undefined
    });
  });

  it("returns 400 when name is empty", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlists")
      .send({ name: "" })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Name is required");
    expect(mockData.mockPlaylistCtor).not.toHaveBeenCalled();
  });

  it("returns 400 when name is missing", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlists")
      .send({})
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Name is required");
    expect(mockData.mockPlaylistCtor).not.toHaveBeenCalled();
  });
});

describe("GET /api/playlist/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with populated playlist", async () => {
    mockData.mockQueryExec.mockResolvedValue(mockData.populatedPlaylist);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlist/507f1f77bcf86cd799439011");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Chill Vibes");
    expect(res.body).toHaveProperty("songs");
    expect(res.body.songs).toHaveLength(1);
    expect(res.body.songs[0]).toHaveProperty("title", "Brave Shine");
    expect(res.body.songs[0]).toHaveProperty("album");
    expect(res.body.songs[0].album).toHaveProperty("title", "Best Album");
    expect(res.body.songs[0].iv).toBeUndefined();
    expect(res.body.songs[0].hostingList).toBeUndefined();
  });

  it("passes correct projection to findById", async () => {
    mockData.mockQueryExec.mockResolvedValue(mockData.populatedPlaylist);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/playlist/507f1f77bcf86cd799439011");

    expect(mockData.mockFindById).toHaveBeenCalledWith("507f1f77bcf86cd799439011", {
      songs: 1,
      name: 1,
      description: 1,
      createdAt: 1,
      updatedAt: 1
    });
  });

  it("populates songs with correct select and nested album populate", async () => {
    mockData.mockQueryExec.mockResolvedValue(mockData.populatedPlaylist);
    const supertest = await import("supertest");
    await supertest.default(app).get("/api/playlist/507f1f77bcf86cd799439011");

    const populateArgs = (mockData.mockQuery.populate.mock.calls as any[])[0];
    expect(populateArgs[0]).toEqual({
      path: "songs",
      select: { iv: 0, hostingList: 0 },
      populate: { path: "album", select: { title: 1, artist: 1 } }
    });
  });

  it("returns 400 for invalid ID length", async () => {
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlist/short");

    expect(res.body.message).toBe("Invalid request");
    expect(mockData.mockFindById).not.toHaveBeenCalled();
  });

  it("returns 400 when playlist not found", async () => {
    mockData.mockQueryExec.mockResolvedValue(null);
    const supertest = await import("supertest");
    const res = await supertest.default(app).get("/api/playlist/507f1f77bcf86cd799439099");

    expect(res.body.message).toBe("Playlist not found");
  });
});

describe("PUT /api/playlist/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates playlist name", async () => {
    const updatedDoc = { _id: "507f1f77bcf86cd799439011", name: "Updated Name" };
    mockData.mockQueryExec.mockResolvedValue(updatedDoc);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .put("/api/playlist/507f1f77bcf86cd799439011")
      .send({ name: "Updated Name" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(mockData.mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { $set: { name: "Updated Name" } },
      { new: true }
    );
  });

  it("updates playlist description", async () => {
    const updatedDoc = { _id: "507f1f77bcf86cd799439011", description: "New desc" };
    mockData.mockQueryExec.mockResolvedValue(updatedDoc);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .put("/api/playlist/507f1f77bcf86cd799439011")
      .send({ description: "New desc" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(mockData.mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { $set: { description: "New desc" } },
      { new: true }
    );
  });

  it("returns 400 for invalid ID length", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .put("/api/playlist/short")
      .send({ name: "Test" })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Invalid request");
    expect(mockData.mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when playlist not found", async () => {
    mockData.mockQueryExec.mockResolvedValue(null);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .put("/api/playlist/507f1f77bcf86cd799439099")
      .send({ name: "Nope" })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Playlist not found");
  });
});

describe("DELETE /api/playlist/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes playlist successfully", async () => {
    mockData.mockQueryExec.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    const supertest = await import("supertest");
    const res = await supertest.default(app).delete("/api/playlist/507f1f77bcf86cd799439011");

    expect(res.status).toBe(200);
    expect(mockData.mockFindByIdAndDelete).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
  });

  it("returns 400 for invalid ID length", async () => {
    const supertest = await import("supertest");
    const res = await supertest.default(app).delete("/api/playlist/short");

    expect(res.body.message).toBe("Invalid request");
    expect(mockData.mockFindByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 400 when playlist not found", async () => {
    mockData.mockQueryExec.mockResolvedValue(null);
    const supertest = await import("supertest");
    const res = await supertest.default(app).delete("/api/playlist/507f1f77bcf86cd799439099");

    expect(res.body.message).toBe("Playlist not found");
  });
});

describe("POST /api/playlist/:id/songs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds songs to playlist", async () => {
    const doc = { save: vi.fn().mockResolvedValue(undefined), songs: [] as string[] };
    mockData.mockQueryExec.mockResolvedValue(doc);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439011/songs")
      .send({ songIds: ["song1", "song2"] })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(doc.songs).toEqual(["song1", "song2"]);
    expect(doc.save).toHaveBeenCalled();
  });

  it("does not add duplicate songs", async () => {
    const doc = { save: vi.fn().mockResolvedValue(undefined), songs: ["song1"] as string[] };
    mockData.mockQueryExec.mockResolvedValue(doc);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439011/songs")
      .send({ songIds: ["song1", "song2"] })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(doc.songs).toEqual(["song1", "song2"]);
  });

  it("returns 400 for invalid ID length", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/short/songs")
      .send({ songIds: ["song1"] })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Invalid request");
  });

  it("returns 400 when songIds is not an array", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439011/songs")
      .send({ songIds: "not-an-array" })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("songIds array is required");
  });

  it("returns 400 when songIds is empty", async () => {
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439011/songs")
      .send({ songIds: [] })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("songIds array is required");
  });

  it("returns 400 when playlist not found", async () => {
    mockData.mockQueryExec.mockResolvedValue(null);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439099/songs")
      .send({ songIds: ["song1"] })
      .set("Content-Type", "application/json");

    expect(res.body.message).toBe("Playlist not found");
  });

  it("returns 200 when all songs are duplicates", async () => {
    const doc = { save: vi.fn().mockResolvedValue(undefined), songs: ["song1"] as string[] };
    mockData.mockQueryExec.mockResolvedValue(doc);
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .post("/api/playlist/507f1f77bcf86cd799439011/songs")
      .send({ songIds: ["song1"] })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(doc.save).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/playlist/:id/songs/:songId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a song from the playlist", async () => {
    mockData.mockQueryExec.mockResolvedValue({ matchedCount: 1 });
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .delete("/api/playlist/507f1f77bcf86cd799439011/songs/song1");

    expect(res.status).toBe(200);
    expect(mockData.mockUpdateOne).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $pull: { songs: "song1" } }
    );
  });

  it("returns 400 for invalid playlist ID length", async () => {
    const supertest = await import("supertest");
    const res = await supertest.default(app).delete("/api/playlist/short/songs/song1");

    expect(res.body.message).toBe("Invalid request");
    expect(mockData.mockUpdateOne).not.toHaveBeenCalled();
  });

  it("returns 400 when playlist not found", async () => {
    mockData.mockQueryExec.mockResolvedValue({ matchedCount: 0 });
    const supertest = await import("supertest");
    const res = await supertest
      .default(app)
      .delete("/api/playlist/507f1f77bcf86cd799439099/songs/song1");

    expect(res.body.message).toBe("Playlist not found");
  });
});
