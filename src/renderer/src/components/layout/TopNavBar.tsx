import { useState, useRef, useEffect } from "react";
import { Debouncer } from "@tanstack/pacer";
import { Box, Grid, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import styled from "@emotion/styled";
import { InputAdornment, InputBase } from "@mui/material";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { SearchDropdown } from "@components/search/SearchDropdown";
import type { SearchResult } from "@renderer/types/shared";
import { search } from "@features/search";
import type { SessionState } from "@features/auth";
import { BrandMark } from "./BrandMark";

const BootstrapInput = styled(InputBase)({
  "& .MuiInputAdornment-positionStart": {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1
  },
  "& .MuiInputAdornment-positionEnd": {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1
  },
  "&.Mui-focused .MuiInputAdornment-root": {
    color: "rgba(255,255,255,.72)"
  },
  "& .MuiInputBase-input": {
    borderRadius: "999px",
    position: "relative",
    background: "var(--frosted-glass-surface)",
    backdropFilter: "blur(26px)",
    border: "1px solid",
    borderColor: "rgba(255,255,255,.08)",
    boxShadow: "0 0 0 .5px #ffffff0d, inset 0 0 0 1px #ffffff0a",
    color: "rgba(255,255,255,.86)",
    fontSize: "14px",
    fontWeight: 700,
    height: 44,
    lineHeight: "44px",
    width: "auto",
    padding: "0 18px 0 46px",
    boxSizing: "border-box",
    transition:
      "border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, backdrop-filter 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 220ms ease",
    "&::placeholder": {
      color: "rgba(255,255,255,.62)",
      opacity: 1
    },
    "&:focus": {
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px rgba(0,0,0,.18)",
      borderColor: "rgba(255,255,255,.12)",
      backdropFilter: "blur(18px) saturate(130%)",
      color: "rgba(255,255,255,.9)",
      width: "400px",
      maxWidth: "50vw"
    }
  }
});

interface TopNavBarProps {
  drawerWidth: number;
  isMenuOpen: boolean;
  isHome: boolean;
  isSearchRoute: boolean;
  initialSearchQuery: string;
  isContentScrolled: boolean;
  anchorEl: HTMLElement | null;
  session: SessionState;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onAdminClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onBackClick: () => void;
  onSearch: (query: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  drawerWidth,
  isMenuOpen,
  isHome,
  isSearchRoute,
  initialSearchQuery,
  isContentScrolled,
  anchorEl,
  session,
  onMenuOpen,
  onMenuClose,
  onAdminClick,
  onLoginClick,
  onLogoutClick,
  onBackClick,
  onSearch
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const mobileSearchOnly = isMobile && isSearchRoute;
  const [searchInput, setSearchInput] = useState(initialSearchQuery);
  const [previewResult, setPreviewResult] = useState<SearchResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    setSearchInput(initialSearchQuery);
    setIsDropdownOpen(false);
  }, [initialSearchQuery]);

  const debouncedPreviewRef = useRef<Debouncer<(query: string) => void>>(
    null as unknown as Debouncer<(query: string) => void>
  );

  if (!debouncedPreviewRef.current) {
    debouncedPreviewRef.current = new Debouncer(
      (query: string) => {
        if (!query) {
          setPreviewResult(null);
          setIsDropdownOpen(false);
          return;
        }
        setPreviewLoading(true);
        setIsDropdownOpen(true);
        search(query).then((data) => {
          setPreviewResult(data);
          setPreviewLoading(false);
        });
      },
      { wait: 300 }
    );
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      closeDropdown();
      onSearchRef.current(searchInput.trim());
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (mobileSearchOnly) {
      setIsDropdownOpen(false);
      setPreviewResult(null);
      return;
    }
    debouncedPreviewRef.current.maybeExecute(value);
  };

  const handleSearchBlur = () => {
    closeDropdown();
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 1200,
          height: 64,
          borderBottom: isContentScrolled
            ? "1px solid rgba(255,255,255,.055)"
            : "1px solid transparent",
          background: isContentScrolled
            ? "linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,.34))"
            : "transparent",
          backdropFilter: isContentScrolled ? "blur(18px)" : "none",
          width: {
            xs: "100%",
            sm: `calc(100% - ${drawerWidth}px)`
          },
          transition:
            "width 220ms ease, background 180ms ease, border-color 180ms ease, backdrop-filter 180ms ease"
        }}
      >
        <Grid
          container
          sx={{
            height: 64,
            alignItems: "center",
            padding: { xs: "0 16px", sm: "0 24px 0 20px" }
          }}
        >
          {!mobileSearchOnly && (
            <Grid item xs>
              {isHome ? (
                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                  <BrandMark size={7} />
                </Box>
              ) : (
                <IconButton
                  aria-label="Back"
                  size="small"
                  sx={{
                    fontSize: "14px",
                    "&:hover": {
                      backgroundColor: "#fcfcfc29"
                    },
                    backgroundColor: "rgba(255,255,255,.12)",
                    width: 36,
                    height: 36
                  }}
                  onClick={onBackClick}
                >
                  <ArrowBackIosNewIcon fontSize="inherit" />
                </IconButton>
              )}
            </Grid>
          )}
          <Grid
            item
            xs={mobileSearchOnly ? 12 : "auto"}
            sx={{ display: { xs: mobileSearchOnly ? "block" : "none", sm: "unset" } }}
          >
            <Box ref={containerRef} sx={{ position: "relative" }}>
              <BootstrapInput
                size="small"
                placeholder="Search"
                value={searchInput}
                sx={
                  mobileSearchOnly
                    ? {
                        "--frosted-glass-surface": theme.design.color.frostedGlassSurface,
                        width: "100%",
                        "& .MuiInputBase-input": {
                          width: "100% !important",
                          maxWidth: "none !important",
                          boxSizing: "border-box"
                        }
                      }
                    : {
                        "--frosted-glass-surface": theme.design.color.frostedGlassSurface
                      }
                }
                onChange={(e) => handleSearchChange(e.target.value)}
                onBlur={handleSearchBlur}
                onKeyDown={handleKeyDown}
                startAdornment={
                  <InputAdornment position="start" sx={{ fontSize: "16px" }}>
                    <SearchIcon fontSize="inherit" />
                  </InputAdornment>
                }
              />
              <SearchDropdown
                query={searchInput}
                result={previewResult}
                loading={previewLoading}
                open={!mobileSearchOnly && isDropdownOpen}
                onClose={closeDropdown}
                onNavigate={(q) => onSearchRef.current(q)}
              />
            </Box>
          </Grid>
          <Grid
            item
            xs="auto"
            sx={{
              marginLeft: 2,
              display: { xs: mobileSearchOnly ? "none" : "block", sm: "block" }
            }}
          >
            <IconButton aria-label="User menu" onClick={onMenuOpen} size="small">
              <PersonIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
      <ResponsiveActionMenu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={onMenuClose}
        ariaLabel="User menu"
        desktopPaperSx={{ width: 360, maxWidth: "calc(100vw - 32px)" }}
        items={[
          ...(session.canAccessAdmin
            ? [
                {
                  label: "Admin",
                  onClick: onAdminClick
                }
              ]
            : []),
          session.user
            ? {
                label: "Log out",
                color: "error" as const,
                onClick: onLogoutClick
              }
            : {
                label: "Login",
                onClick: onLoginClick
              }
        ]}
      />
    </>
  );
};
