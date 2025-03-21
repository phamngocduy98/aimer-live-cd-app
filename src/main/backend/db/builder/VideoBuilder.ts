import { Types } from "mongoose";
import { IAudioMetadata, IFormat } from "music-metadata";
import { DbDocument } from "../../utils/type.js";
import { IHosting } from "../Hosting.js";
import { ISong, Song } from "../Song.js";
import { ContentBuilder } from "./ContentBuilder.js";
import { AlbumBuilder } from "./AlbumBuilder.js";
import { IVideo, Video } from "../Video.js";

const VIDEO_CODEC = ["<avc1>", "MPEGH/ISO/HEVC", "mp42", "VP9", "MPEG4/ISO/AVC"];

function isVideoTrackInfo(trackInfo: IFormat["trackInfo"][0]) {
  return trackInfo.video != null || VIDEO_CODEC.includes(trackInfo.codecName ?? "");
}

export class VideoBuilder extends ContentBuilder<IVideo> {
  title() {
    if (this.doc == null) throw Error("Builder not initiated!");
    return this.doc.title;
  }

  async init(meta: IAudioMetadata, size: number, fileExtension: string) {
    this.doc = await Video.findOne({
      title: meta.common.title,
      size,
      duration: meta.format.duration
    });
    this._id = this.doc?._id ?? new Types.ObjectId();
    if (this.doc?.iv) this.iv = Buffer.from(this.doc.iv, "hex");

    if (this.doc == null) {
      const videos = meta.format.trackInfo.filter((t) => isVideoTrackInfo(t));
      const audios = meta.format.trackInfo.filter((t) => t.audio != null && isVideoTrackInfo(t));
      this.doc = new Video({
        _id: this._id,
        title: meta.common.title,
        artist: meta.common.artists,
        size,
        duration: meta.format.duration,

        videoWidth: videos[0]?.video?.pixelWidth ?? videos[0]?.video?.displayWidth,
        videoHeight: videos[0]?.video?.pixelHeight ?? videos[0]?.video?.displayHeight,
        videoCodecRaw: videos[0]?.codecName,

        audioLossless: meta.format.lossless ?? false,
        audioSampleRate: meta.format.sampleRate,
        audioBitsPerSample: meta.format.bitsPerSample,
        audioCodecRaw: meta.format.codec,

        format: meta.format.container,
        bitrate: meta.format.bitrate,

        hostingList: [],
        fileCount: 0,
        fileExtension,

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
    album.addVideo(this.doc);
    this.doc.album = album.get();
  }
}
