import { Song } from "../db/Song.js";
import { Video } from "../db/Video.js";
import { SongStream } from "../stream/SongStream.js";
import { fail } from "../utils/reqUtils.js";

// GET /api/stream/:id
export function handleDeprecatedStream(req, res) {
  fail(res, "Deprecated api", 404);
}

// GET /api/stream/audio/:id
export async function handleStreamAudio(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("hostingList").exec();

  if (song == null) {
    return fail(res, "Song not found", 404);
  }
  let errorMessages: string[] = [];
  try {
    const stream = new SongStream(req.headers);
    await stream.stream(song, res, res);
    return;
  } catch (e) {
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), 404);
}

// GET /api/stream/video/:id
export async function handleStreamVideo(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id).populate("hostingList").exec();

  if (video == null) {
    return fail(res, "Video not found", 404);
  }

  let errorMessages: string[] = [];
  try {
    const stream = new SongStream(req.headers);

    req.on("error", (e) => {
      console.error("[Error] Client request " + e);
      stream.stopStream();
      res.end();
    });

    stream.stream(video, res, res);
    return;
  } catch (e) {
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), 404);
}
