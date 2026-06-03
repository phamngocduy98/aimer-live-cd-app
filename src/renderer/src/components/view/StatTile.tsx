import React from "react";
import { Box, Grid, Typography } from "@mui/material";

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

export const StatTile: React.FC<StatTileProps> = ({ icon, label, value }) => (
  <Grid item xs={12} sm={4}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "rgba(255,255,255,.075)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 1,
        px: 2,
        py: 1.5
      }}
    >
      <Box sx={{ display: "flex", color: "#fff" }}>{icon}</Box>
      <Box>
        <Typography fontSize={20} fontWeight={800} lineHeight={1}>
          {value}
        </Typography>
        <Typography color="#a7a7a7" fontSize={12} fontWeight={700} textTransform="uppercase">
          {label}
        </Typography>
      </Box>
    </Box>
  </Grid>
);
