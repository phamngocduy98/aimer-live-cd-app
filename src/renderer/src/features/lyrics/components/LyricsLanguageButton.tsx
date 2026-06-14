import LanguageIcon from "@mui/icons-material/Language";
import { IconButton, Menu, MenuItem } from "@mui/material";
import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { setLyricPair } from "@features/player/store/playerGuiSlice";
import { lyricPairs } from "../types";

export function LyricsLanguageButton({ size = 40 }: { size?: 40 | 50 }) {
  const dispatch = useAppDispatch();
  const pairId = useAppSelector((state) => state.playerGui.lyricPair);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        aria-label="Lyrics language"
        onClick={(event) => {
          event.stopPropagation();
          setMenuAnchor(event.currentTarget);
        }}
        sx={{
          width: size,
          height: size,
          color: "#fff",
          bgcolor: "rgba(255,255,255,.12)",
          "&:hover": { bgcolor: "rgba(255,255,255,.16)" },
          "& .MuiSvgIcon-root": { fontSize: size === 50 ? 22 : 20 }
        }}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{ zIndex: 1400 }}
      >
        {lyricPairs.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === pairId}
            onClick={() => {
              dispatch(setLyricPair(item.id));
              setMenuAnchor(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
