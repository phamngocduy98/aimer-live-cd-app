import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { Box, Grid } from "@mui/material";
import { AlbumCard } from "../../components/media/AlbumCard";
import { SongTable } from "../../components/media/SongTable";
import { MediaHero } from "../../components/view/MediaHero";
import { PageScaffold } from "../../components/view/PageScaffold";
import { PlayShuffleActions } from "../../components/view/PlayShuffleActions";
import { SectionHeader } from "../../components/view/SectionHeader";
import { Album } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import { Song } from "../../core/Song";
import { useAppDispatch } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";

export const ArtistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { name } = useParams();
  const artistName = decodeURIComponent(name ?? "");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (!artistName) return;
    Promise.all([appAPI.artistTopTracks(artistName), appAPI.listAlbums(0, 100)]).then(
      ([trackData, albumData]) => {
        setSongs(trackData);
        setAlbums(albumData.filter((album) => album.artist === artistName));
      }
    );
  }, [artistName]);

  const heroAlbum = albums[0] ?? songs.find((song) => song.album)?.album;
  const totalDuration = useMemo(
    () => songs.reduce((total, song) => total + song.duration, 0),
    [songs]
  );

  const playAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const shuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <PageScaffold
      backgroundImage={
        heroAlbum
          ? `linear-gradient(180deg, rgba(0,0,0,.18) 0%, #000 500px), linear-gradient(90deg, rgba(0,0,0,.95), rgba(0,0,0,.46)), url("${AppAPI.HOST}/album/${heroAlbum._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 500px)"
      }
    >
      <MediaHero
        eyebrow="Artist"
        title={artistName || "Unknown artist"}
        subtitle={`${songs.length} tracks / ${albums.length} albums / ${formatDuration(totalDuration)}`}
        titleSx={{ fontSize: { xs: 42, sm: 64, md: 84 } }}
        sx={{ pt: { xs: 8, sm: 14 }, pb: 3 }}
      >
        <PlayShuffleActions onPlay={playAll} onShuffle={shuffleAll} />
      </MediaHero>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <SectionHeader icon={<MusicNoteIcon />} title="Top tracks" />
        <SongTable
          songs={songs}
          ariaLabel="artist songs table"
          showArtist={false}
          mobileSubtitle="album"
          onPlayFromIndex={(idx) =>
            dispatch(reset({ songs: songs.slice(idx), history: songs.slice(0, idx), type: "audio" }))
          }
        />
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <SectionHeader icon={<AlbumIcon />} title="Albums" />
        <Grid container spacing={2.5}>
          {albums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <AlbumCard album={album} secondary="year" />
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageScaffold>
  );
};
