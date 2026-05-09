import { describe, it, expect, beforeEach } from "vitest";
import { MediaUploader } from "../../../services/mediaUpload/MediaUploader.js";
import { UploadStrategy } from "../../../models/Hosting.js";
import { createFtpUploadConfig } from "../../testHelpers.js";

class TestUploader extends MediaUploader {
  initCalled = false;
  uploadedFiles: string[] = [];

  async init(config: import("../../../models/Hosting.js").UploadConfig): Promise<void> {
    this.initCalled = true;
    if (config.type === UploadStrategy.FTP) {
      this.uploadLimit = config.ftpLimit;
      this.allowedExt = config.ftpExt.filter((e) => e[0] === "+");
      this.deniedExt = config.ftpExt.filter((e) => e[0] === "-");
    }
  }

  async uploadFile(_upBuff: any, getFileName: () => string): Promise<string> {
    const name = getFileName();
    this.uploadedFiles.push(name);
    return name;
  }
}

describe("MediaUploader", () => {
  let uploader: TestUploader;

  beforeEach(() => {
    uploader = new TestUploader();
  });

  describe("init", () => {
    it("is called with config and sets uploadLimit", async () => {
      const config = createFtpUploadConfig({ ftpLimit: 1024 });
      await uploader.init(config);
      expect(uploader.initCalled).toBe(true);
      expect(uploader.uploadLimit).toBe(1024);
    });

    it("parses allowedExt from + prefixed entries", async () => {
      const config = createFtpUploadConfig({ ftpExt: ["+mp3", "+flac", "-wav"] });
      await uploader.init(config);
      expect(uploader.allowedExt).toEqual(["+mp3", "+flac"]);
      expect(uploader.deniedExt).toEqual(["-wav"]);
    });
  });

  describe("getUploadExt", () => {
    it("returns from allowedExt cycle when set", async () => {
      await uploader.init(createFtpUploadConfig({ ftpExt: ["+mp3", "+flac"] }));
      const gen = uploader.getUploadExt(".mp3");
      expect(gen()).toBe("mp3");
      expect(gen()).toBe("flac");
    });

    it("throws when allowedExt exhausted", async () => {
      await uploader.init(createFtpUploadConfig({ ftpExt: ["+mp3"] }));
      const gen = uploader.getUploadExt(".mp3");
      gen();
      expect(() => gen()).toThrow("hosting.allowedExt");
    });

    it("uses uploadExt first when not denied", async () => {
      await uploader.init(createFtpUploadConfig({ ftpExt: [] }));
      const gen = uploader.getUploadExt(".mp3");
      expect(gen()).toBe("mp3");
      expect(gen()).toBe("audio");
      expect(gen()).toBe("unknown");
    });

    it("skips denied ext and falls back to extList", async () => {
      await uploader.init(createFtpUploadConfig({ ftpExt: ["-mp3"] }));
      const gen = uploader.getUploadExt(".mp3");
      expect(gen()).toBe("audio");
    });

    it("throws when extList exhausted", async () => {
      await uploader.init(createFtpUploadConfig({ ftpExt: ["-mp3"] }));
      const gen = uploader.getUploadExt(".mp3");
      gen(); gen(); gen(); gen();
      expect(() => gen()).toThrow("FtpMediaUploader.mExtList");
    });
  });

  describe("upload", () => {
    it("splits buffer into parts and calls uploadFile for each", async () => {
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(250, 0xbb);
      const { fileCount } = await uploader.upload(buffer, "song", "mp3");
      expect(fileCount).toBe(3);
      expect(uploader.uploadedFiles.length).toBe(3);
      expect(uploader.uploadedFiles[0]).toMatch(/^song\.\w+$/);
      expect(uploader.uploadedFiles[1]).toMatch(/^song_1\.\w+$/);
      expect(uploader.uploadedFiles[2]).toMatch(/^song_2\.\w+$/);
    });

    it("skips parts before skipPart", async () => {
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(250, 0xbb);
      const { fileCount } = await uploader.upload(buffer, "song", "mp3", undefined, 1);
      expect(fileCount).toBe(3);
      expect(uploader.uploadedFiles.length).toBe(2);
    });

    it("limits number of uploaded parts", async () => {
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(250, 0xbb);
      const { fileCount } = await uploader.upload(buffer, "song", "mp3", undefined, 0, 1);
      expect(fileCount).toBe(3);
      expect(uploader.uploadedFiles.length).toBe(1);
    });

    it("retries on uploadFile failure up to 3 times", async () => {
      globalThis.setTimeout = ((fn: any) => { fn(); return 0; }) as any;
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(50, 0xbb);

      let attempts = 0;
      uploader.uploadFile = async () => {
        attempts++;
        if (attempts <= 2) throw new Error("FTP timeout");
        return "song.mp3";
      };

      const { fileCount } = await uploader.upload(buffer, "song", "mp3");
      expect(fileCount).toBe(1);
      expect(attempts).toBe(3);
    }, 10000);

    it("throws after exceeding max retries", async () => {
      globalThis.setTimeout = ((fn: any) => { fn(); return 0; }) as any;
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(50, 0xbb);

      uploader.uploadFile = async () => { throw new Error("Always fails"); };

      await expect(uploader.upload(buffer, "song", "mp3")).rejects.toThrow("Max try exceeded");
    }, 10000);
  });

  describe("encryptAndUpload", () => {
    it("calls upload with encryption function", async () => {
      await uploader.init(createFtpUploadConfig({ ftpLimit: 100 }));
      const buffer = Buffer.alloc(50);
      const iv = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
      const { fileCount } = await uploader.encryptAndUpload(buffer, "song", "mp3", iv);
      expect(fileCount).toBe(1);
    });
  });

  describe("end", () => {
    it("is a no-op by default", async () => {
      await expect(uploader.end()).resolves.toBeUndefined();
    });
  });
});
