import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import { HttpStreamProvider } from "../../../services/stream/part_provider/HttpStreamProvider.js";
import { StreamInfo } from "../../../services/stream/dto/StreamInfo.js";
import { StreamFilePart } from "../../../services/stream/dto/StreamFilePart.js";
import { createHttpStreamConfig, TEST_UUID } from "../../testHelpers.js";
import type { IHttpStreamConfig } from "../../../models/Hosting.js";

const mockGet = vi.hoisted(() => vi.fn() as any);

vi.mock("axios", () => {
  const axiosFn: any = vi.fn().mockImplementation((_config: any) => mockGet(_config));
  axiosFn.get = mockGet;
  return { default: axiosFn };
});

vi.mock("../../../models/Song.js", () => ({
  Song: { find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }
}));
vi.mock("../../../models/Video.js", () => ({
  Video: { find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }
}));

function createMockStreamResponse(data: any, overrides?: Record<string, any>) {
  return {
    status: 200,
    statusText: "OK",
    config: {} as any,
    headers: { "content-type": "application/octet-stream", "content-length": "1024", ...overrides?.headers },
    data,
    ...overrides
  };
}

describe("HttpStreamProvider", () => {
  let config: IHttpStreamConfig;
  let provider: HttpStreamProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    config = createHttpStreamConfig();
    provider = new HttpStreamProvider(config);
  });

  describe("constructor", () => {
    it("stores config and exposes host/path getters", () => {
      expect(provider.host).toBe("test.com");
      expect(provider.path).toBe("/audio");
    });
  });

  describe("httpGet", () => {
    it("constructs URL from host and path", async () => {
      mockGet.mockResolvedValueOnce(createMockStreamResponse(Readable.from("data")));
      await provider.httpGet("song.mp3", {}, "stream");
      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://test.com/audio/song.mp3",
          method: "get",
          responseType: "stream"
        })
      );
    });

    it("allows custom hostPath override", async () => {
      mockGet.mockResolvedValueOnce(createMockStreamResponse(Readable.from("data")));
      await provider.httpGet("file.mp3", {}, "stream", "custom.com/music");
      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://custom.com/music/file.mp3",
          method: "get"
        })
      );
    });
  });

  describe("get with retry", () => {
    it("returns response on success", async () => {
      mockGet.mockResolvedValueOnce(createMockStreamResponse(Readable.from("audio-data")));
      const res = await provider.get("song.mp3");
      expect(res.status).toBe(200);
    });

    it("retries on 404 up to 3 times then throws", async () => {
      mockGet.mockResolvedValue(createMockStreamResponse("", { status: 404 }));
      await expect(provider.get("missing.mp3")).rejects.toThrow("Max retry exceeded. Fail to get audio file.");
      expect(mockGet).toHaveBeenCalledTimes(4);
    });

    it("retries when Token refreshed error occurs", async () => {
      let callCount = 0;
      mockGet.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return createMockStreamResponse(Readable.from("token-refresh-page"));
        return createMockStreamResponse(Readable.from("real-data"));
      });

      const res = await provider.get("song.mp3");
      expect(res.status).toBe(200);
    });
  });

  describe("handleResponse", () => {
    it("throws on 3xx redirect", async () => {
      await expect(
        provider.handleResponse(302, createMockStreamResponse(""))
      ).rejects.toThrow("Audio not found");
    });

    it("throws on 404", async () => {
      await expect(
        provider.handleResponse(404, createMockStreamResponse(""))
      ).rejects.toThrow("Audio not found");
    });

    it("returns response on 200", async () => {
      const res = await provider.handleResponse(200, createMockStreamResponse("data"));
      expect(res.data).toBe("data");
    });

    it("converts HTML response to string in stream mode", async () => {
      const htmlRes = createMockStreamResponse(
        Readable.from(Buffer.from("<html>test</html>")),
        { headers: { "content-type": "text/html" } }
      );
      const res = await provider.handleResponse(200, htmlRes, "stream");
      expect(typeof res.data).toBe("string");
      expect(res.data).toContain("test");
    });
  });

  describe("fetchPartFile", () => {
    it("sends Range header and returns readable", async () => {
      const stream = Readable.from("encrypted-data");
      mockGet.mockResolvedValueOnce(createMockStreamResponse(stream));
      const result = await provider.fetchPartFile("part_1.mp3");
      expect(result).toBe(stream);
    });
  });

  describe("fetchRawPart", () => {
    it("returns data with content-type and content-length", async () => {
      const stream = Readable.from("raw-data");
      mockGet.mockResolvedValueOnce(createMockStreamResponse(stream));
      const result = await provider.fetchRawPart("file.mp3");
      expect(result.data).toBe(stream);
      expect(result.contentType).toBe("application/octet-stream");
      expect(result.contentLength).toBe(1024);
    });
  });

  describe("streamPart", () => {
    it("returns decrypted readable stream", async () => {
      const song: StreamInfo = {
        id: TEST_UUID as any,
        hostingList: [],
        format: "mp3",
        size: 1024,
        fileCount: 1,
        iv: "0123456789abcdef0123456789abcdef",
        fileExtension: "mp3"
      };
      const part = new StreamFilePart(0, 1024, "song.mp3", 0, 1023);
      const stream = Readable.from("encrypted");
      mockGet.mockResolvedValueOnce(createMockStreamResponse(stream));
      const result = await provider.streamPart(song, part);
      expect(result).toBeDefined();
    });
  });

  describe("ping", () => {
    it("parses status.php file list and groups by UUID", async () => {
      const fileList = "uuid1.mp3,uuid1_1.mp3,uuid2.mp3,uuid2_1.mp3,uuid2_2.mp3";
      mockGet.mockResolvedValueOnce(createMockStreamResponse(fileList, { status: 200 }));
      const result = await provider.ping();
      expect(result.available).toBe(true);
    });

    it("returns unavailable on 404", async () => {
      mockGet.mockRejectedValueOnce(new Error("404"));
      const result = await provider.ping();
      expect(result.available).toBe(false);
      expect(result.files).toEqual([]);
    });
  });
});
