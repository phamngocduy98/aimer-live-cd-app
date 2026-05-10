import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import { StreamProvider } from "../../../services/stream/part-provider/StreamProvider.js";
import { StreamInfo } from "../../../services/stream/dto/StreamInfo.js";
import { StreamFilePart } from "../../../services/stream/dto/StreamFilePart.js";
import { TEST_UUID } from "../../testHelpers.js";

class ConcreteProvider extends StreamProvider {
  constructor() {
    super({});
  }

  async fetchPartFile(_fileName: string): Promise<any> {
    return Readable.from("encrypted-part-data");
  }

  async fetchRawPart(_fileName: string): Promise<{ data: any }> {
    return { data: Readable.from("raw-encrypted-data") };
  }

  async listFiles(): Promise<any> {
    return { available: true, files: [] };
  }
}

describe("StreamProvider (abstract base)", () => {
  let provider: ConcreteProvider;
  let song: StreamInfo;
  let part: StreamFilePart;

  beforeEach(() => {
    provider = new ConcreteProvider();
    song = {
      id: TEST_UUID as any,
      hostingList: [],
      format: "mp3",
      size: 1024,
      fileCount: 1,
      iv: "0123456789abcdef0123456789abcdef",
      fileExtension: "mp3"
    };
    part = new StreamFilePart(0, 1024, "song.mp3", 0, 1023);
  });

  describe("streamPart", () => {
    it("fetches part file then decrypts", async () => {
      const spy = vi.spyOn(provider, "fetchPartFile");
      const result = await provider.streamPart(song, part);
      expect(spy).toHaveBeenCalledWith("song.mp3");
      expect(result).toBeDefined();
    });
  });

});
