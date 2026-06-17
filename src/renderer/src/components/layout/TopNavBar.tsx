import { useState, useRef, useEffect } from "react";
import { Debouncer } from "@tanstack/pacer";
import { Box, Grid, IconButton, Menu, MenuItem } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import styled from "@emotion/styled";
import { InputAdornment, InputBase } from "@mui/material";
import { SearchDropdown } from "@components/search/SearchDropdown";
import type { SearchResult } from "@renderer/types/shared";
import { search } from "@features/search";
import type { SessionState } from "@features/auth";
import { BrandMark } from "./BrandMark";

const BootstrapInput = styled(InputBase)({
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
    borderRadius: "999px",
    position: "relative",
    backgroundColor: "rgba(32,32,32,.82)",
    border: "1px solid",
    borderColor: "#ffffff1a",
    fontSize: "14px",
    width: "auto",
    padding: "10px 12px 10px 38px",
    transition:
      "border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    "&:focus": {
      boxShadow: "rgba(38,231,223,.18) 0 0 0 0.2rem",
      borderColor: "#26e7df",
      backgroundColor: "white",
      color: "black",
      width: "400px",
      maxWidth: "50vw"
    }
  }
});

interface TopNavBarProps {
  drawerWidth: number;
  isMenuOpen: boolean;
  isHome: boolean;
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
  const [searchInput, setSearchInput] = useState("");
  const [previewResult, setPreviewResult] = useState<SearchResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

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
      onSearchRef.current(searchInput);
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedPreviewRef.current.maybeExecute(value);
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
          borderBottom: "1px solid rgba(255,255,255,.055)",
          background: "linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,.34))",
          backdropFilter: "blur(18px)",
          width: {
            xs: "100%",
            sm: `calc(100% - ${drawerWidth}px)`
          },
          transition: "width 220ms ease"
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
          <Grid item xs="auto" sx={{ display: { xs: "none", sm: "unset" } }}>
            <Box ref={containerRef} sx={{ position: "relative" }}>
              <BootstrapInput
                size="small"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                open={isDropdownOpen}
                onClose={closeDropdown}
                onNavigate={(q) => onSearchRef.current(q)}
              />
            </Box>
          </Grid>
          <Grid item xs="auto" sx={{ marginLeft: 2 }}>
            <IconButton aria-label="User menu" onClick={onMenuOpen} size="small">
              <PersonIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={onMenuClose}>
        {session.canAccessAdmin && (
          <MenuItem
            onClick={() => {
              onMenuClose();
              onAdminClick();
            }}
          >
            Admin
          </MenuItem>
        )}
        {session.user ? (
          <MenuItem
            onClick={() => {
              onMenuClose();
              onLogoutClick();
            }}
          >
            Logout {session.user.displayName}
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              onMenuClose();
              onLoginClick();
            }}
          >
            Login
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
