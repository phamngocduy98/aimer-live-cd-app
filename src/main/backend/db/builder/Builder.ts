import { IAudioMetadata } from "music-metadata";

import { Types } from "mongoose";
import { DbDocument } from "../../types/type.js";

export class Builder<T> {
  _id = new Types.ObjectId();
  doc: DbDocument<T> | null = null;

  async init(_meta: IAudioMetadata, _size: number, _fileExtension: string) {}
  get(): DbDocument<T> {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc;
  }
  async save(): Promise<DbDocument<T>> {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc.save();
  }
}
