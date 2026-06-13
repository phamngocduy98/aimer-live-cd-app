export type LyricLanguage = "ja" | "romaji" | "en" | "vi";
export type LyricMediaType = "audio" | "video";
export type LyricPairId = "ja-romaji" | "romaji-en" | "romaji-vi";

export interface LyricCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface LyricsRow {
  startMs: number;
  endMs: number;
  ja: string;
  romaji?: string;
  en?: string;
  vi?: string;
}

export interface LyricsDocument {
  mediaType: LyricMediaType;
  mediaId: string;
  rows: LyricsRow[];
  provenance?: Partial<Record<LyricLanguage, LyricProvenance>>;
}

export type LyricSource =
  | "manual"
  | "manual-srt"
  | "lrclib"
  | "kuroshiro"
  | "mymemory"
  | "libretranslate";

export interface LyricProvenance {
  source: LyricSource;
  providerId?: string;
  generatedAt?: string;
}

export interface LyricsCandidate {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  synchronized: boolean;
}

export type TranslationProvider = "mymemory" | "libretranslate";

export const lyricPairs: {
  id: LyricPairId;
  label: string;
  primary: LyricLanguage;
  secondary: LyricLanguage;
}[] = [
  { id: "ja-romaji", label: "Japanese", primary: "ja", secondary: "romaji" },
  { id: "romaji-en", label: "English", primary: "romaji", secondary: "en" },
  { id: "romaji-vi", label: "Vietnamese", primary: "romaji", secondary: "vi" }
];
