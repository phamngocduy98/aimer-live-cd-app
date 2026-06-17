import React, { Suspense, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@components/layout/Sidebar";
import { TopNavBar } from "@components/layout/TopNavBar";
import { ErrorBoundary } from "@components/common/ErrorBoundary";
import { LoadingFallback } from "@components/common/LoadingFallback";
import { LoginDialog, SubscriptionRequiredDialog, useLogout, useSession } from "@features/auth";
import { Player } from "@features/player";
import { CreatePlaylistDialog } from "@features/playlist";

const expandedDrawerWidth = 264;
const collapsedDrawerWidth = 76;
const AdminDialog = React.lazy(() => import("@features/admin"));

export function AppShell() {
  const theme = useTheme();
  const desktopUp = useMediaQuery(theme.breakpoints.up("lg"));
  const mediumUp = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => !desktopUp);
  const { session } = useSession();
  const logout = useLogout();

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
        session={session}
        onAdminClick={() => setIsAdminDialogOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={() => logout.mutate()}
        onBackClick={() => navigate("/")}
        onSearch={(query) => navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/")}
      />
      <Player />
      {session.canAccessAdmin && isAdminDialogOpen && (
        <Suspense fallback={null}>
          <AdminDialog open={isAdminDialogOpen} onClose={() => setIsAdminDialogOpen(false)} />
        </Suspense>
      )}
      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SubscriptionRequiredDialog />
      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
    </Box>
  );
}
