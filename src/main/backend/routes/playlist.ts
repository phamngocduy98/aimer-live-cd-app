import { Playlist } from "../models/Playlist.js";
import { fail, ok } from "../utils/reqUtils.js";
import { createLogger } from "../utils/log.js";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { findDuplicatePlaylistItems } from "./playlistLogic.js";

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
        itemCount: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
            { $size: { $ifNull: ["$items", []] } },
            { $size: { $ifNull: ["$songs", []] } }
          ]
        }
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
    items: 1,
    name: 1,
    description: 1,
    createdAt: 1,
    updatedAt: 1
  }).exec();

  if (playlist == null) return fail(res, "Playlist not found");

  if (playlist.items.length === 0 && playlist.songs.length > 0) {
    playlist.items = playlist.songs.map((song) => ({
      mediaType: "audio",
      mediaId: song._id
    })) as typeof playlist.items;
    await playlist.save();
  }

  const leanPlaylist = playlist.toObject();
  const audioIds = leanPlaylist.items
    .filter((item) => item.mediaType === "audio")
    .map((item) => item.mediaId);
  const videoIds = leanPlaylist.items
    .filter((item) => item.mediaType === "video")
    .map((item) => item.mediaId);
  const [songs, videos] = await Promise.all([
    Song.find({ _id: { $in: audioIds } }, { iv: 0, hostingList: 0 })
      .populate("album", { title: 1, artist: 1 })
      .lean(),
    Video.find({ _id: { $in: videoIds } }, { iv: 0, hostingList: 0 })
      .populate("album", { title: 1, artist: 1 })
      .lean()
  ]);
  const songMap = new Map(songs.map((song) => [song._id.toString(), song]));
  const videoMap = new Map(videos.map((video) => [video._id.toString(), video]));
  const items = leanPlaylist.items.flatMap((item) => {
    const media =
      item.mediaType === "audio"
        ? songMap.get(item.mediaId.toString())
        : videoMap.get(item.mediaId.toString());
    return media ? [{ _id: item._id!.toString(), mediaType: item.mediaType, media }] : [];
  });

  res.send({
    _id: leanPlaylist._id,
    name: leanPlaylist.name,
    description: leanPlaylist.description,
    items,
    createdAt: leanPlaylist.createdAt,
    updatedAt: leanPlaylist.updatedAt
  });
  res.end();
}

// POST /api/playlist/:id/items
export async function handleAddItemsToPlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const { items, allowDuplicates = false } = req.body;
  if (!Array.isArray(items) || items.length === 0) return fail(res, "items array is required");
  if (
    items.some(
      (item) =>
        !["audio", "video"].includes(item?.mediaType) ||
        typeof item?.mediaId !== "string" ||
        !item.mediaId
    )
  )
    return fail(res, "Invalid playlist items");

  try {
    const playlist = await Playlist.findById(req.params.id).exec();
    if (playlist == null) return fail(res, "Playlist not found");

    if (playlist.items.length === 0 && playlist.songs.length > 0) {
      playlist.items = playlist.songs.map((song) => ({
        mediaType: "audio",
        mediaId: song._id
      })) as typeof playlist.items;
    }

    const duplicates = findDuplicatePlaylistItems(playlist.items, items);
    if (duplicates.length > 0 && !allowDuplicates) {
      return fail(res, JSON.stringify({ code: "DUPLICATE_ITEMS", duplicates }), 409);
    }

    playlist.items.push(
      ...items.map((item) => ({ mediaType: item.mediaType, mediaId: item.mediaId }))
    );
    await playlist.save();
    ok(res, `${items.length} items added`);
  } catch (e) {
    log.error({ err: e }, "Failed to add items to playlist");
    fail(res, `${e}`);
  }
}

// DELETE /api/playlist/:id/items/:itemId
export async function handleRemoveItemFromPlaylist(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  try {
    const result = await Playlist.updateOne(
      { _id: req.params.id },
      { $pull: { items: { _id: req.params.itemId } } }
    ).exec();
    if (result.matchedCount === 0) return fail(res, "Playlist not found");
    ok(res);
  } catch (e) {
    log.error({ err: e }, "Failed to remove playlist item");
    fail(res, `${e}`);
  }
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
    req.body.items = songIds.map((mediaId) => ({ mediaType: "audio", mediaId }));
    req.body.allowDuplicates = false;
    return handleAddItemsToPlaylist(req, res);
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
      {
        $pull: {
          songs: req.params.songId,
          items: { mediaType: "audio", mediaId: req.params.songId }
        }
      }
    ).exec();
    if (result.matchedCount === 0) return fail(res, "Playlist not found");
    ok(res);
  } catch (e) {
    log.error({ err: e }, "Failed to remove song from playlist");
    fail(res, `${e}`);
  }
}
