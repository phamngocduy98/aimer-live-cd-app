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
  hosts: {
    name: string;
    provider?: string;
    urlBase: string;
    requestHeaders?: Record<string, string>;
  }[];
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

interface ParsedSetCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expirationDate?: number;
  sameSite?: "unspecified" | "no_restriction" | "lax" | "strict";
}

function localMediaHeaders(headers: http.OutgoingHttpHeaders = {}): http.OutgoingHttpHeaders {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, Content-Type",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Timing-Allow-Origin": "*",
    ...headers
  };
}

function responseHeader(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return undefined;
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

function parseSetCookieHeader(header: string): ParsedSetCookie | null {
  const [pair, ...attributes] = header.split(";").map((part) => part.trim());
  const separator = pair.indexOf("=");
  if (separator <= 0) return null;

  const cookie: ParsedSetCookie = {
    name: decodeURIComponent(pair.slice(0, separator)),
    value: decodeURIComponent(pair.slice(separator + 1))
  };

  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const value = rawValue.join("=");
    if (key === "path") cookie.path = value;
    if (key === "domain") cookie.domain = value;
    if (key === "secure") cookie.secure = true;
    if (key === "httponly") cookie.httpOnly = true;
    if (key === "max-age") cookie.expirationDate = Math.floor(Date.now() / 1000) + Number(value);
    if (key === "expires") cookie.expirationDate = Math.floor(new Date(value).getTime() / 1000);
    if (key === "samesite") {
      const sameSite = value.toLowerCase();
      cookie.sameSite =
        sameSite === "none"
          ? "no_restriction"
          : sameSite === "lax" || sameSite === "strict"
            ? sameSite
            : "unspecified";
    }
  }

  return cookie;
}

async function storeSetCookies(apiBaseUrl: string, setCookie: string[] | undefined): Promise<void> {
  if (!setCookie?.length) return;
  const origin = apiOrigin(apiBaseUrl);

  await Promise.all(
    setCookie.map(async (header) => {
      const cookie = parseSetCookieHeader(header);
      if (!cookie) return;

      await session.defaultSession.cookies.set({
        url: origin,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate,
        sameSite: cookie.sameSite
      });
    })
  );
}

async function refreshAuthCookies(apiBaseUrl: string): Promise<boolean> {
  const cookie = await cookieHeaderFor(apiBaseUrl);
  const response = await axios.post(`${apiBaseUrl}/auth/refresh`, undefined, {
    headers: cookie ? { Cookie: cookie } : undefined,
    validateStatus: () => true
  });

  await storeSetCookies(apiBaseUrl, response.headers["set-cookie"]);
  return response.status >= 200 && response.status < 300;
}

async function fetchManifest(
  apiBaseUrl: string,
  mediaType: MediaType,
  id: string,
  refreshed = false
): Promise<DirectStreamManifest> {
  const cookie = await cookieHeaderFor(apiBaseUrl);
  const response = await axios.get<DirectStreamManifest>(
    `${apiBaseUrl}/stream/direct/${mediaType}/${id}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined,
      validateStatus: () => true
    }
  );

  if (response.status === 401 && !refreshed && (await refreshAuthCookies(apiBaseUrl))) {
    return fetchManifest(apiBaseUrl, mediaType, id, true);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new axios.AxiosError(
      `Request failed with status code ${response.status}`,
      undefined,
      response.config,
      response.request,
      response
    );
  }

  return response.data;
}

async function proxyBackendStream(
  apiBaseUrl: string,
  mediaType: MediaType,
  id: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  refreshed = false
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

  if (response.status === 401 && !refreshed && (await refreshAuthCookies(apiBaseUrl))) {
    response.data.destroy();
    await proxyBackendStream(apiBaseUrl, mediaType, id, req, res, true);
    return;
  }
  if (response.status < 200 || response.status >= 300) {
    response.data.destroy();
    res.writeHead(response.status, response.statusText, localMediaHeaders({ "Content-Length": 0 }));
    res.end();
    return;
  }

  res.writeHead(
    response.status,
    response.statusText,
    localMediaHeaders(response.headers as http.OutgoingHttpHeaders)
  );
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
            ...host.requestHeaders,
            Range: `bytes=0-${Number.MAX_SAFE_INTEGER}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
          }
        }
      );
      const contentType = responseHeader(response.headers["content-type"])?.toLowerCase();
      const buffer = Buffer.from(response.data);

      if (contentType?.includes("text/html")) {
        throw new Error(`${host.name} returned HTML instead of encrypted media part`);
      }
      if (buffer.length < part.partSize) {
        throw new Error(
          `${host.name} returned ${buffer.length} bytes for ${part.fileName}; expected ${part.partSize}`
        );
      }

      return buffer;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${part.fileName}`);
}

async function pipeParts(manifest: DirectStreamManifest, parts: StreamPart[]): Promise<Buffer> {
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
  res.writeHead(status, localMediaHeaders({ "Content-Length": 0 }));
  res.end();
}

export async function startDirectStreamServer(apiBaseUrl: string): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        res.writeHead(204, localMediaHeaders({ "Content-Length": 0 }));
        res.end();
        return;
      }

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
        ...localMediaHeaders({
          "Accept-Ranges": "bytes",
          "Content-Type": manifest.contentType,
          "Content-Length": body.length,
          "Content-Range": `bytes ${range.start}-${range.end}/${manifest.size}`,
          "Cache-Control": "no-store"
        })
      });
      res.end(req.method === "HEAD" ? undefined : body);
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
