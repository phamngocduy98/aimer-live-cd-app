import MultiStream from "multistream";
import http from "node:http";
import { Readable } from "node:stream";
import { PARTSIZE } from "../../config/const.js";
import { IHosting, IHttpStreamConfig, StreamStrategy } from "../../models/Hosting.js";
import { parseRange } from "../../utils/http.js";
import { removeStreamPadding } from "../../utils/stream/removeStreamPadding.js";
import { contentType } from "./content-type.js";
import { cache } from "./StreamCache.js";
import { getPartProvider } from "./part-provider/index.js";
import { StreamFilePart } from "./dto/StreamFilePart.js";
import { StreamInfo } from "./dto/StreamInfo.js";
import { createLogger } from "../../utils/log.js";

const log = createLogger("Stream");

function getPartSize(hosting: IHosting): number {
  if (hosting.stream.type === StreamStrategy.HTTP) {
    return (hosting.stream as IHttpStreamConfig).partSize;
  }
  return PARTSIZE;
}

export class SongStream {
  constructor(private reqHeaders: http.IncomingHttpHeaders) {}

  getParts(
    fileList: string[],
    maxPartSize: number,
    fileSize: number,
    rangeStart: number,
    rangeEnd: number
  ): StreamFilePart[] {
    const startIdx = Math.floor(rangeStart / maxPartSize);
    const endIdx = Math.floor(rangeEnd / maxPartSize);

    const parts: StreamFilePart[] = [];
    for (let idx = startIdx; idx <= endIdx; idx++) {
      const partStart = idx === startIdx ? rangeStart % maxPartSize : 0;
      const partEnd = idx === endIdx ? rangeEnd % maxPartSize : maxPartSize - 1;
      const partSize = maxPartSize * (idx + 1) > fileSize ? fileSize % maxPartSize : maxPartSize;

      parts.push(new StreamFilePart(idx, partSize, fileList[idx], partStart, partEnd));
    }
    return parts;
  }

  async streamPart(
    info: StreamInfo,
    part: StreamFilePart,
    hosting: IHosting,
    triedHosting: Map<IHosting, boolean> = new Map([[hosting, true]])
  ): Promise<Readable> {
    try {
      const partProvider = getPartProvider(hosting, this.reqHeaders);
      const stream = await partProvider.streamPart(info, part);
      return stream;
    } catch (e: any) {
      log.warn({ err: e }, `Stream part ${info.id}: Hosting ${hosting.name} Failed`);
      for (let host of info.hostingList) {
        if (!triedHosting.has(host)) {
          triedHosting.set(host, true);
          return this.streamPart(info, part, host, triedHosting);
        }
      }
    }
    throw Error("No part available");
  }

  private async listAndValidateParts(info: StreamInfo): Promise<Map<string, IHosting[]>> {
    const allPartFiles = [...Array(info.fileCount)].map(
      (_, i) => `${info.id}${i > 0 ? `_${i}` : ""}.${info.fileExtension}`
    );

    const partToHosts = new Map<string, IHosting[]>();
    allPartFiles.forEach((file) => partToHosts.set(file, []));

    const parsePartFile = (partFile: string) => {
      const match = partFile.match(/^(.+?)(?:_(\d+))?\.[^.]+$/);
      if (!match) return null;
      const baseUuid = match[1];
      const suffix = match[2];
      let partNumber: number;
      if (suffix === undefined) {
        partNumber = 1;
      } else {
        partNumber = parseInt(suffix, 10) + 1;
      }
      return { baseUuid, partNumber };
    };

    const listPromises = info.hostingList.map(async (hosting) => {
      try {
        const provider = getPartProvider(hosting, this.reqHeaders);
        const listResult = await provider.listFiles();
        if (!listResult?.available || !Array.isArray(listResult.files)) return;

        const baseToParts = new Map<string, number[]>();
        for (const f of listResult.files) {
          baseToParts.set(f.fileName, f.partNumbers);
        }

        allPartFiles.forEach((partFile) => {
          const parsed = parsePartFile(partFile);
          if (!parsed) return;
          const { baseUuid, partNumber } = parsed;
          const partNumbers = baseToParts.get(baseUuid);
          if (!partNumbers) return;

          if (partNumbers.includes(partNumber)) {
            partToHosts.get(partFile)?.push(hosting);
          }
        });
      } catch (e) {
        log.warn({ err: e }, `ListFiles Host ${hosting.name} failed`);
      }
    });

    await Promise.all(listPromises);

    const missingParts = [...partToHosts.entries()]
      .filter(([_, hosts]) => hosts.length === 0)
      .map(([part]) => part);

    if (missingParts.length > 0) {
      throw new Error(`File corrupted: missing parts ${missingParts.join(", ")}`);
    }

    return partToHosts;
  }

  async stream(info: StreamInfo): Promise<{ stream: MultiStream; metadata: Record<string, any> }> {
    let multiStream: MultiStream | null = null;

    let partToAvailableHosts: Map<string, IHosting[]> = new Map();

    try {
      partToAvailableHosts = await this.listAndValidateParts(info);
      log.debug(
        `All parts validated. Available hosts per part: ${JSON.stringify(
          [...partToAvailableHosts].map(([f, h]) => [f, h.map((x) => x.name)])
        )}`
      );
    } catch (e: any) {
      log.error({ err: e }, `Validation failed: ${e.message}`);
      const error = new Error(e.message);
      (error as any).status = 500;
      throw error;
    }

    const partSize = Math.min(
      PARTSIZE,
      info.hostingList.length > 0 ? getPartSize(info.hostingList[0]) : PARTSIZE
    );
    const range = parseRange(this.reqHeaders["range"], info.size);

    const fileList = [...Array(info.fileCount)].map(
      (_, i) => `${info.id}${i > 0 ? `_${i}` : ""}.${info.fileExtension}`
    );

    const parts = this.getParts(fileList, partSize, info.size, range.start, range.end);

    log.debug(`${info.id} ${range.start}-${range.end} (${parts.length} parts)`);

    let partIdx = 0;
    const streamFactory: MultiStream.FactoryStream = async (cb) => {
      if (partIdx >= parts.length) {
        log.info("MultiStream Completed");
        return cb(null, null);
      }

      try {
        const currentPart = parts[partIdx];
        const partFileName = currentPart.fileName;
        const availableHosts = partToAvailableHosts.get(partFileName) || [];
        const selectedHost = availableHosts[partIdx % availableHosts.length];

        let stream = cache.get(partFileName);
        if (stream) {
          cb(null, removeStreamPadding(stream, currentPart));
        } else {
          const newCacheStream = cache.set(partFileName);
          try {
            stream = await this.streamPart(info, currentPart, selectedHost);
            log.info(`${partFileName}: Ready from ${selectedHost.name}`);
            stream.pipe(newCacheStream);
            cb(null, removeStreamPadding(cache.get(partFileName)!, currentPart));
          } catch (e) {
            log.warn({ err: e }, `${info.id}: Part ${partIdx} failed from ${selectedHost.name}`);
            newCacheStream.destroy(e as Error);
            cb(e as Error, null);
          }
        }
        partIdx++;
      } catch (e) {
        log.warn({ err: e }, `${info.id}: Part ${partIdx} stream factory error`);
        cb(e as Error, null);
      }
    };

    const _contentType = contentType.getContentType(info.fileExtension ?? info.format);

    multiStream = new MultiStream(streamFactory)
      .on("error", (e) => {
        log.error({ err: e }, "MultiStream error");
      })
      .on("end", () => {
        log.info("MultiStream Ended");
      })
      .on("close", () => {
        log.info("MultiStream Closed");
      });

    log.debug(
      `Write header: ${_contentType} ${range.start}-${range.end}/${info.size} (len=${range.end - range.start + 1})`
    );
    const metadata = {
      status: 206,
      statusMessage: "Partial Content",
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": range.end - range.start + 1,
        "content-range": `bytes ${range.start}-${range.end}/${info.size}`,
        "Content-Type": _contentType,
        "cache-control": "public, max-age=60"
      }
    };
    return { stream: multiStream!, metadata };
  }
}
