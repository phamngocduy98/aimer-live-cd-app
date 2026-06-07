import React, { Suspense, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@components/layout/Sidebar";
import { TopNavBar } from "@components/layout/TopNavBar";
import { ErrorBoundary } from "@components/common/ErrorBoundary";
import { LoadingFallback } from "@components/common/LoadingFallback";
import { Player } from "@features/player";
import { AddHostDialog, ManageHostsDialog, type NewHostState } from "@features/hosts";
import { CreatePlaylistDialog } from "@features/playlist";

const expandedDrawerWidth = 264;
const collapsedDrawerWidth = 76;

export function AppShell() {
  const theme = useTheme();
  const desktopUp = useMediaQuery(theme.breakpoints.up("lg"));
  const mediumUp = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);
  const [isAddHostDialogOpen, setIsAddHostDialogOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => !desktopUp);
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

  const handleNewHostChange =
    (field: string) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
      const value =
        "type" in event.target && event.target.type === "number"
          ? Number(event.target.value)
          : event.target.value;
      setNewHost((current) => ({ ...current, [field]: value }));
    };

  React.useEffect(() => {
    setIsSidebarCollapsed(!desktopUp || !mediumUp);
  }, [desktopUp, mediumUp]);

  const drawerWidth = isSidebarCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  return (
    <Box sx={{ display: "flex", height: "100dvh", bgcolor: "#000" }}>
      <Sidebar
        drawerWidth={drawerWidth}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "black",
          height: "100%",
          minWidth: 0,
          overflow: "hidden auto",
          scrollbarGutter: "stable"
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <TopNavBar
        key={location.pathname + location.search}
        drawerWidth={drawerWidth}
        isMenuOpen={Boolean(anchorEl)}
        isHome={isHome}
        anchorEl={anchorEl}
        onMenuOpen={(event) => setAnchorEl(event.currentTarget)}
        onMenuClose={() => setAnchorEl(null)}
        onManageHostsClick={() => setIsHostDialogOpen(true)}
        onBackClick={() => navigate("/")}
        onSearch={(query) => navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/")}
      />
      <Player />
      <ManageHostsDialog
        open={isHostDialogOpen}
        onClose={() => setIsHostDialogOpen(false)}
        onAddHostClick={() => setIsAddHostDialogOpen(true)}
      />
      <AddHostDialog
        open={isAddHostDialogOpen}
        onClose={() => setIsAddHostDialogOpen(false)}
        newHost={newHost}
        onNewHostChange={handleNewHostChange}
      />
      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
    </Box>
  );
}
