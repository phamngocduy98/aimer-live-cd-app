import { Readable } from "stream";

export class ReadStream extends Readable {
  private _offset: number = 0;
  public readable: boolean = false;
  public complete: boolean = false;
  private _object: Buffer = Buffer.alloc(0);

  private ended: boolean = false;

  constructor() {
    super();
  }

  setBuffer(_object: Buffer): void {
    this.complete = true;
    this._object = _object;
    this._push();
  }

  updateBuffer(_object: Buffer): void {
    this._object = _object;
  }

  private _push(size?: number): void {
    if (this.ended || !this._object.length) {
      return;
    }

    if (this.complete && this._offset === this._object.length && !this.readableEnded) {
      this.push(null);
      this.ended = true;
      return;
    }

    size = size || 24 * 1024;
    size = Math.min(size, this._object.length - this._offset);

    if (this._offset < this._object.length) {
      const currentOffset = this._offset;
      const nextOffset = this._offset + size;
      this._offset = nextOffset;

      try {
        this.push(this._object.subarray(currentOffset, nextOffset));
      } catch (err) {
        this.emit("error", err);
      }
    }
  }

  _read(size: number): void {
    this._push(size);
  }
}
