import { useState, useRef, useEffect } from "react";
import { Debouncer } from "@tanstack/pacer";
import { Box, Grid, IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import styled from "@emotion/styled";
import { InputAdornment, InputBase, ThemeProvider, createTheme } from "@mui/material";
import { SearchDropdown } from "./SearchDropdown";
import { appAPI, SearchResult } from "../core/api";

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

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
    borderRadius: "12px",
    position: "relative",
    backgroundColor: "#242429cc",
    border: "1px solid",
    borderColor: "#ffffff1a",
    fontSize: "14px",
    width: "auto",
    padding: "10px 12px 10px 38px",
    transition:
      "border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    "&:focus": {
      boxShadow: "rgba(25, 118, 210, 0.25) 0 0 0 0.2rem",
      borderColor: "#1976d2",
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
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onManageHostsClick: () => void;
  onBackClick: () => void;
  onSearch: (query: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  drawerWidth,
  isMenuOpen,
  isHome,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  onManageHostsClick,
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
        appAPI.search(query).then((data) => {
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
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 1200,
          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`
          }
        }}
      >
        <Grid
          container
          sx={{
            padding: "16px 32px 0 24px"
          }}
        >
          <Grid item xs>
            {!isHome && (
              <IconButton
                size="large"
                sx={{
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#fcfcfc29"
                  },
                  backgroundColor: "#fcfcfc29"
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
          <Grid item xs="auto" sx={{ marginLeft: 2, display: { xs: "none", sm: "unset" } }}>
            <IconButton onClick={onMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "14px" }}>
                U
              </Avatar>
            </IconButton>
          </Grid>
        </Grid>
      </Box>
      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={onMenuClose}>
        <MenuItem
          onClick={() => {
            onMenuClose();
            onManageHostsClick();
          }}
        >
          Manage Hosts
        </MenuItem>
      </Menu>
    </ThemeProvider>
  );
};
