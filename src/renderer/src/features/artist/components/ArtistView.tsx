import React, { useState } from "react";
import { useParams } from "react-router-dom";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PodcastsRoundedIcon from "@mui/icons-material/PodcastsRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Box, Snackbar, Typography } from "@mui/material";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { AlbumShelf } from "@components/media/AlbumShelf";
import { VideoShelf } from "@components/media/VideoShelf";
import { SongTable } from "@components/media/SongTable";
import { PageScaffold } from "@components/view/PageScaffold";
import { SectionHeader } from "@components/view/SectionHeader";
import {
  DetailActionButton,
  DetailActions,
  DetailContent,
  PrimaryActionGroup
} from "@components/view/designSystem";
import { usePlaybackGate } from "@features/auth";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl } from "@utils/artist";
import { useArtist } from "../hooks/useArtist";
import { usePlayAlbum } from "@features/album";

const FEATURED_TRACK_COUNT = 4;

export const ArtistView: React.FC = () => {
  const play = usePlaybackGate();
  const playAlbum = usePlayAlbum();
  const { name } = useParams();
  const artistName = decodeURIComponent(name ?? "");
  const { data } = useArtist(artistName);
  const songs = data?.songs ?? [];
  const albums = data?.albums ?? [];
  const videos = data?.videos ?? [];
  const [isFollowing, setIsFollowing] = useState(true);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const heroAlbum = albums[0] ?? songs.find((song) => song.album)?.album;
  const fallbackHeroImage = heroAlbum
    ? apiAssetUrl(`/album/${heroAlbum._id}/cover`)
    : videos[0]
      ? apiAssetUrl(`/video/${videos[0]._id}/cover`)
      : "";
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
    play({ items: songs, playFrom: playSource });
  };

  const shuffleAll = () => {
    if (songs.length === 0) return;
    play({ items: songs, playFrom: playSource, shuffle: true });
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
    <PageScaffold>
      <Box
        component="section"
        sx={(theme) => ({
          position: "relative",
          minHeight: { xs: 460, sm: 500, lg: 470 },
          display: "flex",
          alignItems: "flex-end",
          pt: theme.design.layout.topClearance,
          overflow: "hidden",
          backgroundColor: theme.design.color.surface,
          backgroundImage: heroImage
            ? {
                xs: `linear-gradient(180deg, rgba(0,0,0,.18) 5%, rgba(0,0,0,.42) 46%, #000 96%), url("${heroImage}")`,
                md: `linear-gradient(90deg, #101212 0%, rgba(8,10,10,.78) 35%, rgba(0,0,0,.08) 69%, rgba(0,0,0,.76) 100%), linear-gradient(180deg, transparent 44%, #000 100%), url("${heroImage}")`
              }
            : "linear-gradient(135deg, #1d2424 0%, #050505 70%)",
          backgroundSize: { xs: "cover", md: "auto, auto, min(72vw, 1120px) auto" },
          backgroundPosition: { xs: "center", md: "center, center, 74% center" },
          backgroundRepeat: "no-repeat"
        })}
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
          sx={(theme) => ({
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: theme.design.layout.detailWidth,
            mx: "auto",
            px: theme.design.layout.gutters,
            pb: { xs: 3, md: 3.5 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(400px, 660px) 1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "end"
          })}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography
              component="h1"
              sx={(theme) => ({
                ...theme.design.typography.detailTitle,
                overflowWrap: "anywhere",
                textShadow: "0 2px 28px rgba(0,0,0,.55)"
              })}
            >
              {artistName || "Unknown artist"}
            </Typography>
            <Typography
              sx={(theme) => ({
                ...theme.design.typography.metadata,
                mt: 1.5,
                color: theme.design.color.text,
                fontWeight: 700
              })}
            >
              {songs.length} tracks · {albums.length} releases
            </Typography>
            <Typography
              sx={(theme) => ({
                ...theme.design.typography.metadata,
                mt: 1.5,
                maxWidth: 620,
                mx: { xs: "auto", md: 0 },
                color: "rgba(255,255,255,.82)",
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              })}
            >
              Explore {artistName || "this artist"} through the top tracks and releases saved in
              your music library.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-start" },
                mt: 2.5
              }}
            >
              <PrimaryActionGroup onPlay={playAll} onShuffle={shuffleAll} />
            </Box>
          </Box>

          <Box aria-label="Artist actions" sx={{ justifySelf: { md: "end" }, width: "100%" }}>
            <DetailActions
              secondaryColumns={4}
              secondary={
                <>
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
                </>
              }
            />
          </Box>
        </Box>
      </Box>

      <DetailContent compactGutter sx={{ pt: { xs: 3, md: 2 } }}>
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
            play({ items: visibleSongs, playFrom: playSource, startIndex: idx })
          }
        />
      </DetailContent>

      <DetailContent sx={{ pt: 5 }}>
        <AlbumShelf title="Albums" albums={albums} onPlay={playAlbum} />
        <VideoShelf
          title="Videos"
          videos={videos}
          sx={{ mt: albums.length > 0 ? 5 : 0 }}
          onPlay={(_video, index) =>
            play({ items: videos, playFrom: playSource, startIndex: index })
          }
        />
      </DetailContent>

      <ResponsiveActionMenu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        ariaLabel={`${artistName} actions`}
        items={[
          { label: "Copy artist link", onClick: copyArtistLink },
          { label: `${songs.length} tracks in library`, disabled: true }
        ]}
      />
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
  <DetailActionButton
    icon={icon}
    label={label}
    onClick={onClick}
    sx={(theme) => ({
      color: active ? theme.design.color.accent : theme.design.color.text
    })}
  />
);
