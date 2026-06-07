import AlbumOutlinedIcon from "@mui/icons-material/AlbumOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, IconButton } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { label: "Home", path: "/", icon: HomeOutlinedIcon },
  { label: "Songs", path: "/songs", icon: MusicNoteOutlinedIcon },
  { label: "Albums", path: "/albums", icon: AlbumOutlinedIcon },
  { label: "Playlists", path: "/playlists", icon: LibraryMusicOutlinedIcon },
  { label: "Search", path: "/search", icon: SearchOutlinedIcon }
];

export function MobileNavigation() {
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
        px: 1.25,
        pb: 0.5
      }}
    >
      {items.map(({ label, path, icon: Icon }) => {
        const selected =
          path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <IconButton
            key={label}
            component={NavLink}
            to={path}
            aria-label={label}
            aria-current={selected ? "page" : undefined}
            sx={{
              width: 44,
              height: 44,
              color: selected ? "#fff" : "#868686",
              "& .MuiSvgIcon-root": { fontSize: 23 }
            }}
          >
            <Icon />
          </IconButton>
        );
      })}
    </Box>
  );
}
