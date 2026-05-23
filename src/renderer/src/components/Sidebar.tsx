import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
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
}

export const Sidebar: React.FC<SidebarProps> = ({ drawerWidth }) => {
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
          <MyListItem key={"Playlist"}>
            <MyListItemButton onClick={() => router.navigate("/")}>
              <ListItemIcon>
                <QueueMusicIcon />
              </ListItemIcon>
              <ListItemText primary={"Playlists"} primaryTypographyProps={{ fontSize: "14px" }} />
            </MyListItemButton>
          </MyListItem>
          <MyListItem key={"Albums"}>
            <MyListItemButton onClick={() => router.navigate("/")}>
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
        </List>
        <List subheader={<MyListSubheader>PLAYLISTS</MyListSubheader>}>
          <MyListItem key={"playlist1"}>
            <MyListItemButton onClick={() => router.navigate("/")}>
              <ListItemText
                primary={"Aimer best song ever"}
                primaryTypographyProps={{ fontSize: "14px" }}
              />
            </MyListItemButton>
          </MyListItem>
        </List>
      </Drawer>
    </ThemeProvider>
  );
};
