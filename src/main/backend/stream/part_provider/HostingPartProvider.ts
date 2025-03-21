import http from "node:http";
import axios, { AxiosResponse } from "axios";
import { Readable, Transform, Writable } from "node:stream";
import { getAesStream, PARTSIZE } from "../../const.js";
import { IHosting } from "../../db/Hosting.js";
import { ISong } from "../../db/Song.js";
import { resp2string, waitStreamClose } from "../../utils/stream2buffer.js";
import { WithDocument } from "../../utils/type.js";
import { StreamFilePart } from "../StreamFilePart.js";
import { StreamInfo } from "../StreamInfo.js";
import fs from "fs";
import { FtpMediaUploader } from "../../media_upload/FtpMediaUploader.js";
export class HostingPartProvider {
  constructor(
    protected hosting: IHosting,
    private headers: http.IncomingHttpHeaders
  ) {}

  httpGet(fileName: string, headers: http.IncomingHttpHeaders = {}) {
    return axios({
      method: "get",
      url: `http://${this.hosting.host}${this.hosting.path}/${fileName}`,
      headers,
      responseType: "stream"
    });
  }

  // HTTP request is slow ~600-2000ms
  async get(
    fileName: string,
    headers: http.IncomingHttpHeaders = {},
    retryCount: number = 0
  ): Promise<AxiosResponse<any, any>> {
    if (retryCount > 3) {
      throw Error("Max retry exceeded. Fail to get audio file.");
    }

    const reqHeaders: any = {
      ...this.headers,
      Range: undefined,
      ...headers,
      host: this.hosting.host
    };

    try {
      const mres = await this.httpGet(fileName, reqHeaders);
      const statusCode = mres.status;

      console.log(
        `[ ${`HTTP ${retryCount}`.padStart(
          15
        )} ] [ ${this.hosting.host.padStart(25)} ] [ ${fileName.padStart(
          32
        )} ] [ ${reqHeaders["Range"]?.slice(6)?.padStart(17)} ] ${statusCode} ${
          mres.headers["content-type"]
        } ${mres.headers["content-range"]?.slice(6)}`
      );

      const res = await this.handleResponse(statusCode, mres);
      return res;
    } catch (e) {
      if (`${e}`.includes("404")) {
        throw Error("Audio not found! Try another hosting.");
      }
      console.log(`[ ${"Retry required".padStart(15)} ] ${e}`);
      return this.get(fileName, reqHeaders, retryCount + 1);
    }
  }

  async handleResponse(statusCode: number | undefined, res: AxiosResponse<any, any>) {
    if (statusCode != null && ((statusCode >= 300 && statusCode < 400) || statusCode === 404)) {
      throw Error("Audio not found");
    }
    if (statusCode != null && statusCode >= 200 && statusCode < 300) {
      if (res.headers["content-type"]?.includes("text/html")) {
        res.data = await resp2string(res);
        console.log(
          `[ ${`HTTP Resp`.padStart(15)} ] ${res.data.slice(0, 150)} ${
            res.data.length > 150 ? "..." : ""
          }`
        );
      }
      return res;
    }
    throw Error("Error status code = " + statusCode);
  }

  protected removeStreamPadding(input: Readable, paddingSize: number) {
    if (paddingSize === 0) return input;
    console.warn("Remove stream padding");
    let removed = false;
    return input.pipe(
      new Transform({
        transform(chunk, encoding, callback) {
          if (!removed) {
            this.push(chunk.slice(paddingSize));
            removed = true;
          } else {
            this.push(chunk);
          }
          callback();
        }
      })
    );
  }

  async streamPart(song: StreamInfo, part: StreamFilePart) {
    const iv = Buffer.from(song.iv, "hex");
    const partResp = await this.get(part.fileName, {
      Range: `bytes=0-${part.partSize - 1}`
    });
    // const stream = fs.createReadStream(
    //   "D:\\Dev\\node-music-stream/test/mp3/am1.mp4"
    // );
    return getAesStream().createDecryptStream2(
      // stream,
      partResp.data,
      iv,
      0 // each part is encrypted seperately
    );
  }

  async backup(song: StreamInfo, hosting: WithDocument<IHosting>) {
    console.log(
      `[ ${"Backup+".padStart(15)} ] Song ${song.id} into hosting ${hosting.id} ${hosting.host}`
    );
    for (let i = 0; i < song.fileCount; i++) {
      const fileName = `${song.id}${i > 0 ? `_{i}` : ""}`;
      const buffers: Buffer[] = [];
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          buffers.push(chunk);
          callback();
        }
      });
      const mres = await this.get(fileName);
      mres.data.pipe(outputStream);
      await waitStreamClose(outputStream);

      console.log(`[ ${"Backup".padStart(15)} ] Start uploading`);

      const [fname, fext] = fileName.split(".");
      const ftpMediaUploader = new FtpMediaUploader();
      await ftpMediaUploader.init(hosting);
      await ftpMediaUploader.upload(Buffer.concat(buffers), fname, fext);
      await ftpMediaUploader.end();
    }

    console.log(`[ ${"Backup-".padStart(15)} ] Song ${song.id} completed`);
  }
}
