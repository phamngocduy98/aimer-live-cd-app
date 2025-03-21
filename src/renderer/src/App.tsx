import styled from "@emotion/styled";
import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import {
  alpha,
  Box,
  createTheme,
  CssBaseline,
  Drawer,
  IconButton,
  InputAdornment,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography
} from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAppDispatch, useAppSelector } from "./store/hook";
import { showView, toggleView } from "./store/player/playerGuiSlice";
import { FloatingQueueList } from "./views/player/FloatingQueueList";
import MPlayerUI from "./views/player/MPlayerUI";
import { MobilePlayer } from "./views/player/MobilePlayerUI";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Grid from "@mui/material/Unstable_Grid2";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

const drawerWidth = 240;

function App() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const dispatch = useAppDispatch();
  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          marginBottom: "350px"
        }}
      >
        <CssBaseline />
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
            sx: { backgroundColor: "rgb(36, 36, 41)" }
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar style={{ padding: "16px 24px" }}>
            <Typography component="div" fontSize={20} fontWeight={700}>
              Aimer live music
            </Typography>
          </Toolbar>
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
              <MyListItemButton onClick={() => router.navigate("/")}>
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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "black",
            p: 3,
            height: "100%",
            paddingBottom: "86px",
            overflow: "hidden auto",
            marginBottom: 330,
            padding: 0
          }}
        >
          <RouterProvider router={router} />
        </Box>
      </Box>
      {/* Top navi */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          width: {
            xs: "100%",
            md: "calc(100% - 240px)"
          }
        }}
      >
        <Grid
          container
          sx={{
            padding: "16px 32px 0 24px"
          }}
        >
          <Grid xs>
            <IconButton
              size="large"
              sx={{
                fontSize: "14px",
                "&:hover": {
                  backgroundColor: "#fcfcfc29"
                },
                backgroundColor: "#fcfcfc29"
              }}
              onClick={() => router.navigate("/")}
            >
              <ArrowBackIosNewIcon fontSize="inherit" />
            </IconButton>
          </Grid>
          <Grid xs="auto" sx={{ display: { xs: "none", sm: "unset" } }}>
            <BootstrapInput
              size="small"
              placeholder="Search"
              startAdornment={
                <InputAdornment position="start" sx={{ fontSize: "16px" }}>
                  <SearchIcon fontSize="inherit" />
                </InputAdornment>
              }
              // endAdornment={
              //   <InputAdornment position="end">
              //     <CloseIcon fontSize="inherit" />
              //   </InputAdornment>
              // }
            />
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          position: "fixed",
          bottom: {
            xs: showMobilePlayer ? "80px" : 0,
            sm: 0
          },
          left: 0,
          right: 0,
          zIndex: 1202,
          userSelect: "none"
        }}
        onClick={() => {
          dispatch(toggleView("mobilePlayer"));
        }}
      >
        <MPlayerUI />
      </Box>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          transform: `translateY(${showMobilePlayer ? "0" : "100dvh"})`,
          transition: "transform .6s ease"
        }}
      >
        <MobilePlayer />
      </div>

      <FloatingQueueList />
    </ThemeProvider>
  );
}
const MyListItem = styled(ListItem)(({ theme }) => ({
  padding: "0 8px"
}));

const MyListItemButton = styled(ListItemButton)(({ theme }) => ({
  "&:hover": {
    borderRadius: "8px"
  }
}));

const MyListSubheader = styled(ListSubheader)(({ theme }) => ({
  fontSize: "12px",
  lineHeight: "36px",
  marginLeft: "8px",
  backgroundColor: "rgb(36, 36, 41)"
}));

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  // 'label + &': {
  //   marginTop: theme.spacing(3),
  // },
  "& .MuiInputAdornment-positionStart": {
    position: "absolute",
    left: "12px",
    zIndex: 1
  },
  "& .MuiInputAdornment-positionEnd": {
    position: "absolute",
    right: "12px",
    zIndex: 1
  },
  "&.Mui-focused .MuiInputAdornment-root": {
    color: "black"
  },
  "& .MuiInputBase-input": {
    borderRadius: "12px",
    position: "relative",
    backgroundColor: "#242429cc",
    border: "1px solid",
    borderColor: "#ffffff1a",
    fontSize: "14px",
    width: "auto",
    padding: "10px 12px 10px 38px",
    // @ts-ignore
    transition: theme.transitions.create(["border-color", "background-color", "box-shadow"]),
    "&:focus": {
      // @ts-ignore
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      // @ts-ignore
      borderColor: theme.palette.primary.main,
      backgroundColor: "white",
      color: "black",
      width: "400px",
      maxWidth: "50vw"
    }
  }
}));

export default App;
