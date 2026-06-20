import { Box, Typography } from "@mui/material";
import React from "react";
import { router } from "@app/router";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView } from "../store/playerGuiSlice";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { isVideo } from "@features/library";
import { ArtistLinks } from "@components/media/ArtistLinks";

interface AlbumImageProps extends React.PropsWithChildren {
  hideArtworkBelow?: "narrow" | "responsiveMedia" | "sm" | "md";
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
            : hideArtworkBelow === "sm"
              ? { display: { xs: "none", sm: "flex" } }
              : hideArtworkBelow === "responsiveMedia"
                ? {
                    display: "flex",
                    "@media (max-width: 339.95px)": { display: "none" },
                    "@media (min-width: 600px) and (max-width: 1000px)": { display: "none" }
                  }
                : {
                    display: "flex",
                    "@media (max-width: 339.95px)": { display: "none" }
                  }),
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
        >
          {currentChapter
            ? [currentChapter.title, currentChapter.subTitle].filter((t) => t).join(" - ")
            : playingTrack?.title}
        </Typography>
        <ArtistLinks
          artists={playingTrack?.artist}
          color="text.secondary"
          fontSize={13}
          fontWeight={500}
          onNavigate={() => dispatch(hideView("mobilePlayer"))}
          sx={{
            lineHeight: "20px",
            maxWidth: "100%",
            p: 0
          }}
        />
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
              if (isVideo(playingTrack)) router.navigate(`/video/${playingTrack._id}`);
              else if (playingTrack?.album?._id)
                router.navigate(`/album/${playingTrack.album._id}`);
            }}
          >
            {isVideo(playingTrack) ? "Videos" : playingTrack?.album?.title}
          </Typography>
        </Typography>
      </Box>
    </>
  );
};
