import { useAppDispatch } from "@app/hooks";
import { VideoCard } from "@components/media/VideoCard";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { reset } from "@features/player/store/playerSlice";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useMemo, useState } from "react";
import { useVideos } from "../hooks/useLibrary";

export const Videos: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: videos = [] } = useVideos();
  const [filter, setFilter] = useState("");

  const visibleVideos = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return videos;

    return videos.filter((video) =>
      [video.title, video.artist?.join(", "), video.album?.title]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [filter, videos]);

  const onPlayAll = () => {
    if (videos.length === 0) return;
    dispatch(reset({ songs: videos, type: "video" }));
  };

  const onPlayShuffleAll = () => {
    if (videos.length === 0) return;
    dispatch(reset({ songs: videos, shuffle: true, type: "video" }));
  };

  return (
    <PageScaffold>
      <CollectionHeader
        title="Videos"
        filterLabel="Filter videos"
        filterValue={filter}
        onFilterChange={setFilter}
        actions={[
          { label: "Play all", onClick: onPlayAll },
          { label: "Shuffle all", onClick: onPlayShuffleAll },
          { label: `${videos.length} videos`, disabled: true }
        ]}
      />

      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, pb: 3 }}>
        <Grid container spacing={2.5}>
          {visibleVideos.map((video, idx) => (
            <Grid key={video._id} item xs={6} sm={4} md={3} lg={2}>
              <VideoCard
                video={video}
                onClick={() =>
                  dispatch(
                    reset({
                      songs: visibleVideos.slice(idx),
                      history: visibleVideos.slice(0, idx),
                      type: "video"
                    })
                  )
                }
              />
            </Grid>
          ))}
          {visibleVideos.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
                {videos.length === 0
                  ? "No videos in your library"
                  : `No videos match &ldquo;{filter}&rdquo;`}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </PageScaffold>
  );
};
