import { useMemo, useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, InputAdornment, Snackbar, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { PageScaffold } from "@components/view/PageScaffold";
import { formatArtists } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { EditPlaylistDialog } from "./EditPlaylistDialog";
import { useDeletePlaylist, usePlaylist, useRemoveItemFromPlaylist } from "../hooks/usePlaylists";
import { PlaylistItemsTable } from "./PlaylistItemsTable";
import { MediaDetailHero, MediaDetailIdentity } from "@components/view/MediaDetailPage";
import {
  DetailActionButton,
  DetailActions,
  DetailContent,
  PrimaryActionGroup
} from "@components/view/designSystem";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import { usePlaybackGate } from "@features/auth";

export const PlaylistView: React.FC = () => {
  const playMedia = usePlaybackGate();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { data: playlist } = usePlaylist(id);
  const deletePlaylist = useDeletePlaylist();
  const removeItem = useRemoveItemFromPlaylist();
  const [filter, setFilter] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState("");

  const visibleItems = useMemo(() => {
    if (!playlist) return [];
    const items = playlist.items ?? [];
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [
        item.media.title,
        formatArtists(item.media.artist),
        "album" in item.media ? item.media.album?.title : undefined
      ]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [filter, playlist]);

  if (!playlist) {
    return <PageScaffold>{null}</PageScaffold>;
  }

  const playSource = {
    type: "playlist" as const,
    id: playlist._id,
    label: playlist.name,
    route: `/playlist/${playlist._id}`
  };
  const playlistItems = playlist.items ?? [];
  const coverUrl = mediaArtworkUrl(playlistItems[0]?.media) ?? "";
  const totalDuration = playlistItems.reduce((total, item) => total + item.media.duration, 0);

  const play = (shuffle = false): void => {
    if (visibleItems.length === 0) return;
    playMedia({
      items: visibleItems.map((item) => item.media),
      sourceItemKeys: visibleItems.map((item) => item._id),
      playFrom: playSource,
      shuffle
    });
  };

  const sharePlaylist = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({ title: playlist.name, url: window.location.href });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Playlist link copied");
    } catch {
      setMessage("Unable to copy playlist link");
    }
  };

  const handleDelete = (): void => {
    setMoreAnchor(null);
    deletePlaylist.mutate(playlist._id, { onSuccess: () => navigate("/playlists") });
  };

  const handleRemoveItem = (itemId: string): void => {
    removeItem.mutate({ playlistId: playlist._id, itemId });
  };

  return (
    <PageScaffold>
      <MediaDetailHero
        testId="playlist-media-hero"
        backgroundImage={
          coverUrl
            ? {
                xs: `linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.32) 42%, #000 100%), url("${coverUrl}")`,
                md: `linear-gradient(180deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.4) 56%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.7), rgba(0,0,0,.12) 72%), url("${coverUrl}")`
              }
            : undefined
        }
      >
        <MediaDetailIdentity
          artwork={
            coverUrl ? (
              <Box component="img" src={coverUrl} alt="" />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #343434, #111)"
                }}
              >
                <QueueMusicIcon sx={{ fontSize: 86, color: "#e4fffd" }} />
              </Box>
            )
          }
          title={playlist.name}
          subtitle={
            playlist.description ? (
              <Typography color="rgba(255,255,255,.72)" fontWeight={600}>
                {playlist.description}
              </Typography>
            ) : undefined
          }
          summary={
            <>
              <span>{playlistItems.length} items</span>
              <span>·</span>
              <span>{formatDuration(totalDuration)}</span>
            </>
          }
        />
        <DetailActions
          primary={
            <Box
              sx={{
                "& [aria-label='Shuffle play']": {
                  display: { xs: "inline-flex", sm: "none", md: "inline-flex" }
                }
              }}
            >
              <PrimaryActionGroup onPlay={() => play()} onShuffle={() => play(true)} />
            </Box>
          }
          secondaryColumns={{ xs: 3, sm: 2, md: 3, lg: 3 }}
          secondary={
            <>
              <DetailActionButton
                label="Edit"
                icon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)}
              />
              <Box sx={{ display: { xs: "block", sm: "none", md: "block" } }}>
                <DetailActionButton
                  label="Share"
                  icon={<IosShareOutlinedIcon />}
                  onClick={sharePlaylist}
                />
              </Box>
              <DetailActionButton
                label="More"
                icon={<MoreHorizRoundedIcon />}
                onClick={(event) => setMoreAnchor(event.currentTarget)}
              />
            </>
          }
        />
      </MediaDetailHero>

      <DetailContent compactGutter sx={{ pt: 3 }}>
        <TextField
          fullWidth
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter playlist on title, artist or album"
          inputProps={{ "aria-label": "Filter playlist" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              height: 44,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,.025)",
              fontSize: 15,
              "& fieldset": { borderColor: "rgba(255,255,255,.14)" },
              "&.Mui-focused": { bgcolor: "#242429" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,.24)" },
              "&.Mui-focused fieldset": { borderColor: "#6e6e6e", borderWidth: 1 }
            }
          }}
        />

        {visibleItems.length > 0 ? (
          <PlaylistItemsTable
            items={visibleItems}
            playSource={playSource}
            onPlay={(index) =>
              playMedia({
                items: visibleItems.map((item) => item.media),
                sourceItemKeys: visibleItems.map((item) => item._id),
                playFrom: playSource,
                startIndex: index
              })
            }
            onRemove={handleRemoveItem}
          />
        ) : (
          <Typography color="#a7a7a7" sx={{ py: 5, textAlign: "center" }}>
            {playlistItems.length === 0 ? "This playlist is empty." : `No items match “${filter}”`}
          </Typography>
        )}
      </DetailContent>

      <EditPlaylistDialog open={editOpen} playlist={playlist} onClose={() => setEditOpen(false)} />
      <ResponsiveActionMenu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        ariaLabel={`${playlist.name} actions`}
        items={[{ label: "Delete playlist", color: "error", onClick: handleDelete }]}
      />
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2200}
        onClose={() => setMessage("")}
        message={message}
      />
    </PageScaffold>
  );
};
