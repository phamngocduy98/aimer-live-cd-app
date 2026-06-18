import http from "node:http";
import { Readable } from "node:stream";
import { getAesStream } from "../../../config/const.js";
import { StreamFilePart } from "../dto/StreamFilePart.js";
import { StreamInfo } from "../dto/StreamInfo.js";

export abstract class StreamProvider {
  constructor(protected headers: http.IncomingHttpHeaders) {}

  abstract fetchPartFile(fileName: string): Promise<Readable>;

  async streamPart(song: StreamInfo, part: StreamFilePart): Promise<Readable> {
    const iv = Buffer.from(song.iv, "hex");
    const data = await this.fetchPartFile(part.fileName);
    return getAesStream().createDecryptStream2(data, iv, 0);
  }

  abstract fetchRawPart(
    fileName: string
  ): Promise<{ data: Readable; contentType?: string; contentLength?: number }>;

  abstract listFiles(): Promise<{
    available: boolean;
    files: { fileName: string; partNumbers: number[] }[];
  }>;
}
