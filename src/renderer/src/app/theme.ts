import { createTheme } from "@mui/material";
import type { CSSProperties } from "react";

declare module "@mui/material/styles" {
  interface Theme {
    design: DesignTokens;
  }
  interface ThemeOptions {
    design?: DesignTokens;
  }
}

export interface DesignTokens {
  color: {
    canvas: string;
    surface: string;
    surfaceRaised: string;
    surfaceHover: string;
    overlay: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    accent: string;
    nowPlaying: string;
    nowPlayingBackground: string;
  };
  layout: {
    collectionWidth: number;
    detailWidth: number;
    gutters: { xs: number; sm: number; lg: number };
    topClearance: string;
    playerClearance: { xs: string; sm: string };
  };
  radius: {
    card: number;
    artwork: number;
    control: string;
    row: number;
  };
  shadow: {
    card: string;
    cardHover: string;
    heroArtwork: string;
    menu: string;
  };
  motion: {
    fast: string;
    standard: string;
    lift: string;
  };
  typography: {
    pageTitle: CSSProperties;
    detailTitle: CSSProperties;
    mediaTitle: CSSProperties;
    metadata: CSSProperties;
    overline: CSSProperties;
  };
}

const design: DesignTokens = {
  color: {
    canvas: "#000",
    surface: "#171717",
    surfaceRaised: "#181818",
    surfaceHover: "rgba(255,255,255,.065)",
    overlay: "rgba(0,0,0,.72)",
    border: "rgba(255,255,255,.08)",
    borderStrong: "rgba(255,255,255,.14)",
    text: "#f7f7f7",
    textMuted: "#a7a7a7",
    textSubtle: "#919191",
    accent: "#26e7df",
    nowPlaying: "#ffd42a",
    nowPlayingBackground: "rgba(255,212,42,.12)"
  },
  layout: {
    collectionWidth: 1440,
    detailWidth: 1180,
    gutters: { xs: 2.5, sm: 4, lg: 6 },
    topClearance: "64px",
    playerClearance: { xs: "190px", sm: "120px" }
  },
  radius: {
    card: 10,
    artwork: 12,
    control: "999px",
    row: 5
  },
  shadow: {
    card: "0 16px 36px rgba(0,0,0,.28)",
    cardHover: "0 22px 48px rgba(0,0,0,.48)",
    heroArtwork: "0 28px 80px rgba(0,0,0,.58)",
    menu: "0 20px 60px rgba(0,0,0,.55)"
  },
  motion: {
    fast: "160ms ease",
    standard: "220ms ease",
    lift: "transform .22s ease, box-shadow .22s ease"
  },
  typography: {
    pageTitle: { fontSize: 40, fontWeight: 900, lineHeight: 1, letterSpacing: "-.04em" },
    detailTitle: { fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-.035em" },
    mediaTitle: { fontSize: 14, fontWeight: 750, letterSpacing: "-.01em" },
    metadata: { fontSize: 13, color: "#a7a7a7" },
    overline: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".085em",
      textTransform: "uppercase"
    }
  }
};

export const darkTheme = createTheme({
  design,
  palette: {
    mode: "dark",
    background: {
      default: design.color.canvas,
      paper: design.color.surface
    },
    primary: {
      main: design.color.accent
    },
    text: {
      primary: design.color.text,
      secondary: design.color.textMuted
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily:
      'Inter, "Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, sans-serif',
    button: {
      fontWeight: 750
    }
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 150ms cubic-bezier(.22, 1, .36, 1), background-color 150ms ease",
          "&:hover": {
            transform: "scale(1.1)"
          },
          "&.Mui-disabled:hover": {
            transform: "none"
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none"
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          border: `1px solid ${design.color.border}`,
          boxShadow: design.shadow.menu
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#262626",
          fontSize: 12
        }
      }
    }
  }
});
