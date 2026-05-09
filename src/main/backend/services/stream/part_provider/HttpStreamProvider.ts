import http from "node:http";
import axios, { AxiosResponse } from "axios";
import { Readable } from "node:stream";
import { IHttpStreamConfig } from "../../../models/Hosting.js";
import { Song } from "../../../models/Song.js";
import { Video } from "../../../models/Video.js";
import { resp2string } from "../../../utils/stream/stream2buffer.js";
import { StreamProvider } from "./StreamProvider.js";

export class HttpStreamProvider extends StreamProvider {
  constructor(
    protected streamConfig: IHttpStreamConfig,
    headers: http.IncomingHttpHeaders = {}
  ) {
    super(headers);
  }

  get host(): string {
    return this.streamConfig.host;
  }
  get path(): string {
    return this.streamConfig.path;
  }

  httpGet(
    fileName: string,
    headers: http.IncomingHttpHeaders = {},
    responseType: "stream" | "text" = "stream",
    hostPath?: string
  ) {
    const hp = hostPath ?? `${this.host}${this.path}`;
    return axios({
      method: "get",
      url: `http://${hp}/${fileName}`,
      headers,
      responseType
    });
  }

  async get(
    fileName: string,
    headers: http.IncomingHttpHeaders = {},
    retryCount: number = 0,
    responseType: "stream" | "text" = "stream",
    hostPath?: string
  ): Promise<AxiosResponse<any, any>> {
    if (retryCount > 3) {
      throw Error("Max retry exceeded. Fail to get audio file.");
    }

    const hp = hostPath ?? `${this.host}${this.path}`;
    const reqHeaders: any = {
      ...this.headers,
      Range: undefined,
      ...headers,
      host: this.host
    };

    try {
      const mres = await this.httpGet(fileName, reqHeaders, responseType, hp);
      const statusCode = mres.status;

      console.log(
        `[ ${`HTTP ${retryCount}`.padStart(
          15
        )} ] [ ${this.host.padStart(25)} ] [ ${fileName.padStart(
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
        return this.get(fileName, reqHeaders, retryCount + 1, responseType, hp);
      }
      console.log(`[ ${"Retry required".padStart(15)} ] ${e}`);
      return this.get(fileName, reqHeaders, retryCount + 1, responseType, hp);
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

  async fetchPartFile(fileName: string): Promise<Readable> {
    const partResp = await this.get(fileName, {
      Range: `bytes=0-${Number.MAX_SAFE_INTEGER}`
    });
    return partResp.data;
  }

  async fetchRawPart(
    fileName: string
  ): Promise<{ data: Readable; contentType?: string; contentLength?: number }> {
    const res = await this.get(fileName);
    return {
      data: res.data,
      contentType: res.headers["content-type"],
      contentLength: res.headers["content-length"]
        ? parseInt(res.headers["content-length"])
        : undefined
    };
  }

  async ping(): Promise<{
    available: boolean;
    files: { fileName: string; parts: string; title: string; fileCount: number }[];
  }> {
    try {
      const res = await this.get("status.php", {}, 0, "text", this.host);

      const fileListText = res.data as string;
      const rawFiles = fileListText
        .split(",")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const groupMap = new Map<string, number[]>();
      for (const file of rawFiles) {
        const match = file.match(/^(.+?)(?:_(\d+))?\.[^.]+$/);
        if (!match) continue;
        const baseUuid = match[1];
        const suffix = match[2];
        let partNumber: number;
        if (suffix === undefined) {
          partNumber = 1;
        } else {
          partNumber = parseInt(suffix, 10) + 1;
        }
        if (!groupMap.has(baseUuid)) {
          groupMap.set(baseUuid, []);
        }
        groupMap.get(baseUuid)!.push(partNumber);
      }

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
          parts: ranges.join(",")
        };
      });

      const fileNames = groupedFiles.map((f) => f.fileName);
      const [songs, videos] = await Promise.all([
        Song.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean(),
        Video.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean()
      ]);

      const metaMap = new Map<string, { title: string; fileCount: number }>();
      songs.forEach((s) =>
        metaMap.set(s._id.toString(), { title: s.title, fileCount: s.fileCount })
      );
      videos.forEach((v) =>
        metaMap.set(v._id.toString(), { title: v.title, fileCount: v.fileCount })
      );

      const filesWithTitle = groupedFiles.map((f) => {
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
