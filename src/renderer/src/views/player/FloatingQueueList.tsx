import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Paper,
  ListItemButton
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import CloseIcon from "@mui/icons-material/Close";
import { AppAPI } from "../../core/api";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { deleteTrack, nextTrack, prevTrack, reset } from "../../store/player/playerSlice";
import { hideView } from "../../store/player/playerGuiSlice";
import styled from "@emotion/styled";
import { isVideo, Video } from "../../core/Video";
import { videoOnSeek } from "../../store/player/playerVideoControl";
import { useMemo } from "react";

export const FloatingQueueList = () => {
  const open = useAppSelector((state) => state.playerGui.playingQueue);
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        position: "fixed",
        top: "60px",
        right: "24px",
        overflow: "hidden",
        borderRadius: 10,
        zIndex: 100000,
        transform: `translateX(${open ? 0 : 412}px)`,
        transition: "transform .6s ease"
      }}
    >
      <Paper
        sx={{
          bgcolor: "#242429",
          backgroundImage: "none",
          maxWidth: "calc(100dvw - 48px)",
          height: "calc(100vh - 160px)",
          width: 388,
          overflowY: "auto"
        }}
      >
        <ListSubheader
          component="div"
          style={{
            color: "white",
            backgroundColor: "#242429",
            paddingTop: "8px"
          }}
        >
          Play queue
        </ListSubheader>
        <QueueList />
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "20px",
            zIndex: 1200,
            display: "flex",
            columnGap: "10px"
          }}
        >
          <IconButton onClick={() => dispatch(reset({ songs: [], type: "audio" }))}>
            <ClearAllIcon />
          </IconButton>
          <IconButton onClick={() => dispatch(hideView("playingQueue"))}>
            <CloseIcon />
          </IconButton>
        </div>
      </Paper>
    </div>
  );
};

export const QueueList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playingTrack, history, queue } = useAppSelector((state) => state.player);
  const { videoPosition } = useAppSelector((state) => state.playerVideoControl);

  const playingChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );

  return (
    <Box
      sx={{
        width: "100%"
      }}
    >
      <div style={{ overflowY: "auto" }}>
        {history.length > 0 && (
          <List>
            {history.map((song, idx) => (
              <MListItemButton
                key={`history_${song._id}`}
                onClick={() => dispatch(prevTrack({ skip: history.length - idx - 1 }))}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{ borderRadius: "4px" }}
                    src={`${AppAPI.HOST}/album/${song.album?._id}/cover`}
                  >
                    <MusicNoteIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={song.title}
                  secondary={song.artist}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: 600
                  }}
                  secondaryTypographyProps={{
                    fontSize: "14px"
                  }}
                />
              </MListItemButton>
            ))}
          </List>
        )}

        {playingTrack && (
          <List
            subheader={
              <ListSubheader
                component="div"
                id="nested-list-subheader"
                style={{
                  fontSize: "10px",
                  backgroundColor: "transparent",
                  fontWeight: 600,
                  letterSpacing: "1.2px"
                }}
              >
                PLAYING
              </ListSubheader>
            }
          >
            <MListItemButton sx={{ borderRadius: "10px" }}>
              <ListItemAvatar>
                <Avatar sx={{ borderRadius: "4px" }}>
                  <VolumeUpIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={playingTrack.title}
                secondary={playingTrack.artist}
                primaryTypographyProps={{ fontSize: "14px", fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: "14px" }}
              />
            </MListItemButton>
          </List>
        )}

        {playingTrack && isVideo(playingTrack) && playingTrack.chapters != null && (
          <List
            subheader={
              <ListSubheader
                component="div"
                id="nested-list-subheader"
                style={{
                  fontSize: "10px",
                  backgroundColor: "transparent",
                  fontWeight: 600,
                  letterSpacing: "1.2px"
                }}
              >
                IN THIS VIDEO
              </ListSubheader>
            }
          >
            {playingTrack.chapters.map((chapter, idx) => (
              <ListItem key={`queue_${chapter.time}`} disablePadding>
                <MListItemButton onClick={() => dispatch(videoOnSeek({ position: chapter.time }))}>
                  {chapter !== playingChapter ? (
                    <ListItemAvatar>
                      <Avatar
                        sx={{ borderRadius: "4px" }}
                        src={`${AppAPI.HOST}/album/${playingTrack.album?._id}/cover`}
                      >
                        <MusicNoteIcon />
                      </Avatar>
                    </ListItemAvatar>
                  ) : (
                    <ListItemAvatar>
                      <Avatar sx={{ borderRadius: "4px" }}>
                        <VolumeUpIcon />
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={chapter.title}
                    secondary={chapter.subTitle}
                    primaryTypographyProps={{
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                    secondaryTypographyProps={{
                      fontSize: "14px"
                    }}
                  />
                </MListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {queue.length > 0 && (
          <List
            subheader={
              <ListSubheader
                component="div"
                id="nested-list-subheader"
                style={{
                  fontSize: "10px",
                  backgroundColor: "transparent",
                  fontWeight: 600,
                  letterSpacing: "1.2px"
                }}
              >
                NEXT UP
              </ListSubheader>
            }
          >
            {queue.map((song, idx) => (
              <ListItem
                key={`queue_${song._id}`}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="close"
                    onClick={() => dispatch(deleteTrack({ songId: song._id }))}
                  >
                    <CloseIcon />
                  </IconButton>
                }
                disablePadding
              >
                <MListItemButton onClick={() => dispatch(nextTrack({ skip: idx }))}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{ borderRadius: "4px" }}
                      src={`${AppAPI.HOST}/album/${song.album?._id}/cover`}
                    >
                      <MusicNoteIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={song.title}
                    secondary={song.artist}
                    primaryTypographyProps={{
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                    secondaryTypographyProps={{
                      fontSize: "14px"
                    }}
                  />
                </MListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </Box>
  );
};

const MListItemButton = styled(ListItemButton)(() => ({
  borderRadius: "10px"
}));

export default FloatingQueueList;
