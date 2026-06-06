import { useState } from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import { Box, Button, Menu, MenuItem, Snackbar, Typography } from "@mui/material";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import { AddToPlaylistDialog } from "@features/playlist";
import { router } from "@app/router";
import { artistPath } from "@utils/artist";
import type { AlbumDetail } from "../types";

export const AlbumControlButton: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [creditsAnchor, setCreditsAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState("");

  const playableItems = album.trackList.length > 0 ? album.trackList : album.videoList;
  const mediaType = album.trackList.length > 0 ? "audio" : "video";

  const play = (shuffle = false) => {
    if (playableItems.length === 0) return;
    dispatch(reset({ songs: playableItems, shuffle, type: mediaType }));
  };

  const copyAlbumLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Album link copied");
    } catch {
      setMessage("Unable to copy album link");
    }
    setMoreAnchor(null);
  };

  const shareAlbum = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: album.title, url: window.location.href });
        return;
      } catch {
        return;
      }
    }
    await copyAlbumLink();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 3.25, md: 4 },
          mt: { xs: 3.5, md: 4 }
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
          <Button
            startIcon={<PlayArrowRoundedIcon />}
            variant="contained"
            aria-label="Play all"
            onClick={() => play()}
            size="large"
            sx={{
              width: { xs: "50%", sm: 164 },
              minHeight: 50,
              bgcolor: "#fff",
              color: "#000",
              borderRadius: "999px",
              fontSize: 16,
              fontWeight: 850,
              "&:hover": { bgcolor: "#e9e9e9" }
            }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleRoundedIcon />}
            aria-label="Shuffle play"
            onClick={() => play(true)}
            size="large"
            sx={{
              width: { xs: "50%", sm: 164 },
              minHeight: 50,
              bgcolor: "rgba(255,255,255,.14)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "999px",
              fontSize: 16,
              fontWeight: 850,
              "&:hover": { bgcolor: "rgba(255,255,255,.22)" }
            }}
          >
            Shuffle
          </Button>
        </Box>

        <Box
          aria-label="Album actions"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(64px, 1fr))",
            width: { xs: "100%", sm: 390 },
            gap: { xs: 1, sm: 2 }
          }}
        >
          <AlbumAction
            label="Add"
            icon={<FavoriteBorderRoundedIcon />}
            onClick={() => setAddToPlaylistOpen(true)}
          />
          <AlbumAction
            label="Credits"
            icon={<InfoOutlinedIcon />}
            onClick={(event) => setCreditsAnchor(event.currentTarget)}
          />
          <AlbumAction label="Share" icon={<IosShareOutlinedIcon />} onClick={shareAlbum} />
          <AlbumAction
            label="More"
            icon={<MoreHorizRoundedIcon />}
            onClick={(event) => setMoreAnchor(event.currentTarget)}
          />
        </Box>
      </Box>

      <Menu
        anchorEl={creditsAnchor}
        open={Boolean(creditsAnchor)}
        onClose={() => setCreditsAnchor(null)}
      >
        <Box sx={{ px: 2, py: 1.25, minWidth: 240 }}>
          <Typography fontWeight={850}>{album.title}</Typography>
          <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.75 }}>
            Artist: {album.artist}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            Release year: {album.year}
          </Typography>
          {album.genre.length > 0 && (
            <Typography color="text.secondary" fontSize={13}>
              Genre: {album.genre.join(", ")}
            </Typography>
          )}
        </Box>
      </Menu>

      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={copyAlbumLink}>Copy album link</MenuItem>
        <MenuItem
          onClick={() => {
            setMoreAnchor(null);
            router.navigate(artistPath(album.artist));
          }}
        >
          Go to artist
        </MenuItem>
      </Menu>

      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        songIds={album.trackList.map((song) => song._id)}
      />
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2200}
        onClose={() => setMessage("")}
        message={message}
      />
    </>
  );
};

interface AlbumActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const AlbumAction: React.FC<AlbumActionProps> = ({ icon, label, onClick }) => (
  <Button
    aria-label={label}
    onClick={onClick}
    sx={{
      minWidth: 0,
      color: "#fff",
      display: "flex",
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
