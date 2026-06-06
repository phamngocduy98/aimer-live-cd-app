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
      bgcolor: "#000",
      color: "white",
      background,
      backgroundImage,
      backgroundSize: "cover",
      backgroundPosition: "center top",
      backgroundRepeat: "no-repeat",
      pt: "64px",
      pb: { xs: "190px", sm: "120px" },
      overflow: "hidden",
      ...sx
    }}
  >
    {children}
  </Box>
);
