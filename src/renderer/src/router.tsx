import { createBrowserRouter } from "react-router-dom";
import { AlbumView } from "./views/album/AlbumView";
import { Albums } from "./views/albums/AlbumList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Albums />
  },
  {
    path: "/album/:id",
    element: <AlbumView />
  }
]);
