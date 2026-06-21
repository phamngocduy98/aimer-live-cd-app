import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import type React from "react";

export const songTableBodyColumnDisplay = {
  artist: { xs: "none", sm: "table-cell" },
  detail: { xs: "none", md: "table-cell" },
  metadata: { xs: "none", lg: "table-cell" }
} as const;

export const songTableHeadColumnDisplay = {
  detail: { sm: "none", md: "table-cell" },
  metadata: { sm: "none", lg: "table-cell" }
} as const;

interface SongTableIndexCellProps {
  active: boolean;
  children: React.ReactNode;
}

export function SongTableIndexCell({
  active,
  children
}: SongTableIndexCellProps): React.ReactElement {
  if (active) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <VolumeUpIcon className="now-playing-accent" sx={{ width: 16, height: 16 }} />
      </Box>
    );
  }

  return (
    <Typography fontSize="14px" fontWeight={500} color="#79777f">
      {children}
    </Typography>
  );
}

interface SongTableTitleTextProps {
  active?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export function SongTableTitleText({
  active = false,
  children,
  sx
}: SongTableTitleTextProps): React.ReactElement {
  return (
    <Typography
      className={active ? "now-playing-accent" : undefined}
      noWrap
      textOverflow="ellipsis"
      sx={[
        {
          fontSize: { xs: "14px", sm: "inherit" },
          fontWeight: 600
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])
      ]}
    >
      {children}
    </Typography>
  );
}
