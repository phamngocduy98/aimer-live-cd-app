import http from "node:http";
import { Stream } from "stream";
import zlib from "node:zlib";
import { AxiosResponse } from "axios";

// TODO: haven't checked
export async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}

export async function resp2string(resp: AxiosResponse<any, any>): Promise<string> {
  const buff = await stream2buffer(resp.data);
  return new Promise<string>((resolve, reject) => {
    switch (resp.headers["content-encoding"]) {
      case "br":
        zlib.brotliDecompress(buff, (e, r) => resolve(r.toString("utf-8")));
        break;
      // Or, just use zlib.createUnzip() to handle both of the following cases:
      case "gzip":
        zlib.gunzip(buff, (e, r) => resolve(r.toString("utf-8")));
        break;
      case "deflate":
        zlib.inflate(buff, (e, r) => resolve(r.toString("utf-8")));
        break;
      default:
        resolve(buff.toString());
        break;
    }
  });
}

export async function waitStreamClose(stream: Stream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on("close", () => resolve());
    stream.on("error", (err) => reject(err));
  });
}
