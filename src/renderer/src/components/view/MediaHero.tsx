import React from "react";
import { Avatar, Box, SxProps, Theme, Typography } from "@mui/material";

interface MediaHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  imageSrc?: string;
  artworkSize?: { xs: number; sm: number };
  titleSx?: SxProps<Theme>;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const MediaHero: React.FC<MediaHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  description,
  icon,
  imageSrc,
  artworkSize = { xs: 72, sm: 96 },
  titleSx,
  children,
  sx
}) => (
  <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 12 }, pb: 4, ...sx }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 2, sm: 3 },
        flexWrap: { xs: "wrap", sm: "nowrap" }
      }}
    >
      {(icon || imageSrc) && (
        <Avatar
          src={imageSrc}
          variant="square"
          sx={{
            width: artworkSize,
            height: artworkSize,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,.12)",
            flexShrink: 0,
            "& .MuiSvgIcon-root": {
              fontSize: { xs: 36, sm: 48 },
              color: "#d6d6d6"
            }
          }}
        >
          {icon}
        </Avatar>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, zIndex: 1 }}>
        <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
          {eyebrow}
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 38, sm: 58 },
            fontWeight: 900,
            lineHeight: 1,
            mt: icon || imageSrc ? 0 : 1,
            ...titleSx
          }}
          noWrap={typeof title === "string"}
        >
          {title}
        </Typography>
        {description && (
          <Typography color="#c9c9c9" sx={{ mt: 1.5, maxWidth: 620 }}>
            {description}
          </Typography>
        )}
        {subtitle && (
          <Typography component="div" fontSize={16} color="#c9c9c9" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  </Box>
);
