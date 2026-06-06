import { createHashRouter } from "react-router-dom"
import { AppShell } from "./AppShell"

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        lazy: () => import("@features/library").then((module) => ({ Component: module.Home }))
      },
      {
        path: "/albums",
        lazy: () => import("@features/library").then((module) => ({ Component: module.Albums }))
      },
      {
        path: "/songs",
        lazy: () => import("@features/library").then((module) => ({ Component: module.Songs }))
      },
      {
        path: "/videos",
        lazy: () => import("@features/library").then((module) => ({ Component: module.Videos }))
      },
      {
        path: "/album/:id",
        lazy: () => import("@features/album").then((module) => ({ Component: module.AlbumView }))
      },
      {
        path: "/artist/:name",
        lazy: () => import("@features/artist").then((module) => ({ Component: module.ArtistView }))
      },
      {
        path: "/search",
        lazy: () => import("@features/search").then((module) => ({ Component: module.SearchResults }))
      },
      {
        path: "/playlists",
        lazy: () => import("@features/playlist").then((module) => ({ Component: module.Playlists }))
      },
      {
        path: "/playlist/:id",
        lazy: () =>
          import("@features/playlist").then((module) => ({ Component: module.PlaylistView }))
      }
    ]
  }
])
