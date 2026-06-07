import React, { useState } from "react";
import { useParams } from "react-router-dom";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PodcastsRoundedIcon from "@mui/icons-material/PodcastsRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Box, Button, Menu, MenuItem, Snackbar, Typography } from "@mui/material";
import { AlbumShelf } from "@components/media/AlbumShelf";
import { SongTable } from "@components/media/SongTable";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlayShuffleActions } from "@components/view/PlayShuffleActions";
import { SectionHeader } from "@components/view/SectionHeader";
import { useAppDispatch } from "@app/hooks";
import { playContext } from "@features/player/store/playerSlice";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl } from "@utils/artist";
import { useArtist } from "../hooks/useArtist";

const FEATURED_TRACK_COUNT = 4;

export const ArtistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { name } = useParams();
  const artistName = decodeURIComponent(name ?? "");
  const { data } = useArtist(artistName);
  const songs = data?.songs ?? [];
  const albums = data?.albums ?? [];
  const [isFollowing, setIsFollowing] = useState(true);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const heroAlbum = albums[0] ?? songs.find((song) => song.album)?.album;
  const fallbackHeroImage = heroAlbum ? apiAssetUrl(`/album/${heroAlbum._id}/cover`) : "";
  const [heroImage, setHeroImage] = useState("");
  React.useEffect(() => {
    setHeroImage(artistName ? artistImageUrl(artistName) : fallbackHeroImage);
  }, [artistName, fallbackHeroImage]);
  const visibleSongs = showAllTracks ? songs : songs.slice(0, FEATURED_TRACK_COUNT);
  const playSource = {
    type: "artist" as const,
    id: artistName,
    label: artistName,
    route: `/artist/${encodeURIComponent(artistName)}`
  };

  const playAll = () => {
    if (songs.length === 0) return;
    dispatch(playContext({ items: songs, playFrom: playSource }));
  };

  const shuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(playContext({ items: songs, playFrom: playSource, shuffle: true }));
  };

  const copyArtistLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Artist link copied");
    } catch {
      setShareMessage("Unable to copy artist link");
    }
    setMoreAnchor(null);
  };

  const shareArtist = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: artistName, url: window.location.href });
        return;
      } catch {
        return;
      }
    }
    await copyArtistLink();
  };

  return (
    <PageScaffold sx={{ pt: "64px" }}>
      <Box
        component="section"
        sx={{
          position: "relative",
          minHeight: { xs: 590, sm: 500, lg: 470 },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          backgroundColor: "#101212",
          backgroundImage: heroImage
            ? {
                xs: `linear-gradient(180deg, rgba(0,0,0,.18) 5%, rgba(0,0,0,.42) 46%, #000 96%), url("${heroImage}")`,
                md: `linear-gradient(90deg, #101212 0%, rgba(8,10,10,.78) 35%, rgba(0,0,0,.08) 69%, rgba(0,0,0,.76) 100%), linear-gradient(180deg, transparent 44%, #000 100%), url("${heroImage}")`
              }
            : "linear-gradient(135deg, #1d2424 0%, #050505 70%)",
          backgroundSize: { xs: "cover", md: "auto, auto, min(72vw, 1120px) auto" },
          backgroundPosition: { xs: "center", md: "center, center, 74% center" },
          backgroundRepeat: "no-repeat"
        }}
      >
        {artistName && heroImage === artistImageUrl(artistName) ? (
          <Box
            component="img"
            src={heroImage}
            alt=""
            onError={() => setHeroImage(fallbackHeroImage)}
            sx={{ display: "none" }}
          />
        ) : null}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 1440,
            mx: "auto",
            px: { xs: 2.5, sm: 4, lg: 6 },
            pb: { xs: 3, md: 3.5 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(400px, 660px) 1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "end"
          }}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 44, sm: 58, lg: 68 },
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-.035em",
                textShadow: "0 2px 28px rgba(0,0,0,.55)"
              }}
            >
              {artistName || "Unknown artist"}
            </Typography>
            <Typography sx={{ mt: 1.5, fontWeight: 700, color: "#f0f0f0" }}>
              {songs.length} tracks · {albums.length} releases
            </Typography>
            <Typography
              sx={{
                mt: 1.5,
                maxWidth: 620,
                mx: { xs: "auto", md: 0 },
                color: "rgba(255,255,255,.82)",
                fontSize: { xs: 14, sm: 15 },
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              Explore {artistName || "this artist"} through the top tracks and releases saved in
              your music library.
            </Typography>
            <PlayShuffleActions
              onPlay={playAll}
              onShuffle={shuffleAll}
              sx={{
                justifyContent: { xs: "center", md: "flex-start" },
                mt: 2.5,
                "& .MuiButton-root": {
                  width: { xs: "calc(50% - 6px)", sm: 154 },
                  minHeight: 48,
                  fontSize: 16,
                  fontWeight: 800
                }
              }}
            />
          </Box>

          <Box
            aria-label="Artist actions"
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(62px, 1fr))",
              gap: { xs: 1, sm: 2 },
              justifySelf: { md: "end" },
              width: { xs: "100%", md: 400 }
            }}
          >
            <ArtistAction
              active={isFollowing}
              icon={<CheckRoundedIcon />}
              label={isFollowing ? "Following" : "Follow"}
              onClick={() => setIsFollowing((current) => !current)}
            />
            <ArtistAction
              icon={<PodcastsRoundedIcon />}
              label="Artist radio"
              onClick={shuffleAll}
            />
            <ArtistAction icon={<ShareOutlinedIcon />} label="Share" onClick={shareArtist} />
            <ArtistAction
              icon={<MoreHorizRoundedIcon />}
              label="More"
              onClick={(event) => setMoreAnchor(event.currentTarget)}
            />
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        sx={{ maxWidth: 1440, mx: "auto", px: { xs: 1, sm: 3, lg: 5 }, pt: { xs: 3, md: 2 } }}
      >
        <SectionHeader
          title="Top Tracks"
          action={
            songs.length > FEATURED_TRACK_COUNT
              ? showAllTracks
                ? "Show less"
                : "View all"
              : undefined
          }
          onAction={() => setShowAllTracks((current) => !current)}
          sx={{ px: { xs: 1.5, sm: 0 }, mb: 0.5 }}
        />
        <SongTable
          songs={visibleSongs}
          ariaLabel="artist songs table"
          showArtist={false}
          showArtwork
          showQuality={false}
          mobileSubtitle="album"
          playSource={playSource}
          onPlayFromIndex={(idx) =>
            dispatch(playContext({ items: visibleSongs, playFrom: playSource, startIndex: idx }))
          }
        />
      </Box>

      <Box
        component="section"
        sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 3, lg: 5 }, pt: 5 }}
      >
        <AlbumShelf title="Albums" albums={albums} />
      </Box>

      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={copyArtistLink}>Copy artist link</MenuItem>
        <MenuItem onClick={() => setMoreAnchor(null)} disabled>
          {songs.length} tracks in library
        </MenuItem>
      </Menu>
      <Snackbar
        open={Boolean(shareMessage)}
        autoHideDuration={2200}
        onClose={() => setShareMessage("")}
        message={shareMessage}
      />
    </PageScaffold>
  );
};

interface ArtistActionProps {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const ArtistAction: React.FC<ArtistActionProps> = ({ active = false, icon, label, onClick }) => (
  <Button
    onClick={onClick}
    aria-label={label}
    sx={{
      minWidth: 0,
      color: active ? "#26e7df" : "#fff",
      textTransform: "none",
      display: "flex",
      flexDirection: "column",
      gap: 0.75,
      fontSize: { xs: 11, sm: 12 },
      fontWeight: 800,
      lineHeight: 1.15,
      "& .MuiSvgIcon-root": { fontSize: 29 },
      "&:hover": { bgcolor: "rgba(255,255,255,.08)" }
    }}
  >
    {icon}
    <span>{label}</span>
  </Button>
);
