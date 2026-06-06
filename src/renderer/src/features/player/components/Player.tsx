import { Box } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@app/hooks"
import { toggleView } from "../store/playerGuiSlice"
import { MPlayerUI } from "./MPlayerUI"
import { MobilePlayer } from "./MobilePlayerUI"
import { FloatingQueueList } from "./FloatingQueueList"

export function Player() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer)
  const dispatch = useAppDispatch()

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: showMobilePlayer ? "80px" : 0, sm: 0 },
          left: 0,
          right: 0,
          zIndex: 1202,
          userSelect: "none"
        }}
        onClick={() => dispatch(toggleView("mobilePlayer"))}
      >
        <MPlayerUI />
      </Box>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          transform: `translateY(${showMobilePlayer ? "0" : "100dvh"})`,
          transition: "transform .6s ease"
        }}
      >
        <MobilePlayer />
      </div>

      <FloatingQueueList />
    </>
  )
}
