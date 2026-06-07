import { Box } from "@mui/material";

interface BrandMarkProps {
  size?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 7 }) => {
  const gap = Math.max(2, Math.round(size * 0.28));
  const offset = -gap;
  return (
    <Box
      aria-label="Aimer live"
      sx={{ display: "grid", gridTemplateColumns: `repeat(3, ${size}px)`, gap: `${gap}px` }}
    >
      {[
        [1, 2],
        [2, 1],
        [2, 3]
      ].map(([row, col], index) => (
        <Box
          key={index}
          sx={{
            width: size,
            height: size,
            bgcolor: "#fff",
            transform: "rotate(45deg)",
            gridColumn: col,
            mt: row == 2 ? `${offset}px` : 0
          }}
        />
      ))}
    </Box>
  );
};
