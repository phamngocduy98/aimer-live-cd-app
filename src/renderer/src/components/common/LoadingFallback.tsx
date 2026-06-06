import { Box, CircularProgress } from "@mui/material"

export const LoadingFallback = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
    <CircularProgress />
  </Box>
)
