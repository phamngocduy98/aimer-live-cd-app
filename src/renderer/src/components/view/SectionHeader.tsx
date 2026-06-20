import React from "react";
import { Box, Button, SxProps, Theme, Typography } from "@mui/material";

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  action?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  icon,
  action,
  onAction,
  actions,
  sx
}) => (
  <Box
    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, ...sx }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon && <Box sx={{ display: "flex", color: "#fff" }}>{icon}</Box>}
      <Typography component="h2" sx={(theme) => theme.design.typography.sectionTitle}>
        {title}
      </Typography>
      {count != null && (
        <Typography variant="body2" color="text.secondary">
          {count}
        </Typography>
      )}
    </Box>
    {actions}
    {!actions && action && (
      <Button
        onClick={onAction}
        sx={{
          color: "#d0d0d0",
          fontWeight: 600,
          minWidth: 0,
          px: 1,
          mr: -1,
          "&:hover": { color: "#fff" }
        }}
      >
        {action}
      </Button>
    )}
  </Box>
);
