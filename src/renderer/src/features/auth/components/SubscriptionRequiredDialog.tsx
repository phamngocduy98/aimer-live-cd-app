import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { clearSubscriptionPromptMedia, hideSubscriptionPrompt } from "../store/authSlice";
import { isVideo } from "@features/library/types";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import { useMediaBackgroundColor } from "@utils/mediaBackground";

const MobileSlideTransition = React.forwardRef(function MobileSlideTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function SubscriptionRequiredDialog() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const open = useAppSelector((state) => state.auth.subscriptionPromptOpen);
  const promptMedia = useAppSelector((state) => state.auth.subscriptionPromptMedia);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const media = promptMedia ?? playingTrack;
  const artworkUrl = mediaArtworkUrl(media);
  const backgroundColor = useMediaBackgroundColor(media);
  const coverAlt = media ? `${media.title} cover` : "Media cover";

  const close = () => dispatch(hideSubscriptionPrompt());

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="xs"
      fullWidth
      TransitionComponent={mobile ? MobileSlideTransition : undefined}
      TransitionProps={{
        onExited: () => dispatch(clearSubscriptionPromptMedia())
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" }
        }
      }}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 4 },
          width: { xs: 1, sm: 520 },
          maxWidth: { xs: "100%", sm: 520 },
          overflow: "hidden",
          borderRadius: { xs: "28px 28px 0 0", sm: "22px" },
          border: "1px solid rgba(255,255,255,.1)",
          backgroundColor,
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,.1) 0%, rgba(18,18,20,.86) 56%, rgba(18,18,20,.98) 100%)",
          boxShadow: "0 28px 100px rgba(0,0,0,.58)",
          color: "#fff"
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,.62)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }
      }}
    >
      <IconButton
        aria-label="Close subscription dialog"
        onClick={close}
        sx={{
          position: "absolute",
          top: { xs: 18, sm: 22 },
          right: { xs: 18, sm: 22 },
          zIndex: 1,
          color: "#fff",
          backgroundColor: "transparent",
          "&:hover": { backgroundColor: "rgba(255,255,255,.12)" }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 3, sm: 4 },
          px: { xs: 3, sm: 6 },
          pt: { xs: 7.5, sm: 7.5 },
          pb: { xs: 2, sm: 2 }
        }}
      >
        {artworkUrl && (
          <Box
            component="img"
            src={artworkUrl}
            alt={coverAlt}
            sx={{
              width: { xs: "min(58vw, 220px)", sm: 220 },
              aspectRatio: media && isVideo(media) ? "16 / 9" : "1 / 1",
              display: "block",
              objectFit: "cover",
              borderRadius: "10px",
              boxShadow: "0 22px 60px rgba(0,0,0,.34)"
            }}
          />
        )}

        <Box sx={{ textAlign: "center", maxWidth: 500 }}>
          <DialogTitle
            sx={{
              p: 0,
              mb: 1.75,
              fontSize: { xs: 21, sm: 23 },
              fontWeight: 700,
              lineHeight: 1.16,
              letterSpacing: 0
            }}
          >
            Subscribe to unlock unlimited listening
          </DialogTitle>
          <Typography
            sx={{
              color: "rgba(255,255,255,.68)",
              fontSize: { xs: 14, sm: 15 },
              fontWeight: 700,
              lineHeight: 1.35,
              letterSpacing: 0
            }}
          >
            Free accounts can only play youtube videos
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          px: { xs: 3, sm: 6 },
          pt: 2,
          pb: { xs: 4.5, sm: 4.5 }
        }}
      >
        <Button
          variant="contained"
          onClick={close}
          sx={{
            minWidth: 88,
            minHeight: 46,
            px: 2.75,
            borderRadius: "999px",
            bgcolor: "#fff",
            color: "#111",
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "rgba(255,255,255,.9)", boxShadow: "none" }
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
