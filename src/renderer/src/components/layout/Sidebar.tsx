import AddCircleIcon from "@mui/icons-material/AddCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import QueueMusicOutlinedIcon from "@mui/icons-material/QueueMusicOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import { Box, Drawer, IconButton, List, ListItemButton, Tooltip, Typography } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { usePlaylists } from "@features/playlist";
import { BrandMark } from "./BrandMark";

interface SidebarProps {
  drawerWidth: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCreatePlaylist: () => void;
}

const primaryItems = [
  { label: "Home", path: "/", icon: HomeOutlinedIcon },
  { label: "Albums", path: "/albums", icon: ExploreOutlinedIcon },
  { label: "Songs", path: "/songs", icon: MusicNoteOutlinedIcon },
  { label: "Videos", path: "/videos", icon: VideoLibraryOutlinedIcon },
  { label: "Playlists", path: "/playlists", icon: LibraryMusicOutlinedIcon }
];

export const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth,
  collapsed,
  onToggleCollapsed,
  onCreatePlaylist
}) => {
  const { data: playlists = [] } = usePlaylists();
  const { pathname } = useLocation();
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    if (path === "/playlists") return pathname.startsWith("/playlist");
    if (path === "/albums") return pathname.startsWith("/album");
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      sx={{
        display: { xs: "none", sm: "block" },
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(255,255,255,.06)",
          bgcolor: "#050505",
          px: collapsed ? 1 : 1.5,
          overflowX: "hidden",
          transition: "width 220ms ease, padding 220ms ease"
        },
        transition: "width 220ms ease",
        userSelect: "none"
      }}
      variant="permanent"
      anchor="left"
    >
      <Box
        sx={{
          height: 82,
          pl: collapsed ? 1 : 2,
          pr: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between"
        }}
      >
        <BrandMark />
        <IconButton
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={onToggleCollapsed}
          size="small"
          sx={{
            position: collapsed ? "absolute" : "static",
            top: collapsed ? 26 : "auto",
            left: collapsed ? 23 : "auto",
            zIndex: collapsed ? 1 : "auto",
            width: 30,
            height: 30,
            bgcolor: "transparent",
            color: collapsed ? "transparent" : "#888",
            border: collapsed ? "1px solid rgba(255,255,255,.08)" : "none",
            "&:hover": {
              bgcolor: collapsed ? "#1e1e1e" : "rgba(255,255,255,.08)",
              color: "#fff"
            }
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <List disablePadding sx={{ display: "grid", gap: 0.5 }}>
        {primaryItems.map(({ label, path, icon: Icon }) => {
          const item = (
            <ListItemButton
              key={label}
              component={NavLink}
              to={path}
              aria-label={collapsed ? label : undefined}
              selected={isActive(path)}
              sx={{
                minHeight: 46,
                borderRadius: 2,
                px: collapsed ? 0 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                color: "#888",
                gap: collapsed ? 0 : 1.75,
                "& .MuiSvgIcon-root": { fontSize: 22, flexShrink: 0 },
                "&.Mui-selected": { color: "#fff", bgcolor: "rgba(255,255,255,.08)" },
                "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,.11)" }
              }}
            >
              <Icon />
              {!collapsed && (
                <Typography fontSize={15} fontWeight={600}>
                  {label}
                </Typography>
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={label} title={label} placement="right">
              {item}
            </Tooltip>
          ) : (
            item
          );
        })}
      </List>

      <Box sx={{ mt: collapsed ? 2.5 : 4, px: collapsed ? 0 : 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            px: collapsed ? 0 : 1
          }}
        >
          {!collapsed && (
            <Typography color="#7f7f7f" fontSize={14} fontWeight={600}>
              All playlists
            </Typography>
          )}
          <IconButton aria-label="Create Playlist" size="small" onClick={onCreatePlaylist}>
            <AddCircleIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <List disablePadding sx={{ mt: 1 }}>
          {playlists.map((playlist) => {
            const item = (
              <ListItemButton
                key={playlist._id}
                component={NavLink}
                to={`/playlist/${playlist._id}`}
                aria-label={collapsed ? playlist.name : undefined}
                selected={pathname === `/playlist/${playlist._id}`}
                sx={{
                  borderRadius: 2,
                  px: collapsed ? 0 : 1,
                  py: 1,
                  gap: collapsed ? 0 : 1.25,
                  justifyContent: collapsed ? "center" : "flex-start"
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: 1,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(135deg, #263b38, #7d9386)"
                  }}
                >
                  <QueueMusicOutlinedIcon fontSize="small" />
                </Box>
                {!collapsed && (
                  <Box minWidth={0}>
                    <Typography noWrap fontSize={13} fontWeight={600}>
                      {playlist.name}
                    </Typography>
                    <Typography color="text.secondary" fontSize={11}>
                      {playlist.itemCount} items
                    </Typography>
                  </Box>
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={playlist._id} title={playlist.name} placement="right">
                {item}
              </Tooltip>
            ) : (
              item
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};
