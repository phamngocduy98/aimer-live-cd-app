import React from "react";
import { Box, Button, SxProps, Theme, Typography } from "@mui/material";

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  action?: string;
  onAction?: () => void;
  sx?: SxProps<Theme>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  icon,
  action,
  onAction,
  sx
}) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, ...sx }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon && <Box sx={{ display: "flex", color: "#fff" }}>{icon}</Box>}
      <Typography component="h2" fontSize={24} fontWeight={800}>
        {title}
      </Typography>
      {count != null && (
        <Typography variant="body2" color="text.secondary">
          {count}
        </Typography>
      )}
    </Box>
    {action && (
      <Button onClick={onAction} sx={{ color: "#a7a7a7", fontWeight: 700 }}>
        {action}
      </Button>
    )}
  </Box>
);
