import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@mui/material/Button";

import QueueMusicIcon from "@mui/icons-material/QueueMusic";

import { reset } from "@features/player/store/playerSlice";
import { useAppDispatch } from "@app/hooks";
import { SongTable } from "@components/media/SongTable";
import { MediaHero } from "@components/view/MediaHero";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlayShuffleActions } from "@components/view/PlayShuffleActions";
import { useDeletePlaylist, usePlaylist, useRemoveSongFromPlaylist } from "../hooks/usePlaylists";

export const PlaylistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { data: playlist } = usePlaylist(id);
  const deletePlaylist = useDeletePlaylist();
  const removeSong = useRemoveSongFromPlaylist();

  const handleDelete = () => {
    if (!id || !playlist) return;
    deletePlaylist.mutate(id, { onSuccess: () => navigate("/playlists") });
  };

  const handleRemoveSong = (songId: string) => {
    if (!id) return;
    removeSong.mutate({ playlistId: id, songId });
  };

  if (playlist == null) return null;

  return (
    <PageScaffold background="linear-gradient(180deg, #171717 0%, #000 430px)">
      <MediaHero
        eyebrow="Playlist"
        title={playlist.name}
        description={playlist.description}
        subtitle={`${playlist.songs.length} songs`}
        icon={<QueueMusicIcon />}
        artworkSize={{ xs: 120, sm: 180 }}
      >
        <PlayShuffleActions
          onPlay={() => {
            if (playlist.songs.length === 0) return;
            dispatch(reset({ songs: playlist.songs, type: "audio" }));
          }}
          onShuffle={() => {
            if (playlist.songs.length === 0) return;
            dispatch(reset({ songs: playlist.songs, shuffle: true, type: "audio" }));
          }}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDelete}
          sx={{
            mt: 1.5,
            textTransform: "none",
            borderRadius: "999px",
            px: 2,
            alignSelf: "flex-start"
          }}
        >
          Delete
        </Button>
      </MediaHero>

      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <SongTable
          songs={playlist.songs}
          ariaLabel="playlist songs table"
          showActions
          onPlayFromIndex={(idx) =>
            dispatch(
              reset({
                songs: playlist.songs.slice(idx),
                history: playlist.songs.slice(0, idx),
                type: "audio"
              })
            )
          }
          getExtraActions={(song) => [
            { label: "Remove from playlist", onClick: () => handleRemoveSong(song._id) }
          ]}
        />
      </div>
    </PageScaffold>
  );
};
