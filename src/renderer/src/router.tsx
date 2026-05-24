import { createHashRouter } from "react-router-dom";
import { AlbumView } from "./views/album/AlbumView";
import { Albums } from "./views/albums/AlbumList";
import { Songs } from "./views/songs/SongList";
import { Videos } from "./views/videos/VideoList";

export const router = createHashRouter([
  {
    path: "/",
    element: <Albums />
  },
  {
    path: "/songs",
    element: <Songs />
  },
  {
    path: "/videos",
    element: <Videos />
  },
  {
    path: "/album/:id",
    element: <AlbumView />
  }
]);
