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
  ListSubheader,
  ThemeProvider,
  createTheme
} from "@mui/material";
import { router } from "../router";
import { appAPI } from "../core/api";
import { Playlist } from "../core/Playlist";
import { usePlaylistRefresh } from "../contexts/PlaylistRefreshContext";
import styled from "@emotion/styled";

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

const MyListItem = styled(ListItem)({
  padding: "0 8px",
  color: "#919191"
});

const MyListItemButton = styled(ListItemButton)({
  "&:hover": {
    borderRadius: "8px"
  }
});

const MyListSubheader = styled(ListSubheader)({
  fontSize: "12px",
  lineHeight: "36px",
  marginLeft: "8px",
  backgroundColor: "rgb(0, 0, 0)"
});

interface SidebarProps {
  drawerWidth: number;
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, onCreatePlaylist }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { refreshKey } = usePlaylistRefresh();

  useEffect(() => {
    appAPI.listPlaylists().then(setPlaylists);
  }, [refreshKey]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Drawer
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box"
          },
          userSelect: "none"
        }}
        PaperProps={{
          sx: { backgroundColor: "rgb(0, 0, 0)" }
        }}
        variant="permanent"
        anchor="left"
      >
        <div style={{ padding: "16px 24px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>Aimer live music</div>
        </div>
        <List subheader={<MyListSubheader>MY COLLECTION</MyListSubheader>}>
          <MyListItem key={"Home"}>
            <MyListItemButton onClick={() => router.navigate("/")}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary={"Home"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Playlist"}>
            <MyListItemButton onClick={() => router.navigate("/playlists")}>
              <ListItemIcon>
                <QueueMusicIcon />
              </ListItemIcon>
              <ListItemText primary={"Playlists"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Albums"}>
            <MyListItemButton onClick={() => router.navigate("/albums")}>
              <ListItemIcon>
                <AlbumIcon />
              </ListItemIcon>
              <ListItemText primary={"Albums"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Songs"}>
            <MyListItemButton onClick={() => router.navigate("/songs")}>
              <ListItemIcon>
                <MusicNoteIcon />
              </ListItemIcon>
              <ListItemText primary={"Songs"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Videos"}>
            <MyListItemButton onClick={() => router.navigate("/videos")}>
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
              <MyListItemButton onClick={() => router.navigate(`/playlist/${pl._id}`)}>
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
    </ThemeProvider>
  );
};
