import { Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { MPlayerUI } from "./MPlayerUI";
import { ExpandedPlayer } from "./ExpandedPlayerUI";
import { FloatingQueueList } from "./FloatingQueueList";
import { ExpandedMobileControls } from "./ExpandedMobileControls";
import { MobileNavigation } from "@components/layout/MobileNavigation";
import { isVideo } from "@features/library";
import React from "react";
import { hideView } from "../store/playerGuiSlice";
import { PlaybackEngine } from "./PlaybackEngine";
import { useAlbumBackgroundColor } from "../utils/albumBackground";

const compactPlayerBackground =
  "linear-gradient(#3c3c3c59 0% 27%,#3d3d3d59 35%,#3e3e3e59 43.5%,#3f3f3f59 53%,#41414159 66%,#43434359 81%,#46464659 100%)";

export function Player() {
  const dispatch = useAppDispatch();
  const expandedPlayerOpen = useAppSelector((state) => state.playerGui.expandedPlayer);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const desktopVideoOpen = expandedPlayerOpen && isVideo(playingTrack);
  const albumBackgroundColor = useAlbumBackgroundColor(playingTrack);
  const [desktopChromeVisible, setDesktopChromeVisible] = React.useState(true);

  React.useEffect(() => {
    if (!playingTrack) {
      dispatch(hideView("expandedPlayer"));
      dispatch(hideView("lyrics"));
    }
  }, [dispatch, playingTrack]);

  React.useEffect(() => {
    if (!desktopVideoOpen) {
      setDesktopChromeVisible(true);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const reveal = () => {
      setDesktopChromeVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setDesktopChromeVisible(false), 2200);
    };

    reveal();
    window.addEventListener("mousemove", reveal);
    window.addEventListener("keydown", reveal);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, [desktopVideoOpen]);

  if (!playingTrack) {
    return (
      <Box
        sx={{
          display: { xs: "block", sm: "none" },
          position: "fixed",
          bottom: 8,
          left: 8,
          right: 8,
          padding: 1,
          zIndex: 1202,
          userSelect: "none",
          borderRadius: "30px",
          border: "1px solid rgba(255,255,255,.13)",
          background: "#00000040",
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
          boxShadow: "inset 0 0 0 .5px #ffffff14"
        }}
      >
        <MobileNavigation />
      </Box>
    );
  }

  return (
    <>
      {desktopVideoOpen && (
        <Box
          data-testid="expanded-video-backdrop"
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1299,
            bgcolor: albumBackgroundColor
          }}
        />
      )}
      <PlaybackEngine />
      <Box
        data-testid="player-control-shell"
        sx={{
          position: "fixed",
          bottom: { xs: expandedPlayerOpen ? 16 : 8, sm: 10 },
          left: { xs: 8, sm: 10 },
          right: { xs: 8, sm: 10 },
          zIndex: expandedPlayerOpen ? 1301 : 1202,
          padding: expandedPlayerOpen ? { xs: 0, sm: "16px" } : "16px",
          userSelect: "none",
          overflow: "visible",
          display: "grid",
          gap: 2,
          borderRadius: { xs: expandedPlayerOpen ? "26px" : "30px", sm: "24px" },
          border: {
            xs: expandedPlayerOpen ? "none" : "1px solid rgba(255,255,255,.13)"
          },
          background: {
            sm: expandedPlayerOpen ? "#00000040" : compactPlayerBackground,
            xs: expandedPlayerOpen ? "transparent" : compactPlayerBackground
          },
          backdropFilter: { xs: expandedPlayerOpen ? "none" : "blur(26px)", sm: "blur(26px)" },
          WebkitBackdropFilter: {
            xs: expandedPlayerOpen ? "none" : "blur(26px)",
            sm: "blur(26px)"
          },
          boxShadow: {
            xs: expandedPlayerOpen ? "none" : "inset 0 0 0 .5px #ffffff14",
            sm: "inset 0 0 0 .5px #ffffff14"
          },
          opacity: {
            xs: 1,
            sm: desktopVideoOpen && !desktopChromeVisible ? 0 : 1
          },
          transform: {
            xs: "none",
            sm: desktopVideoOpen && !desktopChromeVisible ? "translateY(18px)" : "translateY(0)"
          },
          pointerEvents: {
            sm: desktopVideoOpen && !desktopChromeVisible ? "none" : "auto"
          },
          transition:
            "opacity 220ms ease, transform 220ms ease, background 220ms ease, width 220ms ease"
        }}
      >
        <Box
          sx={{
            display: { xs: expandedPlayerOpen ? "none" : "block", sm: "block" },
            overflow: "hidden"
          }}
        >
          <MPlayerUI />
        </Box>
        {expandedPlayerOpen && (
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <ExpandedMobileControls />
          </Box>
        )}
        {!expandedPlayerOpen && (
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <MobileNavigation />
          </Box>
        )}
      </Box>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          visibility: expandedPlayerOpen ? "visible" : "hidden",
          opacity: expandedPlayerOpen ? 1 : 0,
          transform: `translate3d(0, ${expandedPlayerOpen ? "0" : "100%"}, 0)`,
          transition: expandedPlayerOpen
            ? "transform 240ms cubic-bezier(.22, 1, .36, 1), opacity 150ms ease, visibility 0s"
            : "transform 170ms cubic-bezier(.4, 0, 1, 1), opacity 120ms ease, visibility 0s 170ms",
          pointerEvents: expandedPlayerOpen ? "auto" : "none",
          willChange: expandedPlayerOpen ? "transform" : "auto"
        }}
      >
        <ExpandedPlayer desktopChromeVisible={desktopChromeVisible} />
      </div>

      <FloatingQueueList />
    </>
  );
}
