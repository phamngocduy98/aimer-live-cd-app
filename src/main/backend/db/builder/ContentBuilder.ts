import { IAudioMetadata } from "music-metadata";
import { DbDocument } from "../../utils/type.js";
import { IHosting } from "../Hosting.js";
import { AlbumBuilder } from "./AlbumBuilder.js";
import { Builder } from "./index.js";
import crypto from "crypto";

export class ContentBuilder<T> extends Builder<T> {
  iv = crypto.randomBytes(16);
  title(): string {
    throw Error("Not implemented");
  }
  fileCount(fileCount: number) {}
  attachAlbum(album: AlbumBuilder) {}
  addHosting(hosting: DbDocument<IHosting>) {}
}
