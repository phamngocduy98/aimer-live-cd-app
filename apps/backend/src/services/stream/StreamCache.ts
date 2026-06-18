import { Readable } from "node:stream";
import { CacheValue, StreamingCache } from "../../utils/stream-cache";
import { createLogger } from "../../utils/log.js";

const log = createLogger("Cache");

class StreamCache {
  private _promiseCachedMap: Record<string, number> = {};

  private _cache = new StreamingCache({
    maxSize: 1024 * 1024 * 400,
    maxEntrySize: 1024 * 1024 * 50,
    noDisposeOnSet: true,
    dispose: (_value: CacheValue, key: string): void => {
      log.debug(`${key}: REMOVE Cache`);
      delete this._promiseCachedMap[key];
    }
  });

  set(key: string) {
    log.debug(`${key}: SET Cache`);
    const stream = this._cache.set(key);

    stream.on("error", (err) => {
      log.error({ err }, `CACHE ${key} error`);
      this.deleteStream(key);
    });

    const timeout = setTimeout(() => {
      stream.destroy(Error("Stream timeout (60s)"));
    }, 60000);

    stream.on("data", (chuck) => {
      this._promiseCachedMap[key] += Buffer.byteLength(chuck);
    });
    stream.on("end", () => {
      clearTimeout(timeout);
      log.debug(`${key}: SET Cache (size = ${this._promiseCachedMap[key]})`);
    });
    stream.on("close", () => {
      log.debug(`${key}: SET Cache (Closed)`);
    });

    this._promiseCachedMap[key] = 0;

    return stream;
  }
  get(key: string): Readable | null {
    if (this._promiseCachedMap[key] != null) {
      const cached = this._cache.get(key);
      if (cached != null) {
        log.debug(`${key}: GET Cache (${this._promiseCachedMap[key]})`);
        return cached;
      } else {
        log.warn(`${key}: Invalid cache state. NOT FOUND`);
      }
    }
    log.debug(`${key}: GET No cache`);
    return null;
  }

  deleteStream(key: string) {
    log.debug(`${key}: DEL`);
    this._cache.set(key);
    delete this._promiseCachedMap[key];
  }
}
export const cache = new StreamCache();
