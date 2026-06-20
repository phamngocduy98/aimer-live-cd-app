import LanguageIcon from "@mui/icons-material/Language";
import { IconButton } from "@mui/material";
import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { setLyricPair } from "@features/player/store/playerGuiSlice";
import { lyricPairs } from "../types";

export function LyricsLanguageButton({ size = 40 }: { size?: 40 | 50 }) {
  const dispatch = useAppDispatch();
  const pairId = useAppSelector((state) => state.playerGui.lyricPair);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(menuAnchor);

  const closeMenu = (): void => setMenuAnchor(null);
  const selectPair = (id: typeof pairId): void => {
    dispatch(setLyricPair(id));
    closeMenu();
  };

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
      <ResponsiveActionMenu
        open={open}
        onClose={closeMenu}
        anchorEl={menuAnchor}
        ariaLabel="Lyrics language"
        items={lyricPairs.map((item) => ({
          label: item.label,
          selected: item.id === pairId,
          onClick: () => selectPair(item.id)
        }))}
        zIndex={1700}
        mobileContentSx={{ p: 1.5 }}
      />
    </>
  );
}
