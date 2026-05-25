import { Playlist } from "../models/Playlist.js";
import { fail, ok } from "../utils/reqUtils.js";
import { createLogger } from "../utils/log.js";

const log = createLogger("Playlist");

// GET /api/playlists
export async function handleListPlaylists(_req, res) {
  const playlists = await Playlist.aggregate([
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        songCount: { $size: { $ifNull: ["$songs", []] } }
      }
    },
    { $sort: { updatedAt: -1 } }
  ]);
  res.send(playlists);
  res.end();
}

// POST /api/playlists
export async function handleCreatePlaylist(req, res) {
  const { name, description } = req.body;
  if (!name?.trim()) return fail(res, "Name is required");

  try {
    const playlist = new Playlist({ name: name.trim(), description: description?.trim() });
    await playlist.save();
    ok(res, playlist.id);
  } catch (e) {
    log.error({ err: e }, "Failed to create playlist");
    fail(res, `${e}`);
  }
}

// GET /api/playlist/:id
export async function handleGetPlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const playlist = await Playlist.findById(req.params.id, {
    songs: 1,
    name: 1,
    description: 1,
    createdAt: 1,
    updatedAt: 1
  })
    .populate({
      path: "songs",
      select: { iv: 0, hostingList: 0 },
      populate: { path: "album", select: { title: 1, artist: 1 } }
    })
    .lean()
    .exec();

  if (playlist == null) return fail(res, "Playlist not found");
  res.send(playlist);
  res.end();
}

// PUT /api/playlist/:id
export async function handleUpdatePlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const { name, description } = req.body;
  const update: Record<string, string> = {};
  if (name?.trim()) update.name = name.trim();
  if (description != null) update.description = description.trim();

  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();
    if (playlist == null) return fail(res, "Playlist not found");
    ok(res, playlist._id.toString());
  } catch (e) {
    log.error({ err: e }, "Failed to update playlist");
    fail(res, `${e}`);
  }
}

// DELETE /api/playlist/:id
export async function handleDeletePlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const result = await Playlist.findByIdAndDelete(req.params.id).exec();
  if (result == null) return fail(res, "Playlist not found");
  ok(res);
}

// POST /api/playlist/:id/songs
export async function handleAddSongsToPlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const { songIds } = req.body;
  if (!Array.isArray(songIds) || songIds.length === 0)
    return fail(res, "songIds array is required");

  try {
    const playlist = await Playlist.findById(req.params.id).exec();
    if (playlist == null) return fail(res, "Playlist not found");

    const existingIds = new Set(playlist.songs.map((s) => s.toString()));
    const toAdd = songIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) return ok(res, "No new songs to add");

    playlist.songs.push(...toAdd);
    await playlist.save();
    ok(res, `${toAdd.length} songs added`);
  } catch (e) {
    log.error({ err: e }, "Failed to add songs to playlist");
    fail(res, `${e}`);
  }
}

// DELETE /api/playlist/:id/songs/:songId
export async function handleRemoveSongFromPlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  try {
    const result = await Playlist.updateOne(
      { _id: req.params.id },
      { $pull: { songs: req.params.songId } }
    ).exec();
    if (result.matchedCount === 0) return fail(res, "Playlist not found");
    ok(res);
  } catch (e) {
    log.error({ err: e }, "Failed to remove song from playlist");
    fail(res, `${e}`);
  }
}
