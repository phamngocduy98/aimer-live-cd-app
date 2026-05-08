import { Response } from "express";
import MultiStream from "multistream";
import http from "node:http";
import { Readable, Writable } from "node:stream";
import { PARTSIZE } from "../const.js";
import { IHosting } from "../db/Hosting.js";
import { parseRange } from "../utils/http.js";
import { removeStreamPadding } from "../utils/removeStreamPadding.js";
import { fail } from "../utils/reqUtils.js";
import { contentType } from "./contentType.js";
import { cache } from "./MyStreamCache.js";
import { getPartProvider } from "./part_provider/index.js";
import { StreamFilePart } from "./StreamFilePart.js";
import { StreamInfo } from "./StreamInfo.js";

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
      console.log(
        `[ ${"Stream part".padStart(15)} ] ${info.id}: Hosting ${hosting.host} Failed: ${e}`
      );
      for (let host of info.hostingList) {
        if (!triedHosting.has(host)) {
          triedHosting.set(host, true);
          return this.streamPart(info, part, host, triedHosting);
        }
      }
    }
    throw Error("No part available");
  }

  private async pingAndValidateParts(info: StreamInfo): Promise<Map<string, IHosting[]>> {
    const allPartFiles = [...Array(info.fileCount)].map(
      (_, i) => `${info.id}${i > 0 ? `_${i}` : ""}.${info.fileExtension}`
    );

    const partToHosts = new Map<string, IHosting[]>();
    allPartFiles.forEach(file => partToHosts.set(file, []));

    // Helper to parse part filename into base UUID and part number (matches HostingPartProvider logic)
    const parsePartFile = (partFile: string) => {
      const match = partFile.match(/^(.+?)(?:_(\d+))?\.[^.]+$/);
      if (!match) return null;
      const baseUuid = match[1];
      const suffix = match[2];
      let partNumber: number;
      if (suffix === undefined) {
        partNumber = 1; // No suffix = first part
      } else {
        partNumber = parseInt(suffix, 10) + 1; // _N suffix = part N+1
      }
      return { baseUuid, partNumber };
    };

    const pingPromises = info.hostingList.map(async (hosting) => {
      try {
        const provider = getPartProvider(hosting, this.reqHeaders);
        const pingResult = await provider.ping();
        if (!pingResult?.available || !Array.isArray(pingResult.files)) return;

        // Build map of base UUID to part ranges from ping result
        const baseToParts = new Map<string, string>();
        for (const f of pingResult.files) {
          baseToParts.set(f.fileName, f.parts); // f.fileName = base UUID, f.parts = "1-11" or "1,3-5"
        }

        // Check each part file against this host's available parts
        allPartFiles.forEach(partFile => {
          const parsed = parsePartFile(partFile);
          if (!parsed) return;
          const { baseUuid, partNumber } = parsed;
          const partsRange = baseToParts.get(baseUuid);
          if (!partsRange) return;

          // Check if partNumber is within the range(s)
          const ranges = partsRange.split(',');
          let partExists = false;
          for (const range of ranges) {
            const [startStr, endStr] = range.split('-');
            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : start;
            if (partNumber >= start && partNumber <= end) {
              partExists = true;
              break;
            }
          }

          if (partExists) {
            partToHosts.get(partFile)?.push(hosting);
          }
        });
      } catch (e) {
        console.log(`[${"Ping".padStart(15)}] Host ${hosting.host} failed: ${e}`);
      }
    });

    await Promise.all(pingPromises);

    const missingParts = [...partToHosts.entries()]
      .filter(([_, hosts]) => hosts.length === 0)
      .map(([part]) => part);

    if (missingParts.length > 0) {
      throw new Error(`File corrupted: missing parts ${missingParts.join(", ")}`);
    }

    return partToHosts;
  }

  async stream(info: StreamInfo, outputSteam: Writable, res?: Response) {
    let multiStream: MultiStream | null = null;
    let headerSent = false; // TODO: temp fix

    // Pre-ping and validate all parts
    let partToAvailableHosts: Map<string, IHosting[]> = new Map();

    try {
      partToAvailableHosts = await this.pingAndValidateParts(info);
      console.log(`[ ${"Stream".padStart(15)} ] All parts validated. Available hosts per part: ${
        JSON.stringify([...partToAvailableHosts].map(([f, h]) => [f, h.map(x => x.host)]))
      }`);
    } catch (e: any) {
      console.error(`[ ${"Stream".padStart(15)} ] Validation failed: ${e.message}`);
      if (res) {
        fail(res, e.message, 500);
      }
      return;
    }

    const partSize = Math.min(PARTSIZE, info.hostingList[0].ftpLimit); // temp fix
    const range = parseRange(this.reqHeaders["range"], info.size);

    const fileList = [...Array(info.fileCount)].map(
      (_, i) => `${info.id}${i > 0 ? `_${i}` : ""}.${info.fileExtension}`
    );

    const parts = this.getParts(fileList, partSize, info.size, range.start, range.end);

    console.log(
      `[ ${"Stream".padStart(15)} ] ${info.id} ${range.start}-${range.end} (${parts.length} parts)`
    );

    let partIdx = 0;
    const streamFactory: MultiStream.FactoryStream = async (cb) => {
      if (partIdx >= parts.length) {
        console.log(`[ ${"MultiStream".padStart(15)} ] Completed`);
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
            console.log(`[ ${"MultiStream".padStart(15)} ] ${partFileName}: Ready from ${selectedHost.host}`);
            stream.pipe(newCacheStream);
            cb(null, removeStreamPadding(cache.get(partFileName)!, currentPart));
          } catch (e) {
            console.log(
              `[ ${"Stream part".padStart(15)} ] ${
                info.id
              }: Part ${partIdx} failed from ${selectedHost.host}: ${e}`
            );
            newCacheStream.destroy(e as Error);
            cb(e as Error, null);
          }
        }
        partIdx++;
      } catch (e) {
        console.log(
          `[ ${"Stream part".padStart(15)} ] ${info.id}: Part ${partIdx} stream factory ${e}`
        );
        cb(e as Error, null);
      }
    };

    // for (let partIdx = 0; partIdx < parts.length; partIdx++) {
    //   const hosting = song.hostingList[partIdx % song.hostingList.length];
    //   const stream = await this.streamPart(song, parts[partIdx], hosting);
    //   streams[partIdx] = stream;
    // }

    // make sure every parts is available before sending headers.
    const _contentType = contentType.getContentType(info.fileExtension ?? info.format);

    multiStream = new MultiStream(streamFactory)
      .on("error", (e) => {
        console.error("[Error] MultiStream " + e);
        if (!headerSent) {
          // send error message to client
          fail(res, e.message, 500);
        } else {
          // close the stream
          res?.destroy(e);
        }
      })
      .on("end", () => {
        console.log(`[ ${"MultiStream".padStart(15)} ] Ended`);
      })
      .on("close", () => {
        console.log(`[ ${"MultiStream".padStart(15)} ] Closed`);
      });

    console.log(
      `[ ${"MultiStream".padStart(15)} ] Write header: ${_contentType} ${
        range.start
      }-${range.end}/${info.size} (len=${range.end - range.start + 1})`
    );
    res?.writeHead(206, "Partial Content", {
      "Accept-Ranges": "bytes",
      "Content-Length": range.end - range.start + 1,
      "content-range": `bytes ${range.start}-${range.end}/${info.size}`,
      "Content-Type": _contentType,
      "cache-control": "public, max-age=60"
    });
    headerSent = true;
    multiStream.pipe(outputSteam);
  }

  stopStream() {
    // this.multiStream?.emit("error", Error("stopStream()"));
    // this.outputSteam.end();
  }
}
