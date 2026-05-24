import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable, Writable } from "node:stream";
import { SongStream } from "../../../services/stream/SongStream.js";
import { StreamInfo } from "../../../services/stream/dto/StreamInfo.js";
import { createTestHosting, TEST_UUID } from "../../testHelpers.js";
import { getPartProvider } from "../../../services/stream/part-provider/index.js";

vi.mock("../../../services/stream/part-provider/index.js", () => ({
  getPartProvider: vi.fn()
}));

vi.mock("../../../services/stream/StreamCache.js", () => ({
  cache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn().mockReturnValue(
      new Writable({
        write(_chunk: any, _encoding: any, callback: any) {
          callback();
        }
      })
    )
  }
}));

function createSongInfo(overrides?: Partial<StreamInfo>): StreamInfo {
  return {
    id: TEST_UUID as any,
    hostingList: [createTestHosting()],
    format: "mp3",
    size: 1000000,
    fileCount: 3,
    iv: "0123456789abcdef0123456789abcdef",
    fileExtension: "mp3",
    ...overrides
  };
}

describe("SongStream", () => {
  let songStream: SongStream;

  beforeEach(() => {
    vi.clearAllMocks();
    songStream = new SongStream({});
  });

  describe("getParts", () => {
    it("creates a single part for range within one part", () => {
      const files = ["song.mp3", "song_1.mp3"];
      const parts = songStream.getParts(files, 1024, 1500, 0, 500);
      expect(parts.length).toBe(1);
      expect(parts[0].partIndex).toBe(0);
    });

    it("creates multiple parts spanning across boundaries", () => {
      const files = ["song.mp3", "song_1.mp3", "song_2.mp3"];
      const parts = songStream.getParts(files, 100, 300, 0, 299);
      expect(parts.length).toBe(3);
      expect(parts[0].partIndex).toBe(0);
      expect(parts[1].partIndex).toBe(1);
      expect(parts[2].partIndex).toBe(2);
    });

    it("handles partial range in middle parts", () => {
      const files = ["song.mp3", "song_1.mp3", "song_2.mp3"];
      const parts = songStream.getParts(files, 100, 300, 50, 249);
      expect(parts.length).toBe(3);
      expect(parts[0].partIndex).toBe(0);
      expect(parts[0].partByteStart).toBe(50);
      expect(parts[1].partIndex).toBe(1);
      expect(parts[1].partByteStart).toBe(0);
      expect(parts[2].partIndex).toBe(2);
      expect(parts[2].partByteStart).toBe(0);
    });
  });

  describe("streamPart", () => {
    it("fetches part from provider and returns stream", async () => {
      const mockStream = Readable.from("decrypted-data");
      const mockProvider = {
        streamPart: vi.fn().mockResolvedValue(mockStream)
      };
      (getPartProvider as any).mockReturnValue(mockProvider);

      const info = createSongInfo({ fileCount: 1, size: 100 });
      const part = { partIndex: 0, fileName: "song.mp3" } as any;

      const result = await songStream.streamPart(info, part, info.hostingList[0]);
      expect(result).toBe(mockStream);
      expect(mockProvider.streamPart).toHaveBeenCalledWith(info, part);
    });

    it("falls back to next hosting on failure", async () => {
      const hosting1 = createTestHosting({ name: "failing-host" });
      const hosting2 = createTestHosting({ name: "working-host" });

      const failProvider = {
        streamPart: vi.fn().mockRejectedValue(new Error("Host down"))
      };
      const successProvider = {
        streamPart: vi.fn().mockResolvedValue(Readable.from("data"))
      };

      const getPartProviderMock = getPartProvider as any;
      getPartProviderMock.mockReturnValueOnce(failProvider).mockReturnValueOnce(successProvider);

      const info = createSongInfo({ hostingList: [hosting1, hosting2] });
      const part = { partIndex: 0, fileName: "song.mp3" } as any;

      const result = await songStream.streamPart(info, part, hosting1);
      expect(result).toBeDefined();
    });
  });

  describe("stream", () => {
    it("returns 206 metadata with Content-Range", async () => {
      const mockListResult = {
        available: true,
        files: [
          {
            fileName: TEST_UUID,
            partNumbers: [1, 2, 3]
          }
        ]
      };

      const mockProvider = {
        listFiles: vi.fn().mockResolvedValue(mockListResult),
        streamPart: vi.fn().mockResolvedValue(Readable.from("data"))
      };
      (getPartProvider as any).mockReturnValue(mockProvider);

      const info = createSongInfo({ size: 1000000, fileCount: 3 });
      const result = await songStream.stream(info);
      expect(result.metadata.status).toBe(206);
      expect(result.metadata.headers["content-range"]).toBeDefined();
      expect(result.metadata.headers["Accept-Ranges"]).toBe("bytes");
    });

    it("throws 500 when parts fail validation", async () => {
      const mockProvider = {
        listFiles: vi.fn().mockResolvedValue({ available: false, files: [] })
      };
      (getPartProvider as any).mockReturnValue(mockProvider);

      const info = createSongInfo();
      await expect(songStream.stream(info)).rejects.toThrow("File corrupted");
    });
  });
});
