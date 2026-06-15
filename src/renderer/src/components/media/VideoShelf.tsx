import React, { useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Button, IconButton, type SxProps, type Theme } from "@mui/material";
import type { Video } from "@features/library";
import { SectionHeader } from "@components/view/SectionHeader";
import { VideoCard } from "./VideoCard";

interface VideoShelfProps {
  title: string;
  videos: Video[];
  onPlay: (video: Video, index: number) => void;
  action?: string;
  onAction?: () => void;
  sx?: SxProps<Theme>;
}

export const VideoShelf: React.FC<VideoShelfProps> = ({
  title,
  videos,
  onPlay,
  action,
  onAction,
  sx
}) => {
  const [showAll, setShowAll] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);

  if (videos.length === 0) return null;

  const scroll = (direction: -1 | 1) => {
    shelfRef.current?.scrollBy({
      left: direction * Math.min(shelfRef.current.clientWidth * 0.8, 720),
      behavior: "smooth"
    });
  };

  return (
    <Box sx={sx}>
      <SectionHeader
        title={title}
        action={action}
        onAction={onAction}
        actions={
          !action && videos.length > 4 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {!showAll && (
                <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
                  <IconButton aria-label="Previous videos" size="small" onClick={() => scroll(-1)}>
                    <ChevronLeftRoundedIcon />
                  </IconButton>
                  <IconButton aria-label="Next videos" size="small" onClick={() => scroll(1)}>
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Box>
              )}
              <Button onClick={() => setShowAll((current) => !current)}>
                {showAll ? "Collapse" : "View all"}
              </Button>
            </Box>
          ) : undefined
        }
      />
      <Box
        ref={shelfRef}
        sx={{
          display: "grid",
          gridAutoFlow: { sm: showAll ? "row" : "column" },
          gridAutoColumns: {
            sm: showAll
              ? "auto"
              : videos.length === 1
                ? "minmax(230px, calc((100% - 36px) / 3))"
                : "minmax(230px, 1fr)",
            lg: showAll
              ? "auto"
              : videos.length === 1
                ? "minmax(230px, calc((100% - 72px) / 5))"
                : "minmax(230px, 1fr)"
          },
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: showAll ? "repeat(3, minmax(0, 1fr))" : "none",
            lg: showAll ? "repeat(5, minmax(0, 1fr))" : "none"
          },
          gap: { xs: 2, sm: 2.25 },
          overflowX: { xs: "visible", sm: showAll ? "visible" : "auto" },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          pb: 1
        }}
      >
        {videos.map((video, index) => (
          <Box key={video._id} sx={{ minWidth: 0 }}>
            <VideoCard video={video} onPlay={() => onPlay(video, index)} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
