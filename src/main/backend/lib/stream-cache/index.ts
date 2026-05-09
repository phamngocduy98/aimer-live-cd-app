import { EventEmitter } from "events";
import { Duplex } from "stream";
import { LRUCache } from "lru-cache";
import LinkedList from "linkedlist";
import { ensureDefined, assign as mAssign } from "./utils";
import assign from "lodash.assign";
import { ReadStream } from "./readStream.js";

enum CacheStatus {
  PENDING = 1,
  DONE = 2
}

export interface CacheValue {
  data?: Buffer;
  metadata: Record<string, unknown>;
  status: CacheStatus;
}

interface StreamEmitter extends EventEmitter {
  _buffer: Buffer[];
  _events: Record<string, unknown>;
}

interface DuplexStream extends Duplex {
  unfullfilledReadCount: number;
}

const DEFAULT_SIZE_CALCULATION = (value: CacheValue): number => {
  return value.data ? value.data.length : 1;
};

export class StreamingCache {
  private cache: LRUCache<string, CacheValue>;
  private emitters: Record<string, StreamEmitter>;

  constructor(
    options?: LRUCache<string, CacheValue, unknown> | LRUCache.Options<string, CacheValue, unknown>
  ) {
    this.cache = new LRUCache<string, CacheValue>({
      max: options?.max ?? 500,
      maxEntrySize: options?.maxEntrySize ?? 1024 * 1024 * 50,
      sizeCalculation: options?.sizeCalculation || DEFAULT_SIZE_CALCULATION,
      allowStale: false
    });
    this.emitters = {};
  }

  get length(): number {
    return this.cache.calculatedSize;
  }

  get itemCount(): number {
    return this.cache.size;
  }

  setData(key: string, data: Buffer): this {
    ensureDefined(key, "Key");

    this.cache.set(key, {
      data,
      metadata: this.getMetadata(key) || {},
      status: CacheStatus.DONE
    });

    return this;
  }

  getData(key: string, callback: (error: Error | string | null, data?: Buffer) => void): void {
    ensureDefined(key, "Key");
    ensureDefined(callback, "Callback");

    const hit = this.cache.get(key);

    if (!hit) {
      return callback("Cache miss");
    }

    if (hit.status === CacheStatus.DONE) {
      return callback(null, hit.data);
    }

    this.emitters[key].on("error", (error: Error) => {
      callback(error);
    });

    this.emitters[key].on("end", () => {
      const currentHit = this.cache.get(key);
      callback(null, currentHit?.data);
    });
  }

  setMetadata(key: string, metadata: Record<string, unknown>): void {
    ensureDefined(key, "Key");

    const data = assign({}, this.cache.get(key), { metadata });
    this.cache.set(key, data);
  }

  getMetadata(key: string): Record<string, unknown> | null {
    ensureDefined(key, "Key");

    const hit = this.cache.get(key);
    return hit?.metadata ?? null;
  }

  exists(key: string): boolean {
    ensureDefined(key, "Key");
    return this.cache.has(key);
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  private returnPendingStream(key: string): ReadStream {
    const stream = new ReadStream();

    this.emitters[key].on("error", (error: Error) => {
      stream.emit("error", error);
    });

    this.emitters[key].on("end", (data: Buffer) => {
      stream.setBuffer(data);
    });

    this.emitters[key].on("data", () => {
      stream.updateBuffer(Buffer.concat(this.emitters[key]._buffer));
    });

    stream.updateBuffer(Buffer.concat(this.emitters[key]._buffer));
    return stream;
  }

  get(key: string): ReadStream | undefined {
    ensureDefined(key, "Key");

    const hit = this.cache.get(key);
    if (!hit) {
      return undefined;
    }

    if (hit.status === CacheStatus.PENDING) {
      return this.returnPendingStream(key);
    }

    const stream = new ReadStream();
    stream.setBuffer(hit.data!);
    return stream;
  }

  set(key: string): Duplex {
    ensureDefined(key, "Key");

    const self = this;

    const metadata = this.getMetadata(key) || {};
    this.cache.set(key, { status: CacheStatus.PENDING, metadata });

    this.emitters[key] = new EventEmitter() as StreamEmitter;
    this.emitters[key].setMaxListeners(250);
    this.emitters[key]._buffer = [];

    const chunks = new LinkedList();
    const stream = new Duplex() as DuplexStream;
    stream.unfullfilledReadCount = 0;

    stream._read = function (this: DuplexStream): void {
      if (chunks.length) {
        const chunk = chunks.shift();
        this.push(chunk);
        this.unfullfilledReadCount =
          this.unfullfilledReadCount > 0
            ? this.unfullfilledReadCount - 1
            : this.unfullfilledReadCount;
      } else {
        this.unfullfilledReadCount = this.unfullfilledReadCount + 1;
      }
    };

    stream._write = function (
      this: DuplexStream,
      chunk: Buffer,
      encoding: string,
      next: (error?: Error) => void
    ): void {
      if (!self.emitters[key]) {
        return next(new Error("emitter already destroyed"));
      }

      self.emitters[key]._buffer.push(chunk);
      self.emitters[key].emit("data", chunk);

      if (this.unfullfilledReadCount > 0) {
        this.push(chunk);
        this.unfullfilledReadCount = this.unfullfilledReadCount - 1;
      } else {
        chunks.push(chunk);
      }
      next();
    };

    stream.on("error", (err: Error) => {
      this.cache.delete(key);
      if (this.emitters[key]?._events.error) {
        this.emitters[key].emit("error", err);
      }
      stream.removeAllListeners();
      if (this.emitters[key]) {
        this.emitters[key].removeAllListeners();
        delete this.emitters[key];
      }
    });

    stream.on("finish", function (this: DuplexStream): void {
      if (this.unfullfilledReadCount > 0) {
        this.push(null);
      } else {
        chunks.push(null);
      }

      if (!self.emitters[key]) return;

      const hit = self.cache.get(key);
      if (hit) {
        const buffer = Buffer.concat(self.emitters[key]._buffer);
        hit.metadata = hit.metadata || {};
        mAssign(hit.metadata, {
          length: buffer.toString().length,
          byteLength: buffer.byteLength
        });
        mAssign(hit, {
          data: buffer,
          status: CacheStatus.DONE
        });
        self.cache.set(key, hit);
      }

      self.emitters[key].emit("end", Buffer.concat(self.emitters[key]._buffer));
      delete self.emitters[key];
    });

    return stream;
  }

  reset(): void {
    this.cache.clear();
  }
}
