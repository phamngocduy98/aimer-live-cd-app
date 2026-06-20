import { Fragment } from "react";

import type { AlbumDetail } from "../types";
import { SongTable } from "@components/media/SongTable";
import { usePlaybackGate } from "@features/auth";

export const SongListTable: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const play = usePlaybackGate();
  const playSource = {
    type: "album" as const,
    id: album._id,
    label: album.title,
    route: `/album/${album._id}`
  };

  return (
    <Fragment>
      <SongTable
        songs={album.trackList}
        ariaLabel="album songs table"
        getIndexLabel={(track) => track.trackNo}
        showAlbum={false}
        showQuality={false}
        showActions
        playSource={playSource}
        onPlayFromIndex={(idx) =>
          play({ items: album.trackList, playFrom: playSource, startIndex: idx })
        }
      />
    </Fragment>
  );
};
