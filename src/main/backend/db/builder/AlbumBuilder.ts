import { Types } from "mongoose";
import { IAudioMetadata } from "music-metadata";
import { DbDocument } from "../../utils/type.js";
import { IAlbum, metadataToAlbum, Album } from "../Album.js";
import { ISong } from "../Song.js";
import { IVideo } from "../Video.js";
import { Builder } from "./index.js";

export class AlbumBuilder extends Builder<IAlbum> {
  async init(meta: IAudioMetadata, size: number, fileExtension: string): Promise<void> {
    const ialbum = metadataToAlbum(meta);
    this.doc = await Album.findOne({
      title: ialbum.title,
      artist: { $all: ialbum.artist }
    }).exec();

    if (this.doc == null) {
      ialbum.trackList = [];
      this.doc = new Album(ialbum);
    }
  }
  addTrack(song: DbDocument<ISong>) {
    if (this.doc == null) throw Error("Builder not initiated!");
    if (
      (this.doc.trackList as unknown as Types.ObjectId[]).findIndex(
        (oid) => oid.toString() === song?.id
      ) == -1
    ) {
      this.doc.trackList.push(song);
    }
  }
  addVideo(video: DbDocument<IVideo>) {
    if (this.doc == null) throw Error("Builder not initiated!");
    if (
      (this.doc.videoList as unknown as Types.ObjectId[]).findIndex(
        (oid) => oid.toString() === video?.id
      ) == -1
    ) {
      this.doc.videoList.push(video);
    }
  }
}
