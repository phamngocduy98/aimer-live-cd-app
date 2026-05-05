import { Box, Grid, IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import styled from "@emotion/styled";
import { InputAdornment, InputBase, ThemeProvider, createTheme } from "@mui/material";

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
    transition: "border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
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
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onManageHostsClick: () => void;
  onBackClick: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  drawerWidth,
  isMenuOpen,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  onManageHostsClick,
  onBackClick
}) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
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
              onClick={onBackClick}
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
            />
          </Grid>
          <Grid xs="auto" sx={{ marginLeft: 2, display: { xs: "none", sm: "unset" } }}>
            <IconButton
              onClick={onMenuOpen}
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
        onClose={onMenuClose}
      >
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
