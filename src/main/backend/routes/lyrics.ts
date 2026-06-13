import {
  Lyrics,
  lyricLanguages,
  type ILyricCue,
  type ILyricsRow,
  type LyricSource
} from "../models/Lyrics.js";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import {
  loadLrclibCandidate,
  searchLrclib,
  type LyricsSearchInput
} from "../services/lyrics/externalLyrics.js";
import { romanizeCues } from "../services/lyrics/romanize.js";
import {
  availableTranslationProviders,
  translateCues,
  type TranslationProvider,
  type TranslationTarget
} from "../services/lyrics/translate.js";
import { fail } from "../utils/reqUtils.js";
import { parseSrt, validateCues, validateLyricsRows } from "./lyricsLogic.js";

function validId(id: string): boolean {
  return id.length === 12 || id.length === 24;
}

function validMediaType(value: string): value is "audio" | "video" {
  return value === "audio" || value === "video";
}

async function mediaExists(mediaType: "audio" | "video", mediaId: string): Promise<boolean> {
  const media =
    mediaType === "audio"
      ? await Song.exists({ _id: mediaId })
      : await Video.exists({ _id: mediaId });
  return Boolean(media);
}

function params(req, res): { mediaType: "audio" | "video"; mediaId: string } | null {
  const { mediaType, mediaId } = req.params;
  if (!validMediaType(mediaType) || !validId(mediaId)) {
    fail(res, "Invalid request");
    return null;
  }
  return { mediaType, mediaId };
}

function routeError(res, error: unknown): void {
  fail(res, error instanceof Error ? error.message : String(error));
}

export async function handleGetLyrics(req, res) {
  const { mediaType, mediaId } = req.params;
  if (!validMediaType(mediaType) || !validId(mediaId)) return fail(res, "Invalid request");
  const lyrics = await Lyrics.findOne({ mediaType, mediaId }, { _id: 0, __v: 0 }).lean();
  if (!lyrics) return fail(res, "Lyrics not found", 404);
  res.json(lyrics);
}

export function handleAdminPreviewSrt(req, res): void {
  if (!req.file) return fail(res, "Subtitle file is required");
  if (!req.file.originalname.toLowerCase().endsWith(".srt")) {
    return fail(res, "Only SRT subtitle files are supported");
  }
  try {
    res.json({ cues: parseSrt(req.file.buffer.toString("utf8")) });
  } catch (error) {
    routeError(res, error);
  }
}

export function handleAdminGetLyricsProviders(_req, res): void {
  res.json({
    lyrics: ["lrclib"],
    translation: availableTranslationProviders()
  });
}

export async function handleAdminSearchLyrics(req, res) {
  const validated = params(req, res);
  if (!validated) return;
  if (!(await mediaExists(validated.mediaType, validated.mediaId))) {
    return fail(res, "Media not found", 404);
  }
  try {
    const body = req.body ?? {};
    const input: LyricsSearchInput = {
      trackName: String(body.trackName ?? ""),
      artistName: String(body.artistName ?? ""),
      albumName: String(body.albumName ?? ""),
      duration: Number(body.duration) || undefined
    };
    res.json(await searchLrclib(input));
  } catch (error) {
    routeError(res, error);
  }
}

export async function handleAdminImportLyrics(req, res) {
  const validated = params(req, res);
  if (!validated) return;
  if (!(await mediaExists(validated.mediaType, validated.mediaId))) {
    return fail(res, "Media not found", 404);
  }
  try {
    const imported = await loadLrclibCandidate(
      Number(req.body?.candidateId),
      Number(req.body?.duration)
    );
    res.json({
      rows: mergeGeneratedRows(imported.cues, await romanizeCues(imported.cues)),
      provenance: {
        ja: { source: "lrclib", providerId: String(imported.candidate.id) },
        romaji: { source: "kuroshiro" }
      },
      candidate: imported.candidate
    });
  } catch (error) {
    routeError(res, error);
  }
}

export async function handleAdminRomanizeLyrics(req, res) {
  try {
    const cues = validateCues(req.body?.cues as ILyricCue[]);
    res.json({ cues: await romanizeCues(cues), source: "kuroshiro" });
  } catch (error) {
    routeError(res, error);
  }
}

export async function handleAdminTranslateLyrics(req, res) {
  try {
    const cues = validateCues(req.body?.cues as ILyricCue[]);
    const target = req.body?.target as TranslationTarget;
    const provider = req.body?.provider as TranslationProvider;
    if (target !== "en" && target !== "vi") return fail(res, "Unsupported translation target");
    if (provider !== "mymemory" && provider !== "libretranslate") {
      return fail(res, "Unsupported translation provider");
    }
    res.json({ cues: await translateCues(cues, target, provider), source: provider });
  } catch (error) {
    routeError(res, error);
  }
}

export async function handleAdminSaveLyrics(req, res) {
  const validated = params(req, res);
  if (!validated) return;
  if (!(await mediaExists(validated.mediaType, validated.mediaId))) {
    return fail(res, "Media not found", 404);
  }
  try {
    const rows = validateLyricsRows(req.body?.rows as ILyricsRow[]);
    const provenance = req.body?.provenance ?? {};
    const validSources: LyricSource[] = [
      "manual",
      "manual-srt",
      "lrclib",
      "kuroshiro",
      "mymemory",
      "libretranslate"
    ];
    const savedProvenance: Record<string, unknown> = {};
    for (const language of lyricLanguages) {
      if (!rows.some((row) => Boolean(row[language]))) continue;
      const source = provenance[language]?.source as LyricSource;
      if (!validSources.includes(source)) throw new Error(`Invalid provenance for ${language}`);
      savedProvenance[language] = {
        source,
        ...(provenance[language]?.providerId
          ? { providerId: String(provenance[language].providerId) }
          : {}),
        generatedAt: new Date()
      };
    }
    const lyrics = await Lyrics.findOneAndUpdate(
      validated,
      { $set: { rows, provenance: savedProvenance } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(lyrics);
  } catch (error) {
    routeError(res, error);
  }
}

function mergeGeneratedRows(japanese: ILyricCue[], romaji: ILyricCue[]): ILyricsRow[] {
  return japanese.map((cue, index) => ({
    startMs: cue.startMs,
    endMs: cue.endMs,
    ja: cue.text,
    ...(romaji[index]?.text ? { romaji: romaji[index].text } : {})
  }));
}
