import { DbDocument } from "../../types/type.js";
import { IHosting } from "../../models/Hosting.js";
import { AlbumBuilder } from "./AlbumBuilder.js";
import { Builder } from "./index.js";
import crypto from "crypto";

export class ContentBuilder<T> extends Builder<T> {
  iv = crypto.randomBytes(16);
  title(): string {
    throw Error("Not implemented");
  }
  fileCount(_fileCount: number) {}
  attachAlbum(_album: AlbumBuilder) {}
  addHosting(_hosting: DbDocument<IHosting>) {}
}
