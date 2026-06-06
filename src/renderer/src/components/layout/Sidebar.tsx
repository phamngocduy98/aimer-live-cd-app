import { useEffect, useState } from "react";
import AlbumIcon from "@mui/icons-material/Album";
import HomeIcon from "@mui/icons-material/Home";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import VideocamIcon from "@mui/icons-material/Videocam";
import AddIcon from "@mui/icons-material/Add";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from "@mui/material";
import { router } from "@app/router";
import { usePlaylists } from "@features/playlist";
import styled from "@emotion/styled";

const MyListItem = styled(ListItem)({
  padding: "0 8px",
  color: "#919191"
});

const MyListItemButton = styled(ListItemButton)({
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  "&.Mui-selected": {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    color: "#ffffff"
  },
  "&.Mui-selected:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  "&.Mui-selected .MuiListItemIcon-root": {
    color: "#ffffff"
  }
});

const MyListSubheader = styled(ListSubheader)({
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: ".1em",
  lineHeight: "36px",
  marginLeft: "8px",
  color: "#6f6f6f",
  backgroundColor: "transparent"
});

interface SidebarProps {
  drawerWidth: number;
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, onCreatePlaylist }) => {
  const { data: playlists = [] } = usePlaylists();
  const [location, setLocation] = useState(() => router.state.location);

  useEffect(() => {
    const unsubscribe = router.subscribe((state) => {
      setLocation(state.location);
    });
    return unsubscribe;
  }, []);

  const pathname = location.pathname;
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <Drawer
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(255,255,255,.06)"
          },
          userSelect: "none"
        }}
        PaperProps={{
          sx: { background: "linear-gradient(180deg, #080808 0%, #000 55%)" }
        }}
        variant="permanent"
        anchor="left"
      >
        <div style={{ padding: "20px 24px 18px" }}>
          <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            Aimer live
          </div>
          <div style={{ fontSize: "11px", color: "#707070", marginTop: "2px" }}>
            Personal music library
          </div>
        </div>
        <List subheader={<MyListSubheader>MY COLLECTION</MyListSubheader>}>
          <MyListItem key={"Home"}>
            <MyListItemButton selected={isActive("/")} onClick={() => router.navigate("/")}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary={"Home"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Playlist"}>
            <MyListItemButton
              selected={isActive("/playlists") || pathname.startsWith("/playlist/")}
              onClick={() => router.navigate("/playlists")}
            >
              <ListItemIcon>
                <QueueMusicIcon />
              </ListItemIcon>
              <ListItemText primary={"Playlists"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Albums"}>
            <MyListItemButton
              selected={isActive("/albums") || pathname.startsWith("/album/")}
              onClick={() => router.navigate("/albums")}
            >
              <ListItemIcon>
                <AlbumIcon />
              </ListItemIcon>
              <ListItemText primary={"Albums"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Songs"}>
            <MyListItemButton
              selected={isActive("/songs")}
              onClick={() => router.navigate("/songs")}
            >
              <ListItemIcon>
                <MusicNoteIcon />
              </ListItemIcon>
              <ListItemText primary={"Songs"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Videos"}>
            <MyListItemButton
              selected={isActive("/videos")}
              onClick={() => router.navigate("/videos")}
            >
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary={"Videos"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
        </List>
        <List subheader={<MyListSubheader>PLAYLISTS</MyListSubheader>}>
          {playlists.map((pl) => (
            <MyListItem key={pl._id}>
              <MyListItemButton
                selected={pathname === `/playlist/${pl._id}`}
                onClick={() => router.navigate(`/playlist/${pl._id}`)}
              >
                <ListItemText primary={pl.name} primaryTypographyProps={{ fontSize: "14px" }} />
              </MyListItemButton>
            </MyListItem>
          ))}
          <MyListItem key={"create-playlist"}>
            <MyListItemButton onClick={onCreatePlaylist}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Create Playlist"}
                primaryTypographyProps={{ fontSize: "14px" }}
              />
            </MyListItemButton>
          </MyListItem>
        </List>
      </Drawer>
    </>
  );
};
