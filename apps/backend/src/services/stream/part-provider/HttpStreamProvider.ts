import http from "node:http";
import axios, { AxiosResponse } from "axios";
import { Readable } from "node:stream";
import { IHttpStreamConfig } from "../../../models/Hosting.js";
import { resp2string } from "../../../utils/stream/stream2buffer.js";
import { StreamProvider } from "./StreamProvider.js";
import { createLogger } from "../../../utils/log.js";

const log = createLogger("HTTP");

function headerValueToString(value: AxiosResponse["headers"][string]): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return undefined;
}

function headerValueIncludes(value: AxiosResponse["headers"][string], search: string): boolean {
  return headerValueToString(value)?.includes(search) ?? false;
}

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

      log.debug(
        `HTTP ${retryCount} [${this.host}] [${fileName}] [${reqHeaders["Range"]?.slice(6)}] ${statusCode} ${mres.headers["content-type"]} ${mres.headers["content-range"]?.slice(6)}`
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
      log.warn({ err: e }, `Retry required`);
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
      if (headerValueIncludes(res.headers["content-type"], "text/html")) {
        if (responseType === "text") {
          log.warn(`HTML response: ${res.data.slice(0, 150)}`);
        } else {
          res.data = await resp2string(res);
          log.warn(`${res.data.slice(0, 150)} ${res.data.length > 150 ? "..." : ""}`);
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
    const contentLength = headerValueToString(res.headers["content-length"]);
    return {
      data: res.data,
      contentType: headerValueToString(res.headers["content-type"]),
      contentLength: contentLength ? parseInt(contentLength) : undefined
    };
  }

  async listFiles(): Promise<{
    available: boolean;
    files: { fileName: string; partNumbers: number[] }[];
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

      const files = Array.from(groupMap.entries()).map(([baseUuid, partNumbers]) => {
        partNumbers.sort((a, b) => a - b);
        return {
          fileName: baseUuid,
          partNumbers
        };
      });

      return { available: true, files };
    } catch (e) {
      if (`${e}`.includes("404") || `${e}`.includes("Audio not found")) {
        return { available: false, files: [] };
      }
      throw e;
    }
  }
}
