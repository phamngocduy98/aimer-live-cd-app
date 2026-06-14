import React from "react";
import { Box, SxProps, Theme } from "@mui/material";

interface PageScaffoldProps {
  background?: string;
  backgroundImage?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const PageScaffold: React.FC<PageScaffoldProps> = ({
  background,
  backgroundImage,
  children,
  sx
}) => (
  <Box
    sx={{
      minHeight: "100vh",
      bgcolor: (theme) => theme.design.color.canvas,
      color: "white",
      background,
      backgroundImage,
      backgroundSize: "cover",
      backgroundPosition: "center top",
      backgroundRepeat: "no-repeat",
      pt: (theme) => theme.design.layout.topClearance,
      pb: (theme) => theme.design.layout.playerClearance,
      overflow: "hidden",
      ...sx
    }}
  >
    {children}
  </Box>
);
