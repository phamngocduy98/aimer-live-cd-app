import { describe, it, expect, vi } from "vitest";
import { getMediaUploader, uploadSongAPI } from "../../../services/mediaUpload/index.js";
import { FtpMediaUploader } from "../../../services/mediaUpload/FtpMediaUploader.js";
import { createFtpUploadConfig } from "../../testHelpers.js";
import { dbClient } from "../../../db/Mongo.js";

const MockFtpUploader = vi.hoisted(() => {
  return class {
    init = vi.fn().mockResolvedValue(undefined);
    encryptAndUpload = vi.fn().mockResolvedValue({ fileCount: 3 });
    end = vi.fn().mockResolvedValue(undefined);
  };
});

vi.mock("../../../services/mediaUpload/FtpMediaUploader.js", () => ({ FtpMediaUploader: MockFtpUploader }));

vi.mock("music-metadata", () => ({
  parseBuffer: vi.fn().mockResolvedValue({
    format: { container: "mp3", bitrate: 320000, duration: 240, lossless: false },
    common: { title: "Test Song", artists: ["Test Artist"], track: { no: 1 } }
  })
}));

const MockBuilder = vi.hoisted(() => {
  return class {
    _id = { _id: "507f1f77bcf86cd799439011", toString: () => "507f1f77bcf86cd799439011" };
    init = vi.fn().mockResolvedValue(undefined);
    title = () => "Test Song";
    iv = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
    addHosting = vi.fn();
    attachAlbum = vi.fn();
    fileCount = vi.fn();
    save = vi.fn().mockResolvedValue(undefined);
  };
});

const MockAlbumBuilder = vi.hoisted(() => {
  return class {
    init = vi.fn().mockResolvedValue(undefined);
    save = vi.fn().mockResolvedValue(undefined);
    addTrack = vi.fn();
  };
});

vi.mock("../../../db/builder/index.js", () => ({
  SongBuilder: MockBuilder,
  VideoBuilder: MockBuilder,
  AlbumBuilder: MockAlbumBuilder
}));

describe("getMediaUploader", () => {
  it("returns FtpMediaUploader for FTP config", () => {
    const config = createFtpUploadConfig();
    const uploader = getMediaUploader(config);
    expect(uploader).toBeInstanceOf(FtpMediaUploader);
  });

  it("throws for unknown upload strategy", () => {
    const config = { type: "unknown" } as any;
    expect(() => getMediaUploader(config)).toThrow("Unknown upload strategy");
  });
});

describe("uploadSongAPI", () => {
  it("orchestrates full upload flow", async () => {
    const buffer = Buffer.alloc(1024);
    await uploadSongAPI(buffer, "mp3");
    expect(dbClient.listHosting).toHaveBeenCalled();
  });

  it("accepts optional hostId", async () => {
    const buffer = Buffer.alloc(512);
    await uploadSongAPI(buffer, "flac", 0, 1, "507f1f77bcf86cd799439011");
  });
});
