import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMocks = vi.hoisted(() => {
  const mockExec = vi.fn();
  const mockLean = vi.fn(() => ({ exec: mockExec }));
  const mockSort = vi.fn(() => ({ lean: mockLean }));
  const mockLimit = vi.fn(() => ({ sort: mockSort }));
  const mockSkip = vi.fn(() => ({ limit: mockLimit }));
  const mockPopulate = vi.fn(() => ({ skip: mockSkip }));
  const mockFind = vi.fn(() => ({ populate: mockPopulate }));
  const mockAggregate = vi.fn();

  return { mockExec, mockLean, mockSort, mockLimit, mockSkip, mockPopulate, mockFind, mockAggregate };
});

vi.mock("../../models/Song.js", () => ({
  Song: { find: mockMocks.mockFind }
}));

vi.mock("../../models/Video.js", () => ({
  Video: { aggregate: mockMocks.mockAggregate }
}));

import { handleGetSongs, handleGetVideos } from "../../routes/metadata.js";

function createReqRes() {
  const req: any = { query: {} };
  const res: any = { send: vi.fn(), end: vi.fn() };
  return { req, res };
}

const mockSongs = [
  {
    _id: "song1",
    trackNo: 1,
    title: "Song One",
    artist: ["Artist A"],
    duration: 240,
    format: "FLAC",
    lossless: true,
    bitrate: 1411000,
    fileExtension: "flac",
    bitsPerSample: 24,
    sampleRate: 96000,
    size: 25000000,
    album: { _id: "album1", title: "Album One", artist: "Artist A" }
  },
  {
    _id: "song2",
    trackNo: 2,
    title: "Song Two",
    artist: ["Artist A"],
    duration: 200,
    format: "MPEG",
    lossless: false,
    bitrate: 320000,
    fileExtension: "mp3",
    bitsPerSample: null,
    sampleRate: 44100,
    size: 8000000,
    album: { _id: "album1", title: "Album One", artist: "Artist A" }
  }
];

describe("handleGetSongs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses default pagination when no query params provided", async () => {
    mockMocks.mockExec.mockResolvedValue(mockSongs);
    const { req, res } = createReqRes();

    await handleGetSongs(req, res);

    expect(mockMocks.mockFind).toHaveBeenCalledWith({}, { iv: 0, hostingList: 0 });
    expect(mockMocks.mockPopulate).toHaveBeenCalledWith("album", {
      title: 1,
      artist: 1
    });
    expect(mockMocks.mockSkip).toHaveBeenCalledWith(0);
    expect(mockMocks.mockLimit).toHaveBeenCalledWith(50);
    expect(mockMocks.mockSort).toHaveBeenCalledWith({ album: 1, trackNo: 1 });
    expect(res.send).toHaveBeenCalledWith(mockSongs);
    expect(res.end).toHaveBeenCalled();
  });

  it("uses custom page and pageSize when provided", async () => {
    mockMocks.mockExec.mockResolvedValue(mockSongs.slice(0, 1));
    const { req, res } = createReqRes();
    req.query = { page: "2", pageSize: "10" };

    await handleGetSongs(req, res);

    expect(mockMocks.mockSkip).toHaveBeenCalledWith(20);
    expect(mockMocks.mockLimit).toHaveBeenCalledWith(10);
    expect(mockMocks.mockFind).toHaveBeenCalledWith({}, { iv: 0, hostingList: 0 });
    expect(res.send).toHaveBeenCalledWith(mockSongs.slice(0, 1));
    expect(res.end).toHaveBeenCalled();
  });

  it("returns empty array when no songs exist", async () => {
    mockMocks.mockExec.mockResolvedValue([]);
    const { req, res } = createReqRes();

    await handleGetSongs(req, res);

    expect(mockMocks.mockFind).toHaveBeenCalledWith({}, { iv: 0, hostingList: 0 });
    expect(res.send).toHaveBeenCalledWith([]);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns songs with populated album data", async () => {
    mockMocks.mockExec.mockResolvedValue(mockSongs);
    const { req, res } = createReqRes();

    await handleGetSongs(req, res);

    const sentSongs = res.send.mock.calls[0][0];
    expect(sentSongs).toHaveLength(2);
    expect(sentSongs[0]).toHaveProperty("album");
    expect(sentSongs[0].album).toEqual({
      _id: "album1",
      title: "Album One",
      artist: "Artist A"
    });
    expect(sentSongs[0].iv).toBeUndefined();
    expect(sentSongs[0].hostingList).toBeUndefined();
  });

  it("passes correct projection to exclude iv and hostingList", async () => {
    mockMocks.mockExec.mockResolvedValue([mockSongs[0]]);
    const { req, res } = createReqRes();

    await handleGetSongs(req, res);

    expect(mockMocks.mockFind).toHaveBeenCalledWith(
      {},
      { iv: 0, hostingList: 0 }
    );
    expect(res.send).toHaveBeenCalled();
  });
});

const mockVideos = [
  {
    _id: "vid1",
    title: "Video One",
    artist: ["Artist A"],
    duration: 300,
    format: "MPEG",
    videoWidth: 1920,
    videoHeight: 1080,
    bitrate: 5000000,
    fileExtension: "mp4",
    album: { _id: "album1", title: "Album One", artist: "Artist A", year: 2024 }
  },
  {
    _id: "vid2",
    title: "Video Two",
    artist: ["Artist A"],
    duration: 250,
    format: "MPEG",
    videoWidth: 1280,
    videoHeight: 720,
    bitrate: 3000000,
    fileExtension: "mkv",
    album: null
  }
];

describe("handleGetVideos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses default pagination and returns videos via aggregation", async () => {
    mockMocks.mockAggregate.mockResolvedValue(mockVideos);
    const { req, res } = createReqRes();

    await handleGetVideos(req, res);

    expect(mockMocks.mockAggregate).toHaveBeenCalledOnce();
    const pipeline = mockMocks.mockAggregate.mock.calls[0][0];
    expect(pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ $project: { iv: 0, hostingList: 0 } }),
        expect.objectContaining({ $sort: { "album.year": -1, title: 1 } }),
        expect.objectContaining({ $skip: 0 }),
        expect.objectContaining({ $limit: 50 })
      ])
    );
    expect(res.send).toHaveBeenCalledWith(mockVideos);
    expect(res.end).toHaveBeenCalled();
  });

  it("uses custom page and pageSize", async () => {
    mockMocks.mockAggregate.mockResolvedValue([mockVideos[0]]);
    const { req, res } = createReqRes();
    req.query = { page: "2", pageSize: "10" };

    await handleGetVideos(req, res);

    const pipeline = mockMocks.mockAggregate.mock.calls[0][0];
    const skipStage = pipeline.find((s: any) => s.$skip !== undefined);
    const limitStage = pipeline.find((s: any) => s.$limit !== undefined);
    expect(skipStage.$skip).toBe(20);
    expect(limitStage.$limit).toBe(10);
    expect(res.send).toHaveBeenCalledWith([mockVideos[0]]);
  });

  it("returns empty array when no videos exist", async () => {
    mockMocks.mockAggregate.mockResolvedValue([]);
    const { req, res } = createReqRes();

    await handleGetVideos(req, res);

    expect(res.send).toHaveBeenCalledWith([]);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns videos with populated album data", async () => {
    mockMocks.mockAggregate.mockResolvedValue(mockVideos);
    const { req, res } = createReqRes();

    await handleGetVideos(req, res);

    const sentVideos = res.send.mock.calls[0][0];
    expect(sentVideos).toHaveLength(2);
    expect(sentVideos[0]).toHaveProperty("album");
    expect(sentVideos[0].album).toHaveProperty("title", "Album One");
    expect(sentVideos[0].album).toHaveProperty("year", 2024);
    expect(sentVideos[0].iv).toBeUndefined();
    expect(sentVideos[0].hostingList).toBeUndefined();
    expect(sentVideos[1].album).toBeNull();
  });

  it("excludes iv and hostingList from result", async () => {
    mockMocks.mockAggregate.mockResolvedValue([mockVideos[0]]);
    const { req, res } = createReqRes();

    await handleGetVideos(req, res);

    const pipeline = mockMocks.mockAggregate.mock.calls[0][0];
    const projectStage = pipeline.find((s: any) => s.$project !== undefined);
    expect(projectStage.$project).toEqual({ iv: 0, hostingList: 0 });
  });
});
