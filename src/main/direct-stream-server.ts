import axios from "axios";
import { session } from "electron";
import http from "node:http";
import crypto from "node:crypto";
import { PassThrough, Readable, Transform } from "node:stream";

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

interface PreparedPart {
  part: StreamPart;
  stream: Readable;
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

function trimDecryptedPart(input: Readable, part: StreamPart): Readable {
  if (part.partByteStart === 0 && part.partByteEnd === part.partSize - 1) return input;

  let position = 0;
  return input.pipe(
    new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        const chunkStart = position;
        const chunkEnd = position + chunk.length - 1;
        position += chunk.length;

        if (chunkEnd < part.partByteStart || chunkStart > part.partByteEnd) {
          callback();
          return;
        }

        const start = Math.max(0, part.partByteStart - chunkStart);
        const end = Math.min(chunk.length, part.partByteEnd - chunkStart + 1);
        callback(null, chunk.subarray(start, end));
      }
    })
  );
}

function decryptPart(input: Readable, manifest: DirectStreamManifest): Readable {
  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    Buffer.from(manifest.key, "hex"),
    Buffer.from(manifest.iv, "hex")
  );
  input.on("error", (error) => decipher.destroy(error));
  return input.pipe(decipher);
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
): Promise<Readable> {
  let lastError: unknown;

  for (const host of manifest.hosts) {
    try {
      const urlBase = host.urlBase.replace(/\/+$/, "");
      const response = await axios.get<Readable>(
        `${urlBase}/${encodeURIComponent(part.fileName)}`,
        {
          responseType: "stream",
          timeout: 15000,
          headers: {
            Range: `bytes=0-${Number.MAX_SAFE_INTEGER}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
          }
        }
      );
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${part.fileName}`);
}

async function pipeParts(
  output: PassThrough,
  manifest: DirectStreamManifest,
  parts: StreamPart[],
  preparedFirstPart?: PreparedPart
): Promise<void> {
  for (const [index, part] of parts.entries()) {
    const encrypted =
      index === 0 && preparedFirstPart?.part === part
        ? preparedFirstPart.stream
        : await fetchEncryptedPart(manifest, part);
    const decrypted = decryptPart(encrypted, manifest);
    const trimmed = trimDecryptedPart(decrypted, part);

    await new Promise<void>((resolve, reject) => {
      encrypted.on("error", reject);
      decrypted.on("error", reject);
      trimmed.on("error", reject);
      trimmed.on("end", resolve);
      trimmed.pipe(output, { end: false });
    });
  }
  output.end();
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

      const range = parseRange(req.headers.range, manifest.size);
      if (range.start > range.end || range.start >= manifest.size) {
        respondError(res, 416, "Range not satisfiable");
        return;
      }

      const parts = partsForRange(manifest, range);
      let preparedFirstPart: PreparedPart | undefined;
      if (parts[0]) {
        try {
          preparedFirstPart = {
            part: parts[0],
            stream: await fetchEncryptedPart(manifest, parts[0])
          };
        } catch {
          await proxyBackendStream(apiBaseUrl, mediaType, id, req, res);
          return;
        }
      }

      const body = new PassThrough();
      body.on("error", () => {
        if (!res.destroyed) res.end();
      });
      res.writeHead(req.headers.range ? 206 : 200, {
        "Accept-Ranges": "bytes",
        "Content-Type": manifest.contentType,
        "Content-Length": range.end - range.start + 1,
        "Content-Range": `bytes ${range.start}-${range.end}/${manifest.size}`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      });
      body.pipe(res);
      pipeParts(body, manifest, parts, preparedFirstPart).catch(() => {
        body.end();
        if (!res.destroyed) res.end();
      });
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
