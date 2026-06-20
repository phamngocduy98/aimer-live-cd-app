import React from "react";
import { Box, SxProps, Theme, Typography } from "@mui/material";

export function MediaDetailHero({
  backgroundImage,
  fallbackBackground = "linear-gradient(135deg, #242424 0%, #080808 72%, #000 100%)",
  children,
  testId,
  sx
}: React.PropsWithChildren<{
  backgroundImage?: string | { xs: string; md: string };
  fallbackBackground?: string;
  testId?: string;
  sx?: SxProps<Theme>;
}>): React.ReactElement {
  return (
    <Box
      component="section"
      data-design="media-detail-hero"
      data-testid={testId}
      sx={(theme) => ({
        position: "relative",
        minHeight: { xs: 460 },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: theme.design.color.surface,
        backgroundImage: backgroundImage ?? fallbackBackground,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.08)",
          backdropFilter: { xs: "none", md: "blur(1.5px)" }
        },
        ...((typeof sx === "object" ? sx : {}) as object)
      })}
    >
      <Box
        sx={(theme) => ({
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: theme.design.layout.detailWidth,
          mx: "auto",
          px: theme.design.layout.gutters,
          py: { xs: 2.5, md: 3.5 }
        })}
      >
        {children}
      </Box>
    </Box>
  );
}

export function MediaDetailIdentity({
  artwork,
  title,
  subtitle,
  summary,
  badges,
  artworkTestId
}: {
  artwork: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  summary?: React.ReactNode;
  badges?: React.ReactNode;
  artworkTestId?: string;
}): React.ReactElement {
  return (
    <Box
      data-design="media-detail-identity"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        gap: { xs: 2, sm: 4 },
        textAlign: { xs: "center", sm: "left" }
      }}
    >
      <Box
        data-testid={artworkTestId}
        sx={(theme) => ({
          width: { xs: 152, sm: 240, md: 250 },
          aspectRatio: "1 / 1",
          borderRadius: `${theme.design.radius.artwork}px`,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          bgcolor: theme.design.color.surfaceRaised,
          boxShadow: theme.design.shadow.heroArtwork,
          flexShrink: 0,
          "& img": { width: "100%", height: "100%", objectFit: "cover", display: "block" }
        })}
      >
        {artwork}
      </Box>
      <Box
        sx={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", sm: "flex-start" },
          maxWidth: 760
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 24, sm: 28, lg: 48 },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-.035em",
            textShadow: "0 2px 24px rgba(0,0,0,.55)"
          }}
        >
          {title}
        </Typography>
        {subtitle && <Box sx={{ mt: { xs: 0, sm: 2 } }}>{subtitle}</Box>}
        {summary && (
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              flexWrap: "wrap",
              gap: 0.75,
              mt: 2.25,
              color: "rgba(255,255,255,.78)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".075em",
              textTransform: "uppercase"
            }}
          >
            {summary}
          </Box>
        )}
        {badges && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: { xs: 1.5, sm: 2 } }}>
            {badges}
          </Box>
        )}
      </Box>
    </Box>
  );
}
