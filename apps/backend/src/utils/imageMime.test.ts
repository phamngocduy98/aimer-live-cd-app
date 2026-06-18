import { describe, expect, it } from "vitest";
import { detectImageMimeType } from "./imageMime.js";

describe("detectImageMimeType", () => {
  it.each([
    ["PNG", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"],
    ["JPEG", Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"],
    ["GIF", Buffer.from("GIF89a"), "image/gif"],
    ["WebP", Buffer.from("RIFF0000WEBP"), "image/webp"],
    ["BMP", Buffer.from("BM"), "image/bmp"],
    ["AVIF", Buffer.from("0000ftypavif"), "image/avif"]
  ])("detects %s images", (_name, bytes, expected) => {
    expect(detectImageMimeType(bytes)).toBe(expected);
  });

  it("rejects content that is only labeled as an image", () => {
    expect(detectImageMimeType(Buffer.from("not an image"))).toBeUndefined();
  });
});
