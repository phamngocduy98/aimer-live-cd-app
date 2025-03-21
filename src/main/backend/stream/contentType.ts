import { Format } from "../db/Song.js";

type Format2ContentType = {
  [key: string]: string;
};

class ContentType {
  formatContentType: Format2ContentType;
  constructor() {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    this.formatContentType = {
      MPEG: "audio/mpeg",
      FLAC: "application/x-flac",

      mp4: "video/mp4",
      mp3: "audio/mpeg",
      flac: "application/x-flac",
      mkv: "video/webm"
    };
  }
  getContentType(f: string) {
    if (f in this.formatContentType) {
      return this.formatContentType[f];
    }
    return "application/octet-stream";
  }
}

export const contentType = new ContentType();
