import { Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { toggleView } from "../store/playerGuiSlice";
import { MPlayerUI } from "./MPlayerUI";
import { MobilePlayer } from "./MobilePlayerUI";
import { FloatingQueueList } from "./FloatingQueueList";
import { ExpandedMobileControls } from "./ExpandedMobileControls";
import { MobileNavigation } from "@components/layout/MobileNavigation";
import { isVideo } from "@features/library";
import React from "react";

export function Player() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const dispatch = useAppDispatch();
  const desktopVideoOpen = showMobilePlayer && isVideo(playingTrack);
  const [desktopChromeVisible, setDesktopChromeVisible] = React.useState(true);

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

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: showMobilePlayer ? 16 : 8, sm: 10 },
          left: { xs: 8, sm: 10 },
          right: { xs: 8, sm: 10 },
          zIndex: showMobilePlayer ? 1301 : 1202,
          userSelect: "none",
          overflow: showMobilePlayer ? "visible" : "hidden",
          borderRadius: { xs: showMobilePlayer ? "26px" : "30px", sm: "24px" },
          border: {
            xs: showMobilePlayer ? "none" : "1px solid rgba(255,255,255,.13)",
            sm: "1px solid rgba(255,255,255,.13)"
          },
          background: {
            xs: showMobilePlayer
              ? "transparent"
              : "linear-gradient(135deg, rgba(34,34,34,.78) 0%, rgba(12,12,12,.66) 58%, rgba(28,28,28,.72) 100%)",
            sm: "linear-gradient(135deg, rgba(34,34,34,.78) 0%, rgba(12,12,12,.66) 58%, rgba(28,28,28,.72) 100%)"
          },
          backdropFilter: { xs: showMobilePlayer ? "none" : "blur(28px)", sm: "blur(28px)" },
          WebkitBackdropFilter: {
            xs: showMobilePlayer ? "none" : "blur(28px)",
            sm: "blur(28px)"
          },
          boxShadow: {
            xs: showMobilePlayer
              ? "none"
              : "0 18px 55px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)",
            sm: "0 18px 55px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)"
          },
          opacity: {
            xs: 1,
            md: desktopVideoOpen && !desktopChromeVisible ? 0 : 1
          },
          transform: {
            xs: "none",
            md: desktopVideoOpen && !desktopChromeVisible ? "translateY(18px)" : "translateY(0)"
          },
          pointerEvents: {
            md: desktopVideoOpen && !desktopChromeVisible ? "none" : "auto"
          },
          transition:
            "opacity 220ms ease, transform 220ms ease, background 220ms ease, width 220ms ease"
        }}
      >
        <Box sx={{ display: { xs: showMobilePlayer ? "none" : "block", sm: "block" } }}>
          <MPlayerUI />
        </Box>
        {showMobilePlayer && (
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <ExpandedMobileControls />
          </Box>
        )}
        {!showMobilePlayer && (
          <Box
            component="button"
            type="button"
            aria-label="Expand player"
            onClick={() => dispatch(toggleView("mobilePlayer"))}
            sx={{
              display: { xs: "block", sm: "none" },
              position: "absolute",
              zIndex: 1,
              top: 0,
              left: 0,
              width: "calc(100% - 116px)",
              height: 82,
              p: 0,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer"
            }}
          />
        )}
        {!showMobilePlayer && (
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
          transform: `translateY(${showMobilePlayer ? "0" : "100dvh"})`,
          transition: "transform .6s ease"
        }}
      >
        <MobilePlayer desktopChromeVisible={desktopChromeVisible} />
      </div>

      <FloatingQueueList />
    </>
  );
}
