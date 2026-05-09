import { describe, it, expect, vi, beforeEach } from "vitest";
import { FtpMediaUploader } from "../../../services/mediaUpload/FtpMediaUploader.js";
import { createFtpUploadConfig } from "../../testHelpers.js";

const MockMyFtp = vi.hoisted(() => {
  return class {
    connect = vi.fn().mockResolvedValue(undefined);
    put = vi.fn().mockResolvedValue(undefined);
    end = vi.fn().mockResolvedValue(undefined);
  };
});

vi.mock("../../../services/mediaUpload/MyFtp.js", () => ({ MyFtp: MockMyFtp }));

describe("FtpMediaUploader", () => {
  let uploader: FtpMediaUploader;

  beforeEach(() => {
    uploader = new FtpMediaUploader();
  });

  describe("init", () => {
    it("connects FTP with config credentials", async () => {
      const config = createFtpUploadConfig();
      await uploader.init(config);
      expect(uploader.ftpClient).not.toBeNull();
      expect(uploader.ftpRoot).toBe(config.ftpRoot);
      expect(uploader.path).toBe(config.path);
      expect(uploader.uploadLimit).toBe(config.ftpLimit);
    });

    it("throws for non-FTP config", async () => {
      const badConfig = { type: "mega_api", apiKey: "x" } as any;
      await expect(uploader.init(badConfig)).rejects.toThrow(
        "FtpMediaUploader requires FTP upload config"
      );
    });
  });

  describe("uploadFile", () => {
    beforeEach(async () => {
      await uploader.init(createFtpUploadConfig());
    });

    it("uploads buffer to correct FTP path", async () => {
      const buffer = Buffer.from("test-data");
      const name = await uploader.uploadFile(buffer, () => "song.mp3");
      expect(name).toBe("song.mp3");
      expect(uploader.ftpClient!.put).toHaveBeenCalled();
    });

    it("retries on Forbidden filename error", async () => {
      const mockPut = vi
        .fn()
        .mockRejectedValueOnce(new Error("Forbidden filename"))
        .mockResolvedValueOnce(undefined);
      (uploader.ftpClient as any).put = mockPut;

      const buffer = Buffer.from("test-data");
      const name = await uploader.uploadFile(buffer, () => "song.mp3");
      expect(name).toBe("song.mp3");
      expect(mockPut).toHaveBeenCalledTimes(2);
    });
  });

  describe("end", () => {
    it("closes the FTP connection", async () => {
      await uploader.init(createFtpUploadConfig());
      await uploader.end();
      expect(uploader.ftpClient!.end).toHaveBeenCalled();
    });
  });
});
