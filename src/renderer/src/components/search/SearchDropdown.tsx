import React from "react";
import type { SearchResult } from "@renderer/types/shared";
import { SearchResultRow, useSearchResultItems } from "./SearchResultItems";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

interface SearchDropdownProps {
  query: string;
  result: SearchResult | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onNavigate: (query: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  result,
  loading,
  open,
  onClose,
  onNavigate
}) => {
  const playSource = {
    type: "search" as const,
    id: query,
    label: `Search: ${query}`,
    route: `/search?q=${encodeURIComponent(query)}`
  };

  const previewItems = useSearchResultItems({
    result,
    query,
    playSource,
    onBeforeAction: onClose,
    topLimit: 12
  }).top;

  if (!open || !query) return null;

  const handleViewAll = (): void => {
    onClose();
    onNavigate(query);
  };

  const hasResults =
    result &&
    (result.songs.length > 0 ||
      result.albums.length > 0 ||
      result.videos.length > 0 ||
      result.chapters.length > 0);

  return (
    <Paper
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        mt: 2,
        zIndex: 1300,
        bgcolor: (theme) => theme.design.color.surface,
        border: (theme) => `1px solid ${theme.design.color.border}`,
        borderRadius: (theme) => `${theme.design.radius.card}px`,
        overflow: "hidden",
        boxShadow: (theme) => theme.design.shadow.menu,
        color: "text.primary",
        maxHeight: "min(68vh, 520px)",
        overflowY: "auto"
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2.5 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && !hasResults && (
        <Typography sx={{ px: 3, py: 2.5, fontWeight: 600 }} color="text.secondary" variant="body2">
          No results found
        </Typography>
      )}

      {!loading && hasResults && (
        <>
          {previewItems.map((item) => (
            <SearchResultRow key={item.id} item={item} dense />
          ))}
          <Box
            onClick={handleViewAll}
            sx={{
              px: 2,
              py: 1.35,
              cursor: "pointer",
              borderTop: (theme) => `1px solid ${theme.design.color.border}`,
              "&:hover": { bgcolor: (theme) => theme.design.color.surfaceHover }
            }}
          >
            <Typography variant="body2" color="primary" fontWeight={600} textAlign="center">
              More results
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};
