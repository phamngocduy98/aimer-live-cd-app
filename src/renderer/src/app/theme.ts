import { createTheme } from "@mui/material";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000",
      paper: "#171717"
    },
    primary: {
      main: "#26e7df"
    },
    text: {
      primary: "#f7f7f7",
      secondary: "#a7a7a7"
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
          border: "1px solid rgba(255,255,255,.09)",
          boxShadow: "0 20px 60px rgba(0,0,0,.55)"
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
