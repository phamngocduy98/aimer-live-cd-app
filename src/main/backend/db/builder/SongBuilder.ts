import { Types } from "mongoose";
import { IAudioMetadata } from "music-metadata";
import { DbDocument } from "../../utils/type.js";
import { IHosting } from "../Hosting.js";
import { ISong, Song } from "../Song.js";
import { ContentBuilder } from "./ContentBuilder.js";
import { AlbumBuilder } from "./AlbumBuilder.js";

export class SongBuilder extends ContentBuilder<ISong> {
  title() {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc.title;
  }

  async init(meta: IAudioMetadata, size: number, fileExtension: string) {
    this.doc = await Song.findOne({
      title: meta.common.title,
      size,
      duration: meta.format.duration
    });
    this._id = this.doc?._id ?? new Types.ObjectId();
    if (this.doc?.iv) this.iv = Buffer.from(this.doc.iv, "hex");

    if (this.doc == null) {
      this.doc = new Song({
        _id: this._id,
        trackNo: meta.common.track.no ?? meta.common.disk.no,
        title: meta.common.title,
        artist: meta.common.artists,
        size,
        duration: meta.format.duration,

        format: meta.format.container,
        bitrate: meta.format.bitrate,
        bitsPerSample: meta.format.bitsPerSample,
        sampleRate: meta.format.sampleRate,
        lossless: meta.format.lossless ?? false,

        hostingList: [],
        fileCount: 0,
        fileExtension,
        fileList: [],

        iv: this.iv.toString("hex")
      });
    }
    this.doc.fileExtension = fileExtension; // TODO: remove after migration
  }
  fileCount(fileCount: number) {
    if (this.doc == null) throw Error("Builder not initiated!");
    this.doc.fileCount = fileCount;
  }
  addHosting(hosting: DbDocument<IHosting>) {
    if (this.doc == null) throw Error("Builder not initiated!");
    if (
      (this.doc.hostingList as unknown as Types.ObjectId[]).findIndex(
        (oid) => oid.toString() === hosting.id
      ) == -1
    ) {
      this.doc.hostingList.push(hosting);
    }
  }
  attachAlbum(album: AlbumBuilder) {
    if (this.doc == null) throw Error("Builder not initiated!");
    album.addTrack(this.doc);
    this.doc.album = album.get();
  }
}
