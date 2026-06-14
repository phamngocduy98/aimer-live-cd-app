import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, Grid, IconButton, Typography } from "@mui/material";
import { AlbumCard } from "@components/media/AlbumCard";
import { PageScaffold } from "@components/view/PageScaffold";
import { SectionHeader } from "@components/view/SectionHeader";
import { artistImageUrl, artistPath } from "@utils/artist";
import { apiAssetUrl } from "@lib/axios";
import { useAlbums, useSongs } from "../hooks/useLibrary";
import { usePlayAlbum } from "@features/album";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { data: albums = [] } = useAlbums(0, 12);
  const { data: songs = [] } = useSongs(0, 12);
  const playAlbum = usePlayAlbum();

  const artists = useMemo(() => {
    const coverByArtist = new Map<string, string>();

    albums.forEach((album) => {
      if (!coverByArtist.has(album.artist)) {
        coverByArtist.set(album.artist, album._id);
      }
    });
    songs.forEach((song) => {
      song.artist?.forEach((artist) => {
        if (!coverByArtist.has(artist) && song.album) {
          coverByArtist.set(artist, song.album._id);
        }
      });
    });

    return [
      ...new Set([
        ...albums.map((album) => album.artist),
        ...songs.flatMap((song) => song.artist ?? [])
      ])
    ]
      .slice(0, 8)
      .map((name) => ({ name, coverAlbumId: coverByArtist.get(name) }));
  }, [albums, songs]);

  return (
    <PageScaffold>
      <Box
        sx={{
          px: { xs: 2.5, sm: 4, lg: 6 },
          pt: { xs: 3, sm: 4 },
          maxWidth: 1440,
          mx: "auto"
        }}
      >
        <SectionHeader
          title="Featured albums"
          action="View all"
          onAction={() => navigate("/albums")}
        />
        <Grid container spacing={2.5}>
          {albums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <AlbumCard album={album} onPlay={playAlbum} />
            </Grid>
          ))}
        </Grid>

        <SectionHeader title="Artists to revisit" sx={{ mt: 5 }} />
        <Grid container spacing={2.5}>
          {artists.map(({ name, coverAlbumId }) => (
            <Grid key={name} item xs={6} sm={4} md={3} lg={2}>
              <Box
                onClick={() => navigate(artistPath(name))}
                title={name}
                sx={{
                  minWidth: 0,
                  cursor: "pointer",
                  textAlign: "center",
                  "&:hover .artist-image": {
                    transform: "scale(1.04)"
                  },
                  "&:hover .artist-play": {
                    opacity: 1,
                    transform: "translate(-50%, -50%) scale(1)"
                  }
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    overflow: "hidden",
                    bgcolor: "#181818",
                    boxShadow: "0 16px 36px rgba(0,0,0,.32)"
                  }}
                >
                  <Box
                    className="artist-image"
                    component="img"
                    src={artistImageUrl(name)}
                    alt={name}
                    onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                      if (
                        coverAlbumId &&
                        event.currentTarget.src !== apiAssetUrl(`/album/${coverAlbumId}/cover`)
                      ) {
                        event.currentTarget.src = apiAssetUrl(`/album/${coverAlbumId}/cover`);
                        return;
                      }
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling;
                      if (fallback instanceof HTMLElement) fallback.style.display = "grid";
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      transition: "transform .25s ease"
                    }}
                  />
                  <Box
                    className="artist-image"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      display: "none",
                      placeItems: "center",
                      background: "linear-gradient(145deg, #353535, #111)",
                      fontSize: { xs: 42, sm: 54 },
                      fontWeight: 850,
                      transition: "transform .25s ease"
                    }}
                  >
                    {name.slice(0, 1).toUpperCase()}
                  </Box>
                  <IconButton
                    className="artist-play"
                    aria-label={`View ${name}`}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 46,
                      height: 46,
                      bgcolor: "#fff",
                      color: "#111",
                      opacity: { xs: 1, sm: 0 },
                      transform: {
                        xs: "translate(-50%, -50%) scale(1)",
                        sm: "translate(-50%, -44%) scale(.9)"
                      },
                      transition: "opacity 160ms ease, transform 160ms ease",
                      "&:hover": { bgcolor: "#fff", transform: "translate(-50%, -50%) scale(1.06)" }
                    }}
                  >
                    <PlayArrowRoundedIcon />
                  </IconButton>
                </Box>
                <Typography noWrap fontWeight={750} sx={{ mt: 1.15, letterSpacing: "-.01em" }}>
                  {name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageScaffold>
  );
};
