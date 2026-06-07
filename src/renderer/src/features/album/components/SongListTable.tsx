import { Fragment } from "react";

import { playContext } from "@features/player/store/playerSlice";
import type { AlbumDetail } from "../types";
import { useAppDispatch } from "@app/hooks";
import { SongTable } from "@components/media/SongTable";

export const SongListTable: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
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
        mobileEmphasis
        playSource={playSource}
        onPlayFromIndex={(idx) =>
          dispatch(playContext({ items: album.trackList, playFrom: playSource, startIndex: idx }))
        }
      />
    </Fragment>
  );
};
