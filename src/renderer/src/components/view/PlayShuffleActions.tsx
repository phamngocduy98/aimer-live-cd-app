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
      sx={{ textTransform: "none", bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
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
        textTransform: "none",
        bgcolor: "rgba(255,255,255,.16)",
        color: "#fff",
        borderRadius: "999px",
        px: 3
      }}
    >
      {shuffleLabel}
    </Button>
  </Box>
);
