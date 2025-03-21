import { Readable } from "node:stream";
import { CacheValue, StreamingCache } from "../utils/stream-cache";

class MyStreamCache {
  private _promiseCachedMap: Record<string, number> = {}; // [key]: isPromised

  private _cache = new StreamingCache({
    maxSize: 1024 * 1024 * 400, // 400MB
    maxEntrySize: 1024 * 1024 * 50, // 50MB
    noDisposeOnSet: true,
    dispose: (value: CacheValue, key: string): void => {
      console.log(`[ ${"Cache".padStart(15)} ] ${key}: REMOVE Cache`);
      delete this._promiseCachedMap[key];
    }
  });

  set(key: string) {
    console.log(`[ ${"Cache".padStart(15)} ] ${key}: SET Cache`);
    const stream = this._cache.set(key);

    stream.on("error", (err) => {
      console.error(`[Error] CACHE ${key} ` + err);
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
      console.log(
        `[ ${"Cache".padStart(15)} ] ${key}: SET Cache (size = ${this._promiseCachedMap[key]})`
      );
    });
    stream.on("close", () => {
      console.log(`[ ${"Cache".padStart(15)} ] ${key}: SET Cache (Closed)`);
    });

    this._promiseCachedMap[key] = 0; // add to cache

    return stream;
  }
  get(key: string): Readable | null {
    if (this._promiseCachedMap[key] != null) {
      const cached = this._cache.get(key);
      if (cached != null) {
        console.log(
          `[ ${"Cache".padStart(15)} ] ${key}: GET Cache (${this._promiseCachedMap[key]})`
        );
        return cached;
      } else {
        console.error(`[ ${"Cache".padStart(15)} ] ${key}: Invalid cache state. NOT FOUND`);
      }
    }
    console.log(`[ ${"Cache".padStart(15)} ] ${key}: GET No cache`);
    return null;
  }

  deleteStream(key: string) {
    console.log(`[ ${"Cache".padStart(15)} ] ${key}: DEL`);
    this._cache.set(key); // clear old stream.
    delete this._promiseCachedMap[key]; // remove from cache
  }
}
export const cache = new MyStreamCache();
