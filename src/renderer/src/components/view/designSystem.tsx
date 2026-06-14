import React from "react";
import { Box, Button, CircularProgress, SxProps, Theme, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";

export function CollectionContent({
  children,
  sx
}: React.PropsWithChildren<{ sx?: SxProps<Theme> }>): React.ReactElement {
  return (
    <Box
      data-design="filtered-collection-content"
      sx={(theme) => ({
        maxWidth: theme.design.layout.collectionWidth,
        mx: "auto",
        px: theme.design.layout.gutters,
        pb: 3,
        ...((typeof sx === "object" ? sx : {}) as object)
      })}
    >
      {children}
    </Box>
  );
}

export function DetailContent({
  children,
  compactGutter = false,
  sx
}: React.PropsWithChildren<{
  compactGutter?: boolean;
  sx?: SxProps<Theme>;
}>): React.ReactElement {
  return (
    <Box
      component="section"
      data-design="media-detail-content"
      sx={(theme) => ({
        maxWidth: theme.design.layout.detailWidth,
        mx: "auto",
        px: compactGutter ? { xs: 1.5, sm: 4, lg: 6 } : theme.design.layout.gutters,
        ...((typeof sx === "object" ? sx : {}) as object)
      })}
    >
      {children}
    </Box>
  );
}

export function PageState({
  state,
  message
}: {
  state: "loading" | "empty" | "error";
  message?: string;
}): React.ReactElement {
  return (
    <Box
      role={state === "error" ? "alert" : "status"}
      sx={{ display: "grid", placeItems: "center", minHeight: state === "loading" ? 280 : 160 }}
    >
      {state === "loading" ? (
        <CircularProgress />
      ) : (
        <Typography color="text.secondary">{message}</Typography>
      )}
    </Box>
  );
}

export function DetailActionButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}): React.ReactElement {
  return (
    <Button
      aria-label={label}
      onClick={onClick}
      sx={{
        minWidth: 0,
        display: "flex",
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
}

export function DetailActions({
  primary,
  secondary,
  secondaryColumns = 4
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  secondaryColumns?: number;
}): React.ReactElement {
  return (
    <Box
      data-design="media-detail-actions"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: { xs: 3.25, md: 4 },
        mt: { xs: 3.5, md: 4 }
      }}
    >
      {primary}
      {secondary && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${secondaryColumns}, minmax(64px, 1fr))`,
            width: { xs: "100%", sm: Math.min(390, secondaryColumns * 98) },
            gap: { xs: 1, sm: 2 }
          }}
        >
          {secondary}
        </Box>
      )}
    </Box>
  );
}

export function PrimaryActionGroup({
  onPlay,
  onShuffle,
  showShuffle = true,
  playLabel = "Play",
  playAriaLabel = "Play all",
  shuffleAriaLabel = "Shuffle play",
  shuffleLabel = "Shuffle"
}: {
  onPlay: () => void;
  onShuffle?: () => void;
  showShuffle?: boolean;
  playLabel?: string;
  playAriaLabel?: string;
  shuffleAriaLabel?: string;
  shuffleLabel?: string;
}): React.ReactElement {
  return (
    <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
      <Button
        startIcon={<PlayArrowRoundedIcon />}
        variant="contained"
        aria-label={playAriaLabel}
        onClick={onPlay}
        size="large"
        sx={{
          width: { xs: showShuffle ? "50%" : "100%", sm: 164 },
          minHeight: 50,
          bgcolor: "#fff",
          color: "#000",
          borderRadius: "999px",
          fontSize: 16,
          fontWeight: 850,
          "&:hover": { bgcolor: "#e9e9e9" }
        }}
      >
        {playLabel}
      </Button>
      {showShuffle && (
        <Button
          startIcon={<ShuffleRoundedIcon />}
          aria-label={shuffleAriaLabel}
          onClick={onShuffle}
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
          {shuffleLabel}
        </Button>
      )}
    </Box>
  );
}
