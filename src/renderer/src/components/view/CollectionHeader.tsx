import React, { useState } from "react";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { Box, IconButton, InputAdornment, TextField, Typography } from "@mui/material";

export interface CollectionHeaderAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface CollectionHeaderProps {
  title: string;
  filterLabel: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  actions?: CollectionHeaderAction[];
}

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  title,
  filterLabel,
  filterValue,
  onFilterChange,
  actions = []
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Box
      component="header"
      sx={{
        width: "100%",
        maxWidth: (theme) => theme.design.layout.collectionWidth,
        mx: "auto",
        px: (theme) => theme.design.layout.gutters,
        pt: { xs: 4, sm: 5 },
        pb: { xs: 4, sm: 5 }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 34, sm: 40 },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-.04em"
          }}
        >
          {title}
        </Typography>
        <IconButton
          aria-label={`${title} actions`}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ color: "#929292", mt: 0.25 }}
        >
          <MoreHorizRoundedIcon />
        </IconButton>
      </Box>

      <TextField
        fullWidth
        value={filterValue}
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder={filterLabel}
        inputProps={{ "aria-label": filterLabel }}
        sx={{
          mt: { xs: 3, sm: 4 },
          "& .MuiOutlinedInput-root": {
            height: 58,
            borderRadius: 1.5,
            bgcolor: "rgba(0,0,0,.42)",
            fontSize: 16,
            "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,.24)" },
            "&.Mui-focused fieldset": { borderColor: "#6e6e6e", borderWidth: 1 }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: "#f1f1f1" }} />
            </InputAdornment>
          )
        }}
      />

      <ResponsiveActionMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        ariaLabel={`${title} actions`}
        items={actions.map((action) => ({
          label: action.label,
          disabled: action.disabled,
          onClick: action.onClick
        }))}
      />
    </Box>
  );
};
