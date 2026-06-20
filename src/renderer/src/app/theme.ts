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
    frostedGlassSurface: string;
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
    sectionTitle: CSSProperties;
    mediaTitle: CSSProperties;
    metadata: CSSProperties;
    overline: CSSProperties;
  };
}

const design: DesignTokens = {
  color: {
    canvas: "#000",
    surface: "#171717",
    frostedGlassSurface:
      "linear-gradient(0deg, #46464659 0%, #43434359 19%, #41414159 34%, #3f3f3f59 47%, #3e3e3e59 56.5%, #3d3d3d59 65%, #3c3c3c59 73%, #3c3c3c59 100%)",
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
    detailWidth: 1500,
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
    pageTitle: { fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: "-.04em" },
    detailTitle: { fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: "-.035em" },
    sectionTitle: { fontSize: 19, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0 },
    mediaTitle: { fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" },
    metadata: { fontSize: 13, color: "#a7a7a7" },
    overline: {
      fontSize: 11,
      fontWeight: 700,
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
    fontFamily: '"Square Sans Display VF", "Square Sans Display", Helvetica, Arial, sans-serif',
    fontWeightRegular: 600,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      fontWeight: 600
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
      defaultProps: {
        marginThreshold: 12
      },
      styleOverrides: {
        list: {
          padding: "14px 0"
        },
        paper: {
          minWidth: 220,
          backgroundImage: "none",
          backgroundColor: "#2d2d2d",
          border: 0,
          borderRadius: 16,
          boxShadow: design.shadow.menu,
          color: design.color.text
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: "10px 24px",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: 0,
          color: design.color.text,
          "&:hover": {
            backgroundColor: "rgba(255,255,255,.08)"
          },
          "&.Mui-focusVisible": {
            backgroundColor: "rgba(255,255,255,.1)"
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(255,255,255,.1)"
          },
          "&.Mui-selected:hover": {
            backgroundColor: "rgba(255,255,255,.14)"
          },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,.42)",
            opacity: 1
          }
        }
      }
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          marginThreshold: 12
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
