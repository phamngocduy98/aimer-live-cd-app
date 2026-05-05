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
  FormControl,
  IconButton,
  InputAdornment,
  InputBase,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Select,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ListItemSecondaryAction,
  CircularProgress
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
import React, { useState, useEffect } from "react";
import { SelectChangeEvent } from "@mui/material/Select";
import DeleteIcon from "@mui/icons-material/Delete";
import { appAPI, Host } from "./core/api";
const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

const drawerWidth = 240;

function App() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
  const [pingResults, setPingResults] = useState<Record<string, {
    loading: boolean;
    available: boolean | null;
    files: { fileName: string; parts: string; title: string; fileCount: number }[];
    error?: string;
  }>>({});

  const [isAddHostDialogOpen, setIsAddHostDialogOpen] = useState(false);
  const [newHost, setNewHost] = useState({
    host: '',
    provider: 'infinityfree.net',
    path: '/audio',
    ftpHost: 'ftpupload.net',
    ftpPort: 21,
    ftpUsername: '',
    ftpPassword: '',
    ftpRoot: '/htdocs'
  });

  useEffect(() => {
    if (!isHostDialogOpen) return;
    const loadHosts = async () => {
      setIsLoadingHosts(true);
      try {
        const data = await appAPI.getHosts();
        setHosts(data);
      } catch (err) {
        console.error("Failed to load hosts:", err);
      } finally {
        setIsLoadingHosts(false);
      }
    };
    loadHosts();
  }, [isHostDialogOpen]);

  const handleDeleteHost = async (hostId: string) => {
    try {
      await appAPI.deleteHost(hostId);
      setHosts(prev => prev.filter(host => host._id !== hostId));
    } catch (err) {
      console.error("Failed to delete host:", err);
    }
  };

  const triggerPing = async (hostId: string) => {
    setPingResults(prev => ({
      ...prev,
      [hostId]: { loading: true, available: null, files: [] }
    }));

    try {
      const result = await appAPI.pingHost(hostId);
      setPingResults(prev => ({
        ...prev,
        [hostId]: {
          loading: false,
          available: result.available,
          files: result.files
        }
      }));
    } catch (err) {
      setPingResults(prev => ({
        ...prev,
        [hostId]: { loading: false, available: false, files: [], error: "Ping failed" }
      }));
    }
  };

  const handleNewHostChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    let value: string | number = event.target.value;
    if ('type' in event.target && event.target.type === 'number') {
      value = Number(event.target.value);
    }
    setNewHost(prev => ({ ...prev, [field]: value }));
  };

  const handleAddHost = async () => {
    try {
const payload = {
  host: newHost.host,
  provider: newHost.provider,
  path: newHost.path,
  ftpCredential: {
    host: newHost.ftpHost,
    port: newHost.ftpPort,
    username: newHost.ftpUsername,
    password: newHost.ftpPassword
  },
  ftpRoot: newHost.ftpRoot
};
      await appAPI.createHost(payload);
      const updatedHosts = await appAPI.getHosts();
      setHosts(updatedHosts);
      setIsAddHostDialogOpen(false);
      setNewHost({
        host: '',
        provider: 'infinityfree.net',
        path: '/audio',
        ftpHost: 'ftpupload.net',
        ftpPort: 21,
        ftpUsername: '',
        ftpPassword: '',
        ftpRoot: '/htdocs'
      });
    } catch (err) {
      console.error("Failed to add host:", err);
    }
  };
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
          <Grid xs="auto" sx={{ marginLeft: 2, display: { xs: "none", sm: "unset" } }}>
            <IconButton
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setIsMenuOpen(true);
              }}
              size="small"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "14px" }}>
                U
              </Avatar>
            </IconButton>
          </Grid>
        </Grid>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          setAnchorEl(null);
        }}
      >
        <MenuItem
          onClick={() => {
            setIsMenuOpen(false);
            setAnchorEl(null);
            setIsHostDialogOpen(true);
          }}
        >
          Manage Hosts
        </MenuItem>
      </Menu>
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
      <Dialog
        open={isHostDialogOpen}
        onClose={() => setIsHostDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Hosts</DialogTitle>
        <DialogContent>
          {isLoadingHosts ? (
            <CircularProgress sx={{ display: "block", margin: "24px auto" }} />
          ) : (
            <List>
              {hosts.length === 0 ? (
                <Typography sx={{ padding: 2, color: "text.secondary" }}>
                  No hosts found.
                </Typography>
              ) : (
                hosts.map((host) => (
                  <ListItem key={host._id} sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <ListItemText 
  primary={host.host} 
  secondary={`${host.provider}${host.path ? ` • ${host.path}` : ''}`} 
/>
                      <ListItemSecondaryAction sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => triggerPing(host._id)}
                          disabled={pingResults[host._id]?.loading}
                        >
                          {pingResults[host._id]?.loading ? "Pinging..." : "Ping"}
                        </Button>
                        <IconButton edge="end" onClick={() => handleDeleteHost(host._id)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </Box>

                    {pingResults[host._id] && (
                      <Box sx={{ mt: 1, pl: 2, width: "100%" }}>
                        {pingResults[host._id].loading ? (
                          <CircularProgress size={16} />
                        ) : pingResults[host._id].available ? (
                          <Box>
                            <Typography variant="caption" color="success.main">
                              ✅ Available • {pingResults[host._id].files.length} titles found
                            </Typography>
                            {pingResults[host._id].files.length > 0 && (
                              <List dense sx={{ maxHeight: 120, overflow: "auto", py: 0, mt: 0.5 }}>
{pingResults[host._id].files.map((file, idx) => (
  <ListItem key={idx} sx={{ py: 0, pl: 1 }}>
    <ListItemText 
      primary={`${file.title} (${file.fileName}): ${file.parts} • ${file.fileCount} files`} 
      primaryTypographyProps={{ variant: "caption" }} 
    />
  </ListItem>
))}
                              </List>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="error.main">
                            ❌ Unavailable
                            {pingResults[host._id].error && ` • ${pingResults[host._id].error}`}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </ListItem>
                ))
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddHostDialogOpen(true)}>Add Host</Button>
          <Button onClick={() => setIsHostDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Host Dialog */}
      <Dialog
        open={isAddHostDialogOpen}
        onClose={() => setIsAddHostDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Host</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Host Name"
              value={newHost.host}
              onChange={handleNewHostChange('host')}
              fullWidth
              required
              helperText="A friendly name for this host"
            />
            <TextField
              label="Host Path (HTTP URL)"
              value={newHost.path}
              onChange={handleNewHostChange('path')}
              fullWidth
              helperText="URL path for streaming (e.g., /audio). Combined with host for HTTP access."
            />
            <FormControl fullWidth required>
              <InputLabel>Provider</InputLabel>
              <Select
                value={newHost.provider}
                label="Provider"
                onChange={handleNewHostChange('provider')}
              >
                <MenuItem value="infinityfree.net">infinityfree.net</MenuItem>
                <MenuItem value="awardspace.net">awardspace.net</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="FTP Host"
              value={newHost.ftpHost}
              onChange={handleNewHostChange('ftpHost')}
              fullWidth
              required
              helperText="Default: ftpupload.net"
            />
            <TextField
              label="FTP Port"
              type="number"
              value={newHost.ftpPort}
              onChange={handleNewHostChange('ftpPort')}
              fullWidth
              required
            />
            <TextField
              label="FTP Username"
              value={newHost.ftpUsername}
              onChange={handleNewHostChange('ftpUsername')}
              fullWidth
              required
            />
            <TextField
              label="FTP Password"
              type="password"
              value={newHost.ftpPassword}
              onChange={handleNewHostChange('ftpPassword')}
              fullWidth
              required
            />
            <TextField
              label="FTP Root Directory"
              value={newHost.ftpRoot}
              onChange={handleNewHostChange('ftpRoot')}
              fullWidth
              required
              helperText="FTP server directory (e.g., /htdocs/audio)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddHostDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddHost} variant="contained">Add Host</Button>
        </DialogActions>
      </Dialog>
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
