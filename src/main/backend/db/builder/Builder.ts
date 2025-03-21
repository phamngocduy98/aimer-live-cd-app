import { IAudioMetadata } from "music-metadata";

import { Types } from "mongoose";
import { DbDocument } from "../../utils/type.js";

export class Builder<T> {
  _id = new Types.ObjectId();
  doc: DbDocument<T> | null = null;

  async init(meta: IAudioMetadata, size: number, fileExtension: string) {}
  get(): DbDocument<T> {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc;
  }
  async save(): Promise<DbDocument<T>> {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc.save();
  }
}
