import React from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { Box, Button, SxProps, Theme } from "@mui/material";

interface PlayShuffleActionsProps {
  onPlay: () => void;
  onShuffle: () => void;
  playLabel?: string;
  shuffleLabel?: string;
  playAriaLabel?: string;
  shuffleAriaLabel?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

export const PlayShuffleActions: React.FC<PlayShuffleActionsProps> = ({
  onPlay,
  onShuffle,
  playLabel = "Play",
  shuffleLabel = "Shuffle",
  playAriaLabel = "play",
  shuffleAriaLabel = "shuffle",
  fullWidth = false,
  sx
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, flexWrap: "wrap", ...sx }}>
    <Button
      startIcon={<PlayArrowIcon />}
      variant="contained"
      aria-label={playAriaLabel}
      onClick={onPlay}
      size="large"
      fullWidth={fullWidth}
      sx={{
        bgcolor: "#fff",
        color: "#000",
        borderRadius: "999px",
        px: 3.5,
        minHeight: 46,
        fontWeight: 800,
        "&:hover": { bgcolor: "#e8e8e8", transform: "translateY(-1px)" }
      }}
    >
      {playLabel}
    </Button>
    <Button
      startIcon={<ShuffleIcon />}
      variant="contained"
      aria-label={shuffleAriaLabel}
      onClick={onShuffle}
      size="large"
      fullWidth={fullWidth}
      sx={{
        bgcolor: "rgba(255,255,255,.14)",
        color: "#fff",
        borderRadius: "999px",
        px: 3.5,
        minHeight: 46,
        fontWeight: 800,
        border: "1px solid rgba(255,255,255,.08)",
        "&:hover": { bgcolor: "rgba(255,255,255,.22)", transform: "translateY(-1px)" }
      }}
    >
      {shuffleLabel}
    </Button>
  </Box>
);
