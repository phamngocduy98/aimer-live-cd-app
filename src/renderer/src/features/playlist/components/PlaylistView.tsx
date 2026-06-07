import { useMemo, useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch } from "@app/hooks";
import { PageScaffold } from "@components/view/PageScaffold";
import { playContext } from "@features/player/store/playerSlice";
import { apiAssetUrl } from "@lib/axios";
import { formatArtists } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { EditPlaylistDialog } from "./EditPlaylistDialog";
import { useDeletePlaylist, usePlaylist, useRemoveItemFromPlaylist } from "../hooks/usePlaylists";
import { PlaylistItemsTable } from "./PlaylistItemsTable";

export const PlaylistView: React.FC = () => {
  const dispatch = useAppDispatch();
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
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return playlist.items;

    return playlist.items.filter((item) =>
      [item.media.title, formatArtists(item.media.artist), item.media.album?.title]
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
  const coverAlbumId = playlist.items.find((item) => item.media.album?._id)?.media.album?._id;
  const coverUrl = coverAlbumId ? apiAssetUrl(`/album/${coverAlbumId}/cover`) : "";
  const totalDuration = playlist.items.reduce((total, item) => total + item.media.duration, 0);

  const play = (shuffle = false): void => {
    if (visibleItems.length === 0) return;
    dispatch(
      playContext({
        items: visibleItems.map((item) => item.media),
        sourceItemKeys: visibleItems.map((item) => item._id),
        playFrom: playSource,
        shuffle
      })
    );
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
    <PageScaffold sx={{ pt: "64px" }}>
      <Box
        component="section"
        data-testid="playlist-media-hero"
        sx={{
          position: "relative",
          minHeight: { xs: 500, sm: 360, md: 470 },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          bgcolor: "#111",
          backgroundImage: coverUrl
            ? {
                xs: `linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.32) 42%, #000 100%), url("${coverUrl}")`,
                md: `linear-gradient(180deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.4) 56%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.7), rgba(0,0,0,.12) 72%), url("${coverUrl}")`
              }
            : "linear-gradient(135deg, #242424 0%, #080808 72%, #000 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,.1)",
            backdropFilter: { xs: "none", md: coverUrl ? "blur(2px)" : "none" }
          }
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 1180,
            mx: "auto",
            px: { xs: 2.5, sm: 4, lg: 6 },
            py: { xs: 3, sm: 2.5, md: 3.5 }
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: { xs: 1.75, sm: 3, md: 4 },
              textAlign: { xs: "center", sm: "left" }
            }}
          >
            {coverUrl ? (
              <Box
                component="img"
                src={coverUrl}
                alt=""
                sx={{
                  width: { xs: 156, sm: 160, md: 250 },
                  aspectRatio: "1 / 1",
                  borderRadius: 1.5,
                  objectFit: "cover",
                  boxShadow: "0 28px 80px rgba(0,0,0,.58)",
                  flexShrink: 0
                }}
              />
            ) : (
              <Box
                sx={{
                  width: { xs: 156, sm: 160, md: 250 },
                  aspectRatio: "1 / 1",
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #343434, #111)",
                  boxShadow: "0 28px 80px rgba(0,0,0,.58)",
                  flexShrink: 0
                }}
              >
                <QueueMusicIcon sx={{ fontSize: 86, color: "#e4fffd" }} />
              </Box>
            )}

            <Box sx={{ minWidth: 0, maxWidth: 760 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 24, sm: 28, md: 48 },
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-.035em",
                  textShadow: "0 2px 24px rgba(0,0,0,.55)"
                }}
              >
                {playlist.name}
              </Typography>
              {playlist.description && (
                <Typography
                  sx={{
                    mt: { xs: 1, md: 2 },
                    color: "rgba(255,255,255,.72)",
                    fontSize: { xs: 13, sm: 14, md: 16 },
                    fontWeight: 650
                  }}
                >
                  {playlist.description}
                </Typography>
              )}
              <Typography
                sx={{
                  mt: { xs: 1.25, md: 2.25 },
                  color: "rgba(255,255,255,.78)",
                  fontSize: { xs: 10, sm: 11, md: 12 },
                  fontWeight: 800,
                  letterSpacing: ".075em",
                  textTransform: "uppercase"
                }}
              >
                {playlist.items.length} items · {formatDuration(totalDuration)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 2, sm: 2, md: 4 },
              mt: { xs: 2.25, sm: 2.5, md: 4 }
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
              <PlaylistPlayButton
                label="Play"
                ariaLabel="Play all"
                icon={<PlayArrowRoundedIcon />}
                primary
                onClick={() => play()}
              />
              <PlaylistPlayButton
                label="Shuffle"
                ariaLabel="Shuffle play"
                icon={<ShuffleRoundedIcon />}
                onClick={() => play(true)}
              />
            </Box>
            <Box
              aria-label="Playlist actions"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(3, minmax(64px, 1fr))",
                  sm: "repeat(2, minmax(56px, 1fr))",
                  md: "repeat(3, minmax(64px, 1fr))"
                },
                width: { xs: "100%", sm: 144, md: 300 },
                gap: { xs: 1, sm: 2 }
              }}
            >
              <PlaylistAction
                label="Edit"
                icon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)}
              />
              <PlaylistAction
                label="Share"
                icon={<IosShareOutlinedIcon />}
                onClick={sharePlaylist}
                hideOnCompact
              />
              <PlaylistAction
                label="More"
                icon={<MoreHorizRoundedIcon />}
                onClick={(event) => setMoreAnchor(event.currentTarget)}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        sx={{ maxWidth: 1180, mx: "auto", px: { xs: 1.5, sm: 4, lg: 6 }, pt: 3 }}
      >
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
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,.025)",
              "& fieldset": { borderColor: "rgba(255,255,255,.14)" }
            }
          }}
        />

        {visibleItems.length > 0 ? (
          <PlaylistItemsTable
            items={visibleItems}
            playSource={playSource}
            onPlay={(index) =>
              dispatch(
                playContext({
                  items: visibleItems.map((item) => item.media),
                  sourceItemKeys: visibleItems.map((item) => item._id),
                  playFrom: playSource,
                  startIndex: index
                })
              )
            }
            onRemove={handleRemoveItem}
          />
        ) : (
          <Typography color="#a7a7a7" sx={{ py: 5, textAlign: "center" }}>
            {playlist.items.length === 0 ? "This playlist is empty." : `No items match “${filter}”`}
          </Typography>
        )}
      </Box>

      <EditPlaylistDialog open={editOpen} playlist={playlist} onClose={() => setEditOpen(false)} />
      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          Delete playlist
        </MenuItem>
      </Menu>
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2200}
        onClose={() => setMessage("")}
        message={message}
      />
    </PageScaffold>
  );
};

interface PlaylistPlayButtonProps {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}

const PlaylistPlayButton: React.FC<PlaylistPlayButtonProps> = ({
  label,
  ariaLabel,
  icon,
  primary = false,
  onClick
}) => (
  <Button
    startIcon={icon}
    variant={primary ? "contained" : "text"}
    aria-label={ariaLabel}
    onClick={onClick}
    size="large"
    sx={{
      width: { xs: "50%", sm: 52, md: 164 },
      minWidth: { sm: 52, md: 64 },
      minHeight: { xs: 46, md: 50 },
      bgcolor: primary ? "#fff" : "rgba(255,255,255,.14)",
      color: primary ? "#000" : "#fff",
      border: primary ? 0 : "1px solid rgba(255,255,255,.08)",
      borderRadius: "999px",
      fontSize: { xs: 15, md: 16 },
      fontWeight: 850,
      "& .MuiButton-startIcon": {
        ml: { sm: 0, md: -0.5 },
        mr: { sm: 0, md: 1 }
      },
      "&:hover": { bgcolor: primary ? "#e9e9e9" : "rgba(255,255,255,.22)" }
    }}
  >
    <Box component="span" sx={{ display: { xs: "inline", sm: "none", md: "inline" } }}>
      {label}
    </Box>
  </Button>
);

interface PlaylistActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  hideOnCompact?: boolean;
}

const PlaylistAction: React.FC<PlaylistActionProps> = ({
  icon,
  label,
  onClick,
  hideOnCompact = false
}) => (
  <Button
    aria-label={label}
    onClick={onClick}
    sx={{
      minWidth: 0,
      display: hideOnCompact ? { xs: "flex", sm: "none", md: "flex" } : "flex",
      color: "#fff",
      flexDirection: "column",
      gap: 0.65,
      fontSize: { xs: 11, sm: 12 },
      fontWeight: 800,
      lineHeight: 1.15,
      "& .MuiSvgIcon-root": { fontSize: 29 },
      "&:hover": { bgcolor: "rgba(255,255,255,.08)" }
    }}
  >
    {icon}
    <span>{label}</span>
  </Button>
);
