import React from "react";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAppDispatch } from "@app/hooks";
import { router } from "@app/router";
import type { SearchResult } from "@renderer/types/shared";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { usePlaybackGate } from "@features/auth";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl, artistPath, formatArtists } from "@utils/artist";
import { mediaArtworkUrl } from "@utils/mediaArtwork";

export type SearchResultType = "artist" | "song" | "album" | "video" | "chapter";

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  meta?: string;
  image?: string;
  roundImage?: boolean;
  onClick: () => void;
}

interface SearchResultGroups {
  top: SearchResultItem[];
  artists: SearchResultItem[];
  songs: SearchResultItem[];
  albums: SearchResultItem[];
  videos: SearchResultItem[];
  chapters: SearchResultItem[];
}

interface UseSearchResultItemsOptions {
  result: SearchResult | null | undefined;
  query: string;
  playSource: {
    type: "search";
    id: string;
    label: string;
    route: string;
  };
  onBeforeAction?: () => void;
  topLimit?: number;
}

export function useSearchResultItems({
  result,
  query,
  playSource,
  onBeforeAction,
  topLimit = 12
}: UseSearchResultItemsOptions): SearchResultGroups {
  const dispatch = useAppDispatch();
  const play = usePlaybackGate();

  return React.useMemo(() => {
    const groups: SearchResultGroups = {
      top: [],
      artists: [],
      songs: [],
      albums: [],
      videos: [],
      chapters: []
    };
    if (!result) return groups;

    const normalizedQuery = query.trim().toLocaleLowerCase();
    const seenArtists = new Set<string>();
    const run = (action: () => void): void => {
      onBeforeAction?.();
      action();
    };

    const addArtist = (name: string): void => {
      const normalizedName = name.trim();
      if (!normalizedName || seenArtists.has(normalizedName)) return;
      if (normalizedQuery && !normalizedName.toLocaleLowerCase().includes(normalizedQuery)) return;
      seenArtists.add(normalizedName);
      groups.artists.push({
        id: `artist:${normalizedName}`,
        type: "artist",
        title: normalizedName,
        image: artistImageUrl(normalizedName),
        roundImage: true,
        onClick: () => run(() => router.navigate(artistPath(normalizedName)))
      });
    };

    result.albums.forEach((album) => addArtist(album.artist));
    result.songs.forEach((song) => song.artist.forEach(addArtist));
    result.videos.forEach((video) => video.artist.forEach(addArtist));
    result.chapters.forEach(({ video }) => video.artist.forEach(addArtist));

    groups.songs = result.songs.map((song) => ({
      id: `song:${song._id}`,
      type: "song",
      title: song.title,
      meta: `Track · ${formatArtists(song.artist)}`,
      image: mediaArtworkUrl(song),
      onClick: () => run(() => play({ items: [song], playFrom: playSource }))
    }));

    groups.albums = result.albums.map((album) => ({
      id: `album:${album._id}`,
      type: "album",
      title: album.title,
      meta: `Album · ${album.artist}${album.year ? ` · ${album.year}` : ""}`,
      image: apiAssetUrl(`/album/${album._id}/cover`),
      onClick: () => run(() => router.navigate(`/album/${album._id}`))
    }));

    groups.videos = result.videos.map((video) => ({
      id: `video:${video._id}`,
      type: "video",
      title: video.title,
      meta: `Video · ${formatArtists(video.artist)}`,
      image: apiAssetUrl(`/video/${video._id}/cover`),
      onClick: () => run(() => play({ items: [video], playFrom: playSource }))
    }));

    groups.chapters = result.chapters.map(({ video, chapter, chapterIndex }) => ({
      id: `chapter:${video._id}:${chapter.time}:${chapterIndex}`,
      type: "chapter",
      title: chapter.title,
      meta: `Chapter · ${chapter.subTitle || video.title}`,
      image: apiAssetUrl(`/video/${video._id}/cover`),
      onClick: () => run(() => dispatch(playVideoChapter(video, playSource, chapterIndex)))
    }));

    groups.top = [
      ...groups.artists.slice(0, 1),
      ...groups.songs,
      ...groups.albums,
      ...groups.videos,
      ...groups.chapters
    ].slice(0, topLimit);

    return groups;
  }, [dispatch, onBeforeAction, play, playSource, query, result, topLimit]);
}

export function SearchResultRow({
  item,
  dense = false
}: {
  item: SearchResultItem;
  dense?: boolean;
}): React.ReactElement {
  const artworkSize = dense ? 48 : 56;

  return (
    <Box
      onClick={item.onClick}
      sx={(theme) => ({
        px: dense ? 2 : 1.5,
        py: dense ? 1.1 : 1.25,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: dense ? 1.5 : 2,
        minHeight: dense ? 68 : 80,
        borderRadius: `${theme.design.radius.row}px`,
        "&:hover": { bgcolor: theme.design.color.surfaceHover }
      })}
    >
      <Box
        sx={(theme) => ({
          width: artworkSize,
          height: artworkSize,
          borderRadius: item.roundImage ? "50%" : `${theme.design.radius.row}px`,
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: theme.design.color.surfaceRaised,
          display: "grid",
          placeItems: "center"
        })}
      >
        {item.image ? (
          <Box
            component="img"
            src={item.image}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Typography fontSize={dense ? 20 : 22} fontWeight={700} color="text.secondary">
            {item.title.slice(0, 1).toUpperCase()}
          </Typography>
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={(theme) => theme.design.typography.mediaTitle}>
          {item.title}
        </Typography>
        {item.meta && (
          <Typography
            noWrap
            component="div"
            sx={(theme) => ({
              ...theme.design.typography.metadata,
              mt: 0.35,
              fontWeight: 600
            })}
          >
            {item.meta}
          </Typography>
        )}
      </Box>
      <MoreHorizRoundedIcon
        sx={(theme) => ({ color: theme.design.color.textSubtle, flexShrink: 0, fontSize: 20 })}
      />
    </Box>
  );
}
