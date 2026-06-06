import { createHashRouter } from "react-router-dom"
import { AlbumView } from "../views/album/AlbumView"
import { Albums } from "../views/albums/AlbumList"
import { ArtistView } from "../views/artist/ArtistView"
import { Home } from "../views/home/Home"
import { Songs } from "../views/songs/SongList"
import { Videos } from "../views/videos/VideoList"
import { SearchResults } from "../views/search/SearchResults"
import { Playlists } from "../views/playlists/PlaylistList"
import { PlaylistView } from "../views/playlist/PlaylistView"

export const router = createHashRouter([
  { path: "/", element: <Home /> },
  { path: "/albums", element: <Albums /> },
  { path: "/songs", element: <Songs /> },
  { path: "/videos", element: <Videos /> },
  { path: "/album/:id", element: <AlbumView /> },
  { path: "/artist/:name", element: <ArtistView /> },
  { path: "/search", element: <SearchResults /> },
  { path: "/playlists", element: <Playlists /> },
  { path: "/playlist/:id", element: <PlaylistView /> }
])
