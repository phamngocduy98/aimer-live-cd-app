import { Box, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAppDispatch, useAppSelector } from "./store/hook";
import { toggleView } from "./store/player/playerGuiSlice";
import { FloatingQueueList } from "./views/player/FloatingQueueList";
import MPlayerUI from "./views/player/MPlayerUI";
import { MobilePlayer } from "./views/player/MobilePlayerUI";
import React, { useState, useEffect } from "react";
import { appAPI, Host } from "./core/api";
import { SelectChangeEvent } from "@mui/material/Select";
import { Sidebar } from "./components/Sidebar";
import { TopNavBar } from "./components/TopNavBar";
import { ManageHostsDialog } from "./components/dialogs/ManageHostsDialog";
import { AddHostDialog } from "./components/dialogs/AddHostDialog";
import { ListFilesResult, NewHostState } from "./components/types";

const drawerWidth = 240;

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

function App() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const dispatch = useAppDispatch();

  // Host management state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
  const [fileListResults, setFileListResults] = useState<Record<string, ListFilesResult>>({});
  const [isAddHostDialogOpen, setIsAddHostDialogOpen] = useState(false);
  const [newHost, setNewHost] = useState<NewHostState>({
    host: "",
    provider: "infinityfree.net",
    path: "/audio",
    ftpHost: "ftpupload.net",
    ftpPort: 21,
    ftpUsername: "",
    ftpPassword: "",
    ftpRoot: "/htdocs"
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
      setHosts((prev) => prev.filter((host) => host._id !== hostId));
    } catch (err) {
      console.error("Failed to delete host:", err);
    }
  };

  const triggerListFiles = async (hostId: string) => {
    setFileListResults((prev) => ({
      ...prev,
      [hostId]: { loading: true, available: null, files: [] }
    }));

    try {
      const result = await appAPI.listHostFiles(hostId);
      setFileListResults((prev) => ({
        ...prev,
        [hostId]: {
          loading: false,
          available: result.available,
          files: result.files
        }
      }));
    } catch (err) {
      setFileListResults((prev) => ({
        ...prev,
        [hostId]: { loading: false, available: false, files: [], error: "List files failed" }
      }));
    }
  };

  const handleNewHostChange =
    (field: string) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
      let value: string | number = event.target.value;
      if ("type" in event.target && event.target.type === "number") {
        value = Number(event.target.value);
      }
      setNewHost((prev) => ({ ...prev, [field]: value }));
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
        host: "",
        provider: "infinityfree.net",
        path: "/audio",
        ftpHost: "ftpupload.net",
        ftpPort: 21,
        ftpUsername: "",
        ftpPassword: "",
        ftpRoot: "/htdocs"
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
        <Sidebar drawerWidth={drawerWidth} />

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

      <TopNavBar
        drawerWidth={drawerWidth}
        isMenuOpen={isMenuOpen}
        anchorEl={anchorEl}
        onMenuOpen={(e) => {
          setAnchorEl(e.currentTarget);
          setIsMenuOpen(true);
        }}
        onMenuClose={() => {
          setIsMenuOpen(false);
          setAnchorEl(null);
        }}
        onManageHostsClick={() => setIsHostDialogOpen(true)}
        onBackClick={() => router.navigate("/")}
        onSearch={(q) => {
          if (q) {
            router.navigate(`/search?q=${encodeURIComponent(q)}`);
          } else {
            router.navigate("/");
          }
        }}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: { xs: showMobilePlayer ? "80px" : 0, sm: 0 },
          left: 0,
          right: 0,
          zIndex: 1202,
          userSelect: "none"
        }}
        onClick={() => dispatch(toggleView("mobilePlayer"))}
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

      <ManageHostsDialog
        open={isHostDialogOpen}
        onClose={() => setIsHostDialogOpen(false)}
        hosts={hosts}
        isLoadingHosts={isLoadingHosts}
        fileListResults={fileListResults}
        onDeleteHost={handleDeleteHost}
        onListHostFiles={triggerListFiles}
        onAddHostClick={() => setIsAddHostDialogOpen(true)}
      />

      <AddHostDialog
        open={isAddHostDialogOpen}
        onClose={() => setIsAddHostDialogOpen(false)}
        newHost={newHost}
        onNewHostChange={handleNewHostChange}
        onSubmit={handleAddHost}
      />
    </ThemeProvider>
  );
}

export default App;
