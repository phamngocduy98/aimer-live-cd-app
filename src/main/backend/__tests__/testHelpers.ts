import type { IHosting, IFtpUploadConfig, IHttpStreamConfig } from "../models/Hosting.js";
import { UploadStrategy, StreamStrategy } from "../models/Hosting.js";

export const TEST_UUID = "507f1f77bcf86cd799439011";

export function createFtpUploadConfig(overrides?: Partial<IFtpUploadConfig>): IFtpUploadConfig {
  return {
    type: UploadStrategy.FTP,
    ftpCredential: { host: "ftp.test.com", user: "testuser", password: "testpass", port: 21 },
    ftpRoot: "/htdocs",
    path: "/audio",
    ftpLimit: 3145728,
    ftpExt: ["+mp3", "-flac"],
    ...overrides
  };
}

export function createHttpStreamConfig(overrides?: Partial<IHttpStreamConfig>): IHttpStreamConfig {
  return {
    type: StreamStrategy.HTTP,
    host: "test.com",
    path: "/audio",
    partSize: 3145728,
    ...overrides
  };
}

let hostingCounter = 0;

export function createTestHosting(
  overrides?: Partial<IHosting>
): IHosting & { _id: string; id: string } {
  const uid = `${TEST_UUID}-${hostingCounter++}`;
  return {
    name: "test-hosting",
    upload: createFtpUploadConfig(),
    stream: createHttpStreamConfig(),
    _id: uid,
    id: uid,
    ...overrides
  } as any;
}
