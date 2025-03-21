import { Response } from "express";
import MultiStream from "multistream";
import http from "node:http";
import { Readable, Transform, Writable } from "node:stream";
import { PARTSIZE } from "../const.js";
import { IHosting } from "../db/Hosting.js";
import { ISong } from "../db/Song.js";
import { parseRange } from "../utils/http.js";
import { DbDocument, WithDocument } from "../utils/type.js";
import { contentType } from "./contentType.js";
import { getPartProvider } from "./part_provider/index.js";
import { StreamFilePart } from "./StreamFilePart.js";
import { cache } from "./MyStreamCache.js";
import { Types } from "mongoose";
import { StreamInfo } from "./StreamInfo.js";
import { removeStreamPadding } from "../utils/removeStreamPadding.js";
import { fail } from "../utils/reqUtils.js";

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

  stream(info: StreamInfo, outputSteam: Writable, res?: Response) {
    let multiStream: MultiStream | null = null;
    let headerSent = false; // TODO: temp fix

    const partSize = Math.min(PARTSIZE, info.hostingList[0].ftpLimit); // temp fix
    const range = parseRange(this.reqHeaders["range"], info.size);

    const fileList =
      info.fileList ??
      [...Array(info.fileCount)].map(
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
        const hosting = info.hostingList[partIdx % info.hostingList.length];
        const fileName = parts[partIdx].fileName;

        let stream = cache.get(fileName);
        if (stream) {
          cb(null, removeStreamPadding(stream, parts[partIdx]));
        } else {
          const newCacheStream = cache.set(fileName);
          try {
            stream = await this.streamPart(info, parts[partIdx], hosting);
            console.log(`[ ${"MultiStream".padStart(15)} ] ${parts[partIdx].fileName}: Ready`);
            stream.pipe(newCacheStream);
            cb(null, removeStreamPadding(cache.get(fileName)!, parts[partIdx]));
          } catch (e) {
            console.log(
              `[ ${"Stream part".padStart(15)} ] ${
                info.id
              }: Part ${partIdx} fail to get from source`
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
