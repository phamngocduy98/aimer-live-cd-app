import http from "node:http";
import axios, { AxiosResponse } from "axios";
import { Readable, Transform, Writable } from "node:stream";
import { getAesStream, PARTSIZE } from "../../../config/const.js";
import { IHosting } from "../../../models/Hosting.js";
import { Song } from "../../../models/Song.js";
import { Video } from "../../../models/Video.js";
import { resp2string, waitStreamClose } from "../../../utils/stream/stream2buffer.js";
import { WithDocument } from "../../../types/type.js";
import { StreamFilePart } from "../dto/StreamFilePart.js";
import { StreamInfo } from "../dto/StreamInfo.js";
import fs from "fs";
import { FtpMediaUploader } from "../../mediaUpload/FtpMediaUploader.js";
export class StreamProvider {
  constructor(
    protected hosting: IHosting,
    private headers: http.IncomingHttpHeaders
  ) {}

  httpGet(
    fileName: string,
    headers: http.IncomingHttpHeaders = {},
    responseType: "stream" | "text" = "stream",
    hostPath: string = `${this.hosting.host}${this.hosting.path}`
  ) {
    return axios({
      method: "get",
      url: `http://${hostPath}/${fileName}`,
      headers,
      responseType
    });
  }

  // HTTP request is slow ~600-2000ms
  async get(
    fileName: string,
    headers: http.IncomingHttpHeaders = {},
    retryCount: number = 0,
    responseType: "stream" | "text" = "stream",
    hostPath: string = `${this.hosting.host}${this.hosting.path}`
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
      const mres = await this.httpGet(fileName, reqHeaders, responseType, hostPath);
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

      const res = await this.handleResponse(statusCode, mres, responseType);
      return res;
    } catch (e) {
      if (`${e}`.includes("404")) {
        throw Error("Audio not found! Try another hosting.");
      }
      if (`${e}`.includes("Token refreshed")) {
        return this.get(fileName, reqHeaders, retryCount + 1, responseType, hostPath);
      }
      console.log(`[ ${"Retry required".padStart(15)} ] ${e}`);
      return this.get(fileName, reqHeaders, retryCount + 1, responseType, hostPath);
    }
  }

  async handleResponse(
    statusCode: number | undefined,
    res: AxiosResponse<any, any>,
    responseType: "stream" | "text" = "stream"
  ) {
    if (statusCode != null && ((statusCode >= 300 && statusCode < 400) || statusCode === 404)) {
      throw Error("Audio not found");
    }
    if (statusCode != null && statusCode >= 200 && statusCode < 300) {
      if (res.headers["content-type"]?.includes("text/html")) {
        if (responseType === "text") {
          console.log(`[ ${`HTTP Resp`.padStart(15)} ] HTML response: ${res.data.slice(0, 150)}`);
        } else {
          res.data = await resp2string(res);
          console.log(
            `[ ${`HTTP Resp`.padStart(15)} ] ${res.data.slice(0, 150)} ${
              res.data.length > 150 ? "..." : ""
            }`
          );
        }
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
      await ftpMediaUploader.init(hosting.ftpRoot, hosting.path, hosting.ftpCredential, hosting.ftpLimit, hosting.ftpExt);
      await ftpMediaUploader.upload(Buffer.concat(buffers), fname, fext);
      await ftpMediaUploader.end();
    }

    console.log(`[ ${"Backup-".padStart(15)} ] Song ${song.id} completed`);
  }

  async ping(): Promise<{ available: boolean; files: { fileName: string; parts: string; title: string }[] }> {
    try {
      const res = await this.get("status.php", {},0, "text", this.hosting.host);

      const fileListText = res.data as string;
      const rawFiles = fileListText
        .split(",")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Group files by base UUID and calculate part numbers
      const groupMap = new Map<string, number[]>();
      for (const file of rawFiles) {
        // Regex matches filenames with extensions: baseUuid[_N].ext
        const match = file.match(/^(.+?)(?:_(\d+))?\.[^.]+$/);
        if (!match) continue;
        const baseUuid = match[1];
        const suffix = match[2];
        let partNumber: number;
        if (suffix === undefined) {
          // First part: no _suffix (e.g., uuid.mp4) = part 1
          partNumber = 1;
        } else {
          // Suffix _N (e.g., uuid_10.mp4) = part N+1 (e.g., 10+1=11)
          partNumber = parseInt(suffix, 10) + 1;
        }
        if (!groupMap.has(baseUuid)) {
          groupMap.set(baseUuid, []);
        }
        groupMap.get(baseUuid)!.push(partNumber);
      }

      // Convert groups to { fileName, parts } with range strings
      const groupedFiles = Array.from(groupMap.entries()).map(([baseUuid, partNumbers]) => {
        partNumbers.sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = partNumbers[0];
        let end = partNumbers[0];
        for (let i = 1; i < partNumbers.length; i++) {
          const current = partNumbers[i];
          if (current === end + 1) {
            end = current;
          } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = current;
            end = current;
          }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        return {
          fileName: baseUuid,
          parts: ranges.join(',')
        };
      });

      // Fetch titles from Song and Video collections
      const fileNames = groupedFiles.map(f => f.fileName);
      const [songs, videos] = await Promise.all([
        Song.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean(),
        Video.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean()
      ]);

      const metaMap = new Map<string, { title: string; fileCount: number }>();
      songs.forEach(s => metaMap.set(s._id.toString(), { title: s.title, fileCount: s.fileCount }));
      videos.forEach(v => metaMap.set(v._id.toString(), { title: v.title, fileCount: v.fileCount }));

      const filesWithTitle = groupedFiles.map(f => {
        const meta = metaMap.get(f.fileName) || { title: "Unknown", fileCount: 0 };
        return {
          ...f,
          title: meta.title,
          fileCount: meta.fileCount
        };
      });

      return { available: true, files: filesWithTitle };
    } catch (e) {
      if (`${e}`.includes("404") || `${e}`.includes("Audio not found")) {
        return { available: false, files: [] };
      }
      throw e;
    }
  }
}
