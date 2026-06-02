import { Box, Typography } from "@mui/material";
import React from "react";
import { router } from "../../router";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { hideView } from "../../store/player/playerGuiSlice";
import { artistPath, getPrimaryArtist } from "../../utils/artist";

export const AlbumImage: React.FC<React.PropsWithChildren> = ({ children }) => {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );
  return (
    <>
      {children}
      <Box
        sx={{
          ml: 1.5,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}
      >
        <Typography
          component="span"
          noWrap
          color="text.primary"
          textOverflow={"ellipsis"}
          maxWidth={"100%"}
          fontSize={14}
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
          fontSize={12}
          textOverflow={"ellipsis"}
          color="text.secondary"
          width={"auto"}
          fontWeight={500}
          padding={"0 0 3px 0"}
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
          fontSize={9}
          letterSpacing={"1.2px"}
          color="text.secondary"
          textOverflow={"ellipsis"}
          fontWeight={600}
          textTransform={"uppercase"}
          maxWidth={"100%"}
          sx={{
            display: {
              xs: "none",
              sm: "block"
            }
          }}
        >
          {"Playing from: "}
          <Typography
            component={"span"}
            noWrap
            fontSize={9}
            letterSpacing={"1.2px"}
            color="text.secondary"
            textOverflow={"ellipsis"}
            fontWeight={600}
            textTransform={"uppercase"}
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
            {playingTrack?.album?.title}
          </Typography>
        </Typography>
      </Box>
    </>
  );
};
