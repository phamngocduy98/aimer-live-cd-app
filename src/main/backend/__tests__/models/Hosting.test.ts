import { describe, it, expect } from "vitest";
import {
  UploadStrategy,
  StreamStrategy,
  HostingProvider,
  type IFtpUploadConfig
} from "../../models/Hosting.js";
import { createFtpUploadConfig, createHttpStreamConfig, createTestHosting } from "../testHelpers.js";

describe("UploadStrategy", () => {
  it("has FTP enum value", () => {
    expect(UploadStrategy.FTP).toBe("ftp");
  });
});

describe("StreamStrategy", () => {
  it("has HTTP enum value", () => {
    expect(StreamStrategy.HTTP).toBe("http");
  });
});

describe("HostingProvider", () => {
  it("has INFINITVE_FREE enum value", () => {
    expect(HostingProvider.INFINITVE_FREE).toBe("infinityfree.net");
  });

  it("has AWARD_SPACE enum value", () => {
    expect(HostingProvider.AWARD_SPACE).toBe("awardspace.net");
  });
});

describe("IFtpUploadConfig", () => {
  it("creates a valid FTP upload config", () => {
    const config = createFtpUploadConfig();
    expect(config.type).toBe(UploadStrategy.FTP);
    expect(config.ftpCredential.host).toBe("ftp.test.com");
    expect(config.ftpRoot).toBe("/htdocs");
    expect(config.path).toBe("/audio");
    expect(config.ftpLimit).toBe(3145728);
    expect(config.ftpExt).toEqual(["+mp3", "-flac"]);
  });

  it("accepts overrides", () => {
    const config = createFtpUploadConfig({ ftpRoot: "/custom", ftpLimit: 1024 });
    expect(config.ftpRoot).toBe("/custom");
    expect(config.ftpLimit).toBe(1024);
  });

  it("discriminated union check: type is ftp", () => {
    const config: IFtpUploadConfig = createFtpUploadConfig();
    if (config.type === UploadStrategy.FTP) {
      expect(config.ftpCredential).toBeDefined();
      expect(config.ftpRoot).toBeDefined();
    } else {
      // TypeScript narrowing: this branch should be unreachable
      expect(true).toBe(false);
    }
  });
});

describe("IHttpStreamConfig", () => {
  it("creates a valid HTTP stream config", () => {
    const config = createHttpStreamConfig();
    expect(config.type).toBe(StreamStrategy.HTTP);
    expect(config.host).toBe("test.com");
    expect(config.path).toBe("/audio");
    expect(config.partSize).toBe(3145728);
  });

  it("accepts optional antiHotlink", () => {
    const config = createHttpStreamConfig({ antiHotlink: HostingProvider.INFINITVE_FREE });
    expect(config.antiHotlink).toBe(HostingProvider.INFINITVE_FREE);
  });

  it("defaults to undefined antiHotlink", () => {
    const config = createHttpStreamConfig();
    expect(config.antiHotlink).toBeUndefined();
  });
});

describe("IHosting", () => {
  it("creates a valid hosting with decoupled upload and stream", () => {
    const hosting = createTestHosting();
    expect(hosting.name).toBe("test-hosting");
    expect(hosting.upload.type).toBe(UploadStrategy.FTP);
    expect(hosting.stream.type).toBe(StreamStrategy.HTTP);
  });

  it("accepts optional provider field for anti-hotlink", () => {
    const hosting = createTestHosting({ provider: HostingProvider.INFINITVE_FREE });
    expect(hosting.provider).toBe(HostingProvider.INFINITVE_FREE);
  });

  it("upload config is independent from stream config", () => {
    const hosting = createTestHosting({
      upload: createFtpUploadConfig({ ftpRoot: "/upload/path" }),
      stream: createHttpStreamConfig({ host: "stream.example.com" })
    });
    expect(hosting.upload.type).toBe(UploadStrategy.FTP);
    expect(hosting.stream.type).toBe(StreamStrategy.HTTP);
    expect(hosting.upload).not.toEqual(hosting.stream);
  });
});
