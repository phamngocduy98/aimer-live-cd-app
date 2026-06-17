import { usePlaybackGate } from "@features/auth";
import { VideoCard } from "@components/media/VideoCard";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { CollectionContent, PageState } from "@components/view/designSystem";
import Grid from "@mui/material/Grid";
import React, { useMemo, useState } from "react";
import { useVideos } from "../hooks/useLibrary";

export const Videos: React.FC = () => {
  const play = usePlaybackGate();
  const { data: videos = [] } = useVideos();
  const [filter, setFilter] = useState("");

  const visibleVideos = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return videos;

    return videos.filter((video) =>
      [video.title, video.artist?.join(", "), video.year?.toString(), video.genre?.join(", ")]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [filter, videos]);

  const onPlayAll = () => {
    if (videos.length === 0) return;
    play({ items: videos, playFrom: playSource });
  };

  const onPlayShuffleAll = () => {
    if (videos.length === 0) return;
    play({ items: videos, playFrom: playSource, shuffle: true });
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

      <CollectionContent>
        <Grid container spacing={2.5}>
          {visibleVideos.map((video, idx) => (
            <Grid key={video._id} item xs={6} sm={4} md={3} lg={2}>
              <VideoCard
                video={video}
                onPlay={() =>
                  play({ items: visibleVideos, playFrom: playSource, startIndex: idx })
                }
              />
            </Grid>
          ))}
          {visibleVideos.length === 0 && (
            <Grid item xs={12}>
              <PageState
                state="empty"
                message={
                  videos.length === 0 ? "No videos in your library" : `No videos match “${filter}”`
                }
              />
            </Grid>
          )}
        </Grid>
      </CollectionContent>
    </PageScaffold>
  );
};
const playSource = { type: "videos" as const, label: "Videos", route: "/videos" };
