import React from "react";

import Grid from "@mui/material/Grid";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import { VideoCard } from "@components/media/VideoCard";
import VideocamIcon from "@mui/icons-material/Videocam";
import { MediaHero } from "@components/view/MediaHero";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlayShuffleActions } from "@components/view/PlayShuffleActions";
import { apiAssetUrl } from "@lib/axios";
import { useVideos } from "../hooks/useLibrary";

export const Videos: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: videos = [] } = useVideos();

  return (
    <PageScaffold
      backgroundImage={
        videos[0]?.album?._id
          ? `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 430px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.48)), url("${apiAssetUrl(`/album/${videos[0].album._id}/cover`)}")`
          : "linear-gradient(180deg, #151515 0%, #000 430px)"
      }
    >
      <MediaHero
        eyebrow="Collection"
        title="Videos"
        subtitle={`${videos.length} videos`}
        icon={<VideocamIcon />}
      >
        <PlayShuffleActions
          playAriaLabel="play videos"
          shuffleAriaLabel="shuffle videos"
          onPlay={() => {
            if (videos.length === 0) return;
            dispatch(reset({ songs: videos, type: "video" }));
          }}
          onShuffle={() => {
            if (videos.length === 0) return;
            dispatch(reset({ songs: videos, shuffle: true, type: "video" }));
          }}
        />
      </MediaHero>

      <Grid
        container
        spacing={2.5}
        sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, pb: 3 }}
      >
        {videos.map((video, idx) => (
          <Grid key={video._id} item xs={6} sm={4} md={3} lg={2}>
            <VideoCard
              video={video}
              onClick={() =>
                dispatch(
                  reset({ songs: videos.slice(idx), history: videos.slice(0, idx), type: "video" })
                )
              }
            />
          </Grid>
        ))}
      </Grid>
    </PageScaffold>
  );
};
