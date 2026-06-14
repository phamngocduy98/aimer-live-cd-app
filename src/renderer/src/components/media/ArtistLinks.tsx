import React from "react";
import { Typography, type SxProps, type Theme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { artistPath } from "@utils/artist";

interface ArtistLinksProps {
  artists?: string[] | string | null;
  color?: string;
  fontSize?: number | string;
  fontWeight?: number;
  onNavigate?: () => void;
  sx?: SxProps<Theme>;
}

export const ArtistLinks: React.FC<ArtistLinksProps> = ({
  artists,
  color = "#a0a0a0",
  fontSize = 14,
  fontWeight,
  onNavigate,
  sx
}) => {
  const navigate = useNavigate();
  const names = (Array.isArray(artists) ? artists : [artists]).filter((artist): artist is string =>
    Boolean(artist)
  );

  if (names.length === 0) names.push("Unknown");

  return (
    <Typography
      component="span"
      noWrap
      textOverflow="ellipsis"
      color={color}
      fontSize={fontSize}
      fontWeight={fontWeight}
      sx={[{ display: "block" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {names.map((artist, index) => (
        <React.Fragment key={`${artist}-${index}`}>
          {index > 0 && ", "}
          <Typography
            component="span"
            color="inherit"
            fontSize="inherit"
            fontWeight="inherit"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate?.();
              navigate(artistPath(artist));
            }}
            sx={{
              "&:hover": {
                color: "#fff",
                cursor: "pointer",
                textDecoration: "underline"
              }
            }}
          >
            {artist}
          </Typography>
        </React.Fragment>
      ))}
    </Typography>
  );
};
