import React, { useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Button, IconButton, SxProps, Theme } from "@mui/material";
import type { Album } from "@features/library";
import { AlbumCard } from "./AlbumCard";
import { SectionHeader } from "@components/view/SectionHeader";

interface AlbumShelfProps {
  title: string;
  albums: Album[];
  onPlay: (album: Album) => void;
  secondary?: "artist" | "year" | "none";
  sx?: SxProps<Theme>;
}

export const AlbumShelf: React.FC<AlbumShelfProps> = ({
  title,
  albums,
  onPlay,
  secondary = "year",
  sx
}) => {
  const [showAll, setShowAll] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    shelfRef.current?.scrollBy({
      left: direction * Math.min(shelfRef.current.clientWidth * 0.8, 720),
      behavior: "smooth"
    });
  };

  if (albums.length === 0) return null;

  return (
    <Box sx={sx}>
      <SectionHeader
        title={title}
        actions={
          albums.length > 4 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {!showAll && (
                <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
                  <ShelfButton label="Previous albums" onClick={() => scroll(-1)}>
                    <ChevronLeftRoundedIcon />
                  </ShelfButton>
                  <ShelfButton label="Next albums" onClick={() => scroll(1)}>
                    <ChevronRightRoundedIcon />
                  </ShelfButton>
                </Box>
              )}
              <Button
                onClick={() => setShowAll((current) => !current)}
                sx={{
                  color: "#d0d0d0",
                  fontWeight: 750,
                  minWidth: 0,
                  px: 1,
                  mr: -1,
                  "&:hover": { color: "#fff" }
                }}
              >
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
            sm: showAll ? "auto" : "minmax(178px, 1fr)",
            lg: showAll ? "auto" : "minmax(196px, 1fr)"
          },
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: showAll ? "repeat(3, minmax(0, 1fr))" : "none",
            lg: showAll ? "repeat(5, minmax(0, 1fr))" : "none"
          },
          gap: { xs: 2, sm: 2.25 },
          overflowX: { xs: "visible", sm: showAll ? "visible" : "auto" },
          scrollSnapType: { sm: showAll ? "none" : "x mandatory" },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          pb: 1
        }}
      >
        {albums.map((album) => (
          <Box key={album._id} sx={{ minWidth: 0, scrollSnapAlign: "start" }}>
            <AlbumCard album={album} secondary={secondary} onPlay={onPlay} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const ShelfButton: React.FC<React.PropsWithChildren<{ label: string; onClick: () => void }>> = ({
  label,
  onClick,
  children
}) => (
  <IconButton
    aria-label={label}
    onClick={onClick}
    size="small"
    sx={{ bgcolor: "#242424", "&:hover": { bgcolor: "#383838" } }}
  >
    {children}
  </IconButton>
);
