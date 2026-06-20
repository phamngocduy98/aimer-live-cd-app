import React from "react";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, IconButton, Typography } from "@mui/material";

export interface MediaCardProps {
  title: string;
  secondary?: React.ReactNode;
  artwork?: React.ReactNode;
  aspect?: "square" | "landscape";
  onOpen: () => void;
  onPlay?: () => void;
  trailingAction?: React.ReactNode;
  onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

export function MediaCard({
  title,
  secondary,
  artwork,
  aspect = "square",
  onOpen,
  onPlay,
  trailingAction,
  onContextMenu
}: MediaCardProps): React.ReactElement {
  return (
    <Box data-design="media-card" sx={{ minWidth: 0 }}>
      <Box
        title={title}
        role="link"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpen();
        }}
        onContextMenu={onContextMenu}
        sx={(theme) => ({
          position: "relative",
          aspectRatio: aspect === "square" ? "1 / 1" : "16 / 9",
          borderRadius: `${theme.design.radius.card}px`,
          overflow: "hidden",
          bgcolor: theme.design.color.surface,
          cursor: "pointer",
          boxShadow: theme.design.shadow.card,
          transition: theme.design.motion.lift,
          display: "grid",
          placeItems: "center",
          "&:hover, &:focus-visible": {
            transform: "translateY(-3px)",
            boxShadow: theme.design.shadow.cardHover,
            outline: "none"
          },
          "&:focus-visible": { boxShadow: `0 0 0 2px ${theme.design.color.accent}` },
          "&:hover img": { transform: "scale(1.04)" },
          "&:hover .media-card-actions, &:focus-visible .media-card-actions": {
            opacity: 1,
            transform: "translateY(0)"
          },
          "& img": {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform .25s ease"
          }
        })}
      >
        {artwork}
        {(onPlay || trailingAction) && (
          <Box
            className="media-card-actions"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              p: 1.25,
              background: "linear-gradient(180deg, transparent 48%, rgba(0,0,0,.72))",
              opacity: 0,
              transform: "translateY(6px)",
              transition: "opacity 160ms ease, transform 160ms ease",
              pointerEvents: "none"
            }}
          >
            {onPlay ? (
              <IconButton
                aria-label={`Play ${title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onPlay();
                }}
                sx={{ bgcolor: "#fff", color: "#111", pointerEvents: "auto" }}
              >
                <PlayArrowRoundedIcon />
              </IconButton>
            ) : (
              <span />
            )}
            {trailingAction}
          </Box>
        )}
      </Box>
      <Typography
        noWrap
        onClick={onOpen}
        sx={(theme) => ({ ...theme.design.typography.mediaTitle, mt: 1.15, cursor: "pointer" })}
      >
        {title}
      </Typography>
      {secondary}
    </Box>
  );
}
