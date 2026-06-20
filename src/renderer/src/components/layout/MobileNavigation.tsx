import AlbumOutlinedIcon from "@mui/icons-material/AlbumOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, IconButton } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { isMobileNavItemActive } from "./mobileNavigationRoutes";

const items = [
  { label: "Home", path: "/", icon: HomeOutlinedIcon },
  { label: "Videos", path: "/videos", icon: VideoLibraryOutlinedIcon },
  { label: "Albums", path: "/albums", icon: AlbumOutlinedIcon },
  { label: "Playlists", path: "/playlists", icon: LibraryMusicOutlinedIcon },
  { label: "Search", path: "/search", icon: SearchOutlinedIcon }
];

export function MobileNavigation(): React.JSX.Element {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Mobile navigation"
      onClick={(event) => event.stopPropagation()}
      sx={{
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        px: 1,
        pb: 0.5
      }}
    >
      {items.map(({ label, path, icon: Icon }) => {
        const selected = isMobileNavItemActive(location.pathname, path);
        return (
          <IconButton
            key={label}
            component={NavLink}
            to={path}
            aria-label={label}
            aria-current={selected ? "page" : undefined}
            sx={{
              width: 56,
              height: 40,
              borderRadius: "999px",
              color: selected ? "#fff" : "rgba(239,235,220,.62)",
              bgcolor: selected ? "rgba(255,255,255,.14)" : "transparent",
              transition: "color 160ms ease, background-color 160ms ease",
              "&:hover": {
                color: "#fff",
                bgcolor: selected ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.07)"
              },
              "& .MuiSvgIcon-root": { fontSize: 22 }
            }}
          >
            <Icon />
          </IconButton>
        );
      })}
    </Box>
  );
}
