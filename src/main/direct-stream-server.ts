import axios from "axios";
import { session } from "electron";
import http from "node:http";
import crypto from "node:crypto";
import { Readable } from "node:stream";

type MediaType = "audio" | "video";

interface DirectStreamManifest {
  id: string;
  mediaType: MediaType;
  key: string;
  iv: string;
  size: number;
  partSize: number;
  contentType: string;
  files: string[];
  hosts: { name: string; urlBase: string }[];
}

interface ByteRange {
  start: number;
  end: number;
}

interface StreamPart {
  partIndex: number;
  fileName: string;
  partSize: number;
  partByteStart: number;
  partByteEnd: number;
}

function parseRange(rangeHeader: string | undefined, size: number): ByteRange {
  let match = rangeHeader?.match(/bytes=(\d+)-(\d+)/);
  if (match) {
    return {
      start: Math.max(0, Number(match[1])),
      end: Math.min(size - 1, Number(match[2]))
    };
  }

  match = rangeHeader?.match(/bytes=(\d+)-/);
  if (match) {
    return { start: Math.max(0, Number(match[1])), end: size - 1 };
  }

  match = rangeHeader?.match(/bytes=-(\d+)/);
  if (match) {
    const suffixLength = Math.max(0, Number(match[1]));
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  return { start: 0, end: size - 1 };
}

function capRange(range: ByteRange, size: number, maxBytes: number): ByteRange {
  return {
    start: range.start,
    end: Math.min(range.end, range.start + maxBytes - 1, size - 1)
  };
}

function partsForRange(manifest: DirectStreamManifest, range: ByteRange): StreamPart[] {
  const startIdx = Math.floor(range.start / manifest.partSize);
  const endIdx = Math.floor(range.end / manifest.partSize);
  const parts: StreamPart[] = [];

  for (let index = startIdx; index <= endIdx; index++) {
    const partStart = index === startIdx ? range.start % manifest.partSize : 0;
    const partEnd = index === endIdx ? range.end % manifest.partSize : manifest.partSize - 1;
    const partSize =
      manifest.partSize * (index + 1) > manifest.size
        ? manifest.size % manifest.partSize || manifest.partSize
        : manifest.partSize;

    parts.push({
      partIndex: index,
      fileName: manifest.files[index],
      partSize,
      partByteStart: partStart,
      partByteEnd: Math.min(partEnd, partSize - 1)
    });
  }

  return parts;
}

function trimDecryptedPart(input: Buffer, part: StreamPart): Buffer {
  if (part.partByteStart === 0 && part.partByteEnd === part.partSize - 1) return input;
  return input.subarray(part.partByteStart, part.partByteEnd + 1);
}

function decryptPart(input: Buffer, manifest: DirectStreamManifest): Buffer {
  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    Buffer.from(manifest.key, "hex"),
    Buffer.from(manifest.iv, "hex")
  );
  return Buffer.concat([decipher.update(input), decipher.final()]);
}

function apiOrigin(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  return `${url.protocol}//${url.host}`;
}

async function cookieHeaderFor(apiBaseUrl: string): Promise<string | undefined> {
  const cookies = await session.defaultSession.cookies.get({ url: apiOrigin(apiBaseUrl) });
  if (cookies.length === 0) return undefined;
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function fetchManifest(
  apiBaseUrl: string,
  mediaType: MediaType,
  id: string
): Promise<DirectStreamManifest> {
  const cookie = await cookieHeaderFor(apiBaseUrl);
  const response = await axios.get<DirectStreamManifest>(
    `${apiBaseUrl}/stream/direct/${mediaType}/${id}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined
    }
  );
  return response.data;
}

async function proxyBackendStream(
  apiBaseUrl: string,
  mediaType: MediaType,
  id: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const cookie = await cookieHeaderFor(apiBaseUrl);
  const response = await axios.get<Readable>(`${apiBaseUrl}/stream/${mediaType}/${id}`, {
    responseType: "stream",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(req.headers.range ? { Range: req.headers.range } : {})
    },
    validateStatus: () => true
  });

  res.writeHead(response.status, response.statusText, response.headers as http.OutgoingHttpHeaders);
  response.data.on("error", () => {
    if (!res.destroyed) res.end();
  });
  response.data.pipe(res);
}

async function fetchEncryptedPart(
  manifest: DirectStreamManifest,
  part: StreamPart
): Promise<Buffer> {
  if (manifest.hosts.length === 0) throw new Error("No direct stream hosts available");

  let lastError: unknown;

  const attempts = manifest.hosts.length * 2;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const host = manifest.hosts[attempt % manifest.hosts.length];
    try {
      const urlBase = host.urlBase.replace(/\/+$/, "");
      const response = await axios.get<ArrayBuffer>(
        `${urlBase}/${encodeURIComponent(part.fileName)}`,
        {
          responseType: "arraybuffer",
          timeout: 15000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          headers: {
            Range: `bytes=0-${Number.MAX_SAFE_INTEGER}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
          }
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${part.fileName}`);
}

async function pipeParts(
  manifest: DirectStreamManifest,
  parts: StreamPart[]
): Promise<Buffer> {
  const buffers: Buffer[] = [];
  for (const part of parts) {
    const encrypted = await fetchEncryptedPart(manifest, part);
    const decrypted = decryptPart(encrypted, manifest);
    buffers.push(trimDecryptedPart(decrypted, part));
  }
  return Buffer.concat(buffers);
}

function respondError(res: http.ServerResponse, status: number, message: string): void {
  if (res.headersSent) {
    res.destroy(new Error(message));
    return;
  }
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

export async function startDirectStreamServer(apiBaseUrl: string): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      const [, mediaType, id] = requestUrl.pathname.split("/");
      if ((mediaType !== "audio" && mediaType !== "video") || !id) {
        respondError(res, 404, "Not found");
        return;
      }

      let manifest: DirectStreamManifest;
      try {
        manifest = await fetchManifest(apiBaseUrl, mediaType, id);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await proxyBackendStream(apiBaseUrl, mediaType, id, req, res);
          return;
        }
        throw error;
      }

      const requestedRange = parseRange(req.headers.range, manifest.size);
      const range = capRange(requestedRange, manifest.size, manifest.partSize);
      if (range.start > range.end || range.start >= manifest.size) {
        respondError(res, 416, "Range not satisfiable");
        return;
      }

      const parts = partsForRange(manifest, range);
      let body: Buffer;
      try {
        body = await pipeParts(manifest, parts);
      } catch {
        await proxyBackendStream(apiBaseUrl, mediaType, id, req, res);
        return;
      }

      res.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Content-Type": manifest.contentType,
        "Content-Length": body.length,
        "Content-Range": `bytes ${range.start}-${range.end}/${manifest.size}`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(body);
    } catch (error) {
      const status = axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;
      respondError(res, status, error instanceof Error ? error.message : "Stream error");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Direct stream server did not bind to a TCP port");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}
