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
import { RadioSync } from "@features/radio";

const expandedDrawerWidth = 264;
const collapsedDrawerWidth = 76;
const AdminDialog = React.lazy(() => import("@features/admin"));

export function AppShell(): JSX.Element {
  const theme = useTheme();
  const desktopUp = useMediaQuery(theme.breakpoints.up("lg"));
  const mediumUp = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isSearchRoute = location.pathname === "/search";
  const searchQuery = React.useMemo(
    () => new URLSearchParams(location.search).get("q") ?? "",
    [location.search]
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => !desktopUp);
  const [isContentScrolled, setIsContentScrolled] = useState(false);
  const contentRef = React.useRef<HTMLElement>(null);
  const { session } = useSession();
  const logout = useLogout();

  React.useEffect(() => {
    setIsSidebarCollapsed(!desktopUp || !mediumUp);
  }, [desktopUp, mediumUp]);

  React.useEffect(() => {
    setIsContentScrolled((contentRef.current?.scrollTop ?? 0) > 4);
  }, [location.pathname, location.search]);

  const drawerWidth = isSidebarCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;
  const openCreatePlaylist = (): void => {
    if (!session.user) {
      setIsLoginOpen(true);
      return;
    }
    setIsCreatePlaylistOpen(true);
  };

  return (
    <Box sx={{ display: "flex", height: "100dvh", bgcolor: "#000" }}>
      <Sidebar
        drawerWidth={drawerWidth}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        onCreatePlaylist={openCreatePlaylist}
      />
      <Box
        ref={contentRef}
        component="main"
        onScroll={(event) => setIsContentScrolled(event.currentTarget.scrollTop > 4)}
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
        isSearchRoute={isSearchRoute}
        initialSearchQuery={searchQuery}
        isContentScrolled={isContentScrolled}
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
      <RadioSync />
      {session.canAccessAdmin && isAdminDialogOpen && (
        <Suspense fallback={null}>
          <AdminDialog open={isAdminDialogOpen} onClose={() => setIsAdminDialogOpen(false)} />
        </Suspense>
      )}
      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SubscriptionRequiredDialog onLoginClick={() => setIsLoginOpen(true)} />
      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
    </Box>
  );
}
