import { vi } from "vitest";
import { Readable } from "node:stream";

const mockMongoData = vi.hoisted(() => {
  const hosting = {
    name: "test-hosting",
    _id: "507f1f77bcf86cd799439011",
    upload: { type: "ftp", ftpCredential: { host: "ftp.test.com", user: "testuser", password: "testpass" }, ftpRoot: "/htdocs", path: "/audio", ftpLimit: 3145728, ftpExt: [] },
    stream: { type: "http", host: "test.com", path: "/audio", partSize: 3145728 }
  };
  return { hosting };
});

const mockAxios = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockAxios: any = vi.fn().mockImplementation((_config: any) => mockGet(_config));
  mockAxios.get = mockGet;
  return { mockAxios, mockGet };
});

vi.mock("axios", () => ({ default: mockAxios }));

vi.mock("../config/const.js", () => ({
  PARTSIZE: 3145728,
  getAesStream: () => ({
    createEncryptStream: (input: Readable) => input,
    createDecryptStream2: (input: Readable) => input
  })
}));

vi.mock("../db/Mongo.js", () => ({
  dbClient: {
    listHosting: vi.fn().mockResolvedValue([mockMongoData.hosting]),
    findHosting: vi.fn().mockResolvedValue(mockMongoData.hosting)
  }
}));
