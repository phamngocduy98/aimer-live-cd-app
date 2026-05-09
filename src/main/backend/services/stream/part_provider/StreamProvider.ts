import http from "node:http";
import { Readable, Writable } from "node:stream";
import { getAesStream } from "../../../config/const.js";
import { IHosting } from "../../../models/Hosting.js";
import { waitStreamClose } from "../../../utils/stream/stream2buffer.js";
import { StreamFilePart } from "../dto/StreamFilePart.js";
import { StreamInfo } from "../dto/StreamInfo.js";
import { getMediaUploader } from "../../mediaUpload/index.js";

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

  abstract ping(): Promise<{
    available: boolean;
    files: { fileName: string; parts: string; title: string; fileCount: number }[];
  }>;

  async backup(song: StreamInfo, targetHosting: IHosting): Promise<void> {
    console.log(`[ ${"Backup+".padStart(15)} ] Song ${song.id} into hosting ${targetHosting.name}`);
    for (let i = 0; i < song.fileCount; i++) {
      const fileName = `${song.id}${i > 0 ? `_${i}` : ""}.${song.fileExtension}`;
      const buffers: Buffer[] = [];
      const outputStream = new Writable({
        write(chunk, _encoding, callback) {
          buffers.push(chunk);
          callback();
        }
      });
      const part = await this.fetchRawPart(fileName);
      part.data.pipe(outputStream);
      await waitStreamClose(outputStream);

      console.log(`[ ${"Backup".padStart(15)} ] Start uploading`);

      const [fname, fext] = fileName.split(".");
      const uploader = getMediaUploader(targetHosting.upload);
      await uploader.init(targetHosting.upload);
      await uploader.upload(Buffer.concat(buffers), fname, fext);
      await uploader.end();
    }

    console.log(`[ ${"Backup-".padStart(15)} ] Song ${song.id} completed`);
  }
}
