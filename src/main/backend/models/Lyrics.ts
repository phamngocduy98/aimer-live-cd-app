import { model, Schema, Types } from "mongoose";

export const lyricLanguages = ["ja", "romaji", "en", "vi"] as const;
export type LyricLanguage = (typeof lyricLanguages)[number];
export type LyricMediaType = "audio" | "video";
export type LyricSource =
  | "manual"
  | "manual-srt"
  | "lrclib"
  | "kuroshiro"
  | "mymemory"
  | "libretranslate";

export interface ILyricCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface ILyricsRow {
  startMs: number;
  endMs: number;
  ja: string;
  romaji?: string;
  en?: string;
  vi?: string;
}

export interface ILyrics {
  mediaType: LyricMediaType;
  mediaId: Types.ObjectId;
  rows: ILyricsRow[];
  provenance?: Partial<
    Record<
      LyricLanguage,
      {
        source: LyricSource;
        providerId?: string;
        generatedAt: Date;
      }
    >
  >;
}

const lyricsRowSchema = new Schema<ILyricsRow>(
  {
    startMs: { type: Number, required: true, min: 0 },
    endMs: { type: Number, required: true, min: 0 },
    ja: { type: String, required: true, trim: true },
    romaji: { type: String, trim: true, default: undefined },
    en: { type: String, trim: true, default: undefined },
    vi: { type: String, trim: true, default: undefined }
  },
  { _id: false }
);

const lyricsSchema = new Schema<ILyrics>(
  {
    mediaType: { type: String, enum: ["audio", "video"], required: true },
    mediaId: { type: Schema.Types.ObjectId, required: true },
    rows: { type: [lyricsRowSchema], required: true },
    provenance: {
      ja: { type: Schema.Types.Mixed, default: undefined },
      romaji: { type: Schema.Types.Mixed, default: undefined },
      en: { type: Schema.Types.Mixed, default: undefined },
      vi: { type: Schema.Types.Mixed, default: undefined }
    }
  },
  { timestamps: true }
);

lyricsSchema.index({ mediaType: 1, mediaId: 1 }, { unique: true });

export const Lyrics = model("Lyrics", lyricsSchema, "lyrics");
