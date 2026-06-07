import { Box, Typography } from "@mui/material";
import React from "react";
import { router } from "@app/router";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView } from "../store/playerGuiSlice";
import { artistPath, getPrimaryArtist } from "@utils/artist";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

interface AlbumImageProps extends React.PropsWithChildren {
  hideArtworkBelow?: "sm" | "md";
}

export const AlbumImage: React.FC<AlbumImageProps> = ({ children, hideArtworkBelow = "sm" }) => {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );
  return (
    <>
      <Box
        data-player-artwork
        sx={{
          position: "relative",
          flexShrink: 0,
          maxWidth: showMobilePlayer ? 0 : 112,
          opacity: showMobilePlayer ? 0 : 1,
          transform: showMobilePlayer ? "scale(.78) translateY(10px)" : "scale(1)",
          overflow: "hidden",
          transition: showMobilePlayer
            ? "max-width 170ms ease, opacity 110ms ease, transform 170ms ease"
            : "max-width 190ms ease, opacity 150ms 40ms ease, transform 190ms ease",
          ...(hideArtworkBelow === "md"
            ? { display: { xs: "none", md: "flex" } }
            : { display: { xs: "none", sm: "flex" } }),
          "&:hover .album-expand-icon": {
            opacity: 1,
            transform: "translate(-50%, -50%) scale(1)"
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,.28)",
            opacity: 0,
            transition: "opacity 130ms ease"
          },
          "&:hover::after": { opacity: 1 }
        }}
      >
        {children}
        <FullscreenIcon
          className="album-expand-icon"
          sx={{
            position: "absolute",
            zIndex: 1,
            top: "50%",
            left: "50%",
            color: "#fff",
            opacity: 0,
            transform: "translate(-50%, -50%) scale(.72)",
            transition: "opacity 130ms ease, transform 130ms ease",
            pointerEvents: "none"
          }}
        />
      </Box>
      <Box
        data-player-track-info
        sx={{
          ml: showMobilePlayer ? 0 : { xs: 1.25, sm: 1.5 },
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          transition: "margin-left 170ms ease"
        }}
      >
        <Typography
          component="span"
          noWrap
          color="text.primary"
          textOverflow={"ellipsis"}
          maxWidth={"100%"}
          fontSize={{ xs: 14, sm: 15 }}
          lineHeight="21px"
          fontWeight={700}
          padding={0}
          sx={{
            "&:hover": {
              textDecoration: "underline",
              cursor: "pointer"
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(hideView("mobilePlayer"));
            router.navigate(`/album/${playingTrack?.album?._id}`);
          }}
        >
          {currentChapter
            ? [currentChapter.title, currentChapter.subTitle].filter((t) => t).join(" - ")
            : playingTrack?.title}
        </Typography>
        <Typography
          component="span"
          noWrap
          fontSize={13}
          lineHeight="20px"
          textOverflow={"ellipsis"}
          color="text.secondary"
          maxWidth={"100%"}
          fontWeight={500}
          padding={0}
          sx={{
            "&:hover": {
              textDecoration: "underline",
              cursor: "pointer"
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(hideView("mobilePlayer"));
            router.navigate(artistPath(getPrimaryArtist(playingTrack?.artist)));
          }}
        >
          {playingTrack?.artist.join(", ")}
        </Typography>
        <Typography
          component="span"
          noWrap
          fontSize={12}
          lineHeight="18px"
          color="text.secondary"
          textOverflow={"ellipsis"}
          fontWeight={500}
          maxWidth={"100%"}
          sx={{
            display: {
              xs: "none",
              sm: "block"
            }
          }}
        >
          <Typography
            component={"span"}
            noWrap
            fontSize="inherit"
            lineHeight="inherit"
            color="text.secondary"
            textOverflow={"ellipsis"}
            fontWeight={500}
            sx={{
              "&:hover": {
                textDecoration: "underline",
                cursor: "pointer"
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(hideView("mobilePlayer"));
              router.navigate(`/album/${playingTrack?.album?._id}`);
            }}
          >
            {playingTrack?.type === "video" ? "Videos" : playingTrack?.album?.title}
          </Typography>
        </Typography>
      </Box>
    </>
  );
};
