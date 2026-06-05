# Renderer Refactor — Design

**Date:** 2026-06-06
**Status:** Approved (design phase); pending spec review
**Scope:** `src/renderer/` only (Electron renderer process). Main process, preload, and backend are out of scope.

## Context

The renderer folder has grown organically to ~60 files. The current shape is:

- `api/` with a single 168-line `AppAPI` class containing every endpoint
- `views/` with 10 domain folders, mixing list views, detail views, and player UI
- `components/dialogs/` with feature-specific dialogs
- `store/` with no feature slicing
- `contexts/` with a single `PlaylistRefreshContext` used to invalidate the playlist list
- `App.tsx` at 281 lines acting as theme provider, host CRUD UI, playlist refresh coordinator, layout shell, dialog host, and player host

Concretely painful patterns today:

- `App.tsx` is a god component owning state for hosts (`hosts`, `fileListResults`, `newHost`, four handlers), playlist refresh (`playlistRefreshKey`, `triggerRefresh`, `handleCreatePlaylist`), dialog visibility (`isCreatePlaylistOpen`, `isHostDialogOpen`, `isAddHostDialogOpen`, `anchorEl`, `isMenuOpen`), and player layout (desktop + mobile + queue positioning + mobile toggle)
- `views/player/` mixes the full-screen `MobilePlayerUI` with small widgets (`ControlButton`, `VolumeController`) that are not pages
- `views/album/` (singular = detail) and `views/albums/` (plural = list) — and same for `playlist/` vs `playlists/`
- `api/api.ts:24` is one class with every endpoint
- `store/` is monolithic; every Redux file is in one folder with no domain slicing
- `components/types.ts` and `components/view/` are oddly named shared buckets

## Goals

- Each business domain owns its API, components, hooks, store, and types
- `app/` becomes a thin shell; layout chrome is in `app/AppShell.tsx`
- `App.tsx` (the old one) is gone; the shell composition is explicit
- Data fetching moves out of `App.tsx` into per-feature React Query hooks
- Per-feature code splitting via lazy routes
- Path aliases for clean imports
- App builds, type-checks, and passes E2E at every migration step

## Non-Goals

- No new features, no behavior changes
- No backend changes
- No migration to a different state library (Redux stays for the player; React Query handles server state)
- No new styling system (MUI stays)
- No new router (React Router stays)
- No introduction of a design-system package
- No removal of Redux (player slice moves, but the store itself is preserved)

## Target Folder Structure

```
src/renderer/src/
├── main.tsx                       # entry: ReactDOM + QueryClientProvider + App
├── app/                           # app shell, providers, router
│   ├── App.tsx                    # thin: wires providers + <AppShell />
│   ├── AppShell.tsx               # layout: Sidebar + TopNavBar + main + <Player />
│   ├── providers.tsx              # ThemeProvider + CssBaseline
│   ├── router.tsx                 # createHashRouter with lazy per feature
│   ├── theme.ts                   # createTheme(dark)
│   ├── store.ts                   # Redux store (configureStore)
│   └── hooks.ts                   # typed useAppDispatch / useAppSelector
├── components/                    # shared, presentational
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNavBar.tsx
│   │   └── MainContent.tsx        # <Outlet/> slot + <Suspense fallback>
│   ├── media/                     # cards
│   │   ├── SongCard.tsx
│   │   ├── VideoCard.tsx
│   │   ├── AlbumCard.tsx
│   │   └── PlaylistCard.tsx
│   ├── view/                      # presentational page-level building blocks
│   │   ├── SectionHeader.tsx
│   │   ├── StatTile.tsx
│   │   ├── MediaHero.tsx
│   │   └── PlayShuffleActions.tsx
│   ├── search/
│   │   └── SearchDropdown.tsx
│   └── common/
│       ├── LoadingFallback.tsx    # Suspense skeleton
│       └── ErrorBoundary.tsx
├── features/                      # one folder per business domain
│   ├── player/
│   │   ├── components/            # Player.tsx (root), MPlayerUI, MobilePlayerUI,
│   │   │                          # FloatingQueueList, ControlButton, PlayingSlider,
│   │   │                          # SongInfo, SongBitDepth, VolumeController
│   │   ├── hooks/                 # usePlayer, useQueue, useMobilePlayerToggle
│   │   ├── store/                 # playerSlice, playerGuiSlice, playerVideoControl
│   │   ├── thunks/                # onNextTrack, onPrevTrack, onVideoPosition
│   │   ├── types.ts
│   │   └── index.ts               # public API: exports Player
│   ├── library/                   # catalog lists: songs, videos, albums
│   │   ├── api/                   # listSongs, listVideos, listAlbums, search
│   │   ├── components/            # SongList, VideoList, AlbumList
│   │   ├── hooks/                 # useSongs, useVideos, useAlbums
│   │   ├── views/                 # Home.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   ├── album/                     # album detail
│   │   ├── api/                   # getAlbum
│   │   ├── components/            # AlbumView, AlbumInfo, AlbumControlButton,
│   │   │                          # SongListTable, VideoList
│   │   ├── hooks/                 # useAlbum
│   │   ├── types.ts
│   │   └── index.ts
│   ├── playlist/
│   │   ├── api/                   # listPlaylists, getPlaylist, createPlaylist,
│   │   │                          # updatePlaylist, deletePlaylist, addSongs,
│   │   │                          # removeSong
│   │   ├── components/            # PlaylistView, PlaylistList,
│   │   │                          # CreatePlaylistDialog, AddToPlaylistDialog
│   │   ├── hooks/                 # usePlaylists, usePlaylist, useCreatePlaylist
│   │   ├── views/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── search/
│   │   ├── api/                   # search(q)
│   │   ├── components/            # SearchResults
│   │   ├── hooks/                 # useSearch
│   │   ├── types.ts
│   │   └── index.ts
│   ├── artist/
│   │   ├── api/                   # artistTopTracks
│   │   ├── components/            # ArtistView
│   │   ├── hooks/                 # useArtist
│   │   ├── types.ts
│   │   └── index.ts
│   └── hosts/                     # admin host management
│       ├── api/                   # getHosts, deleteHost, listHostFiles, createHost
│       ├── components/            # ManageHostsDialog, AddHostDialog
│       ├── hooks/                 # useHosts, useHostFiles, useCreateHost,
│       │                          # useDeleteHost
│       ├── types.ts               # Host, ListFilesResult, NewHostState
│       └── index.ts
├── hooks/                         # cross-feature hooks (e.g., useDebounce)
├── lib/
│   ├── axios.ts                   # axios instance + baseURL setup
│   └── queryClient.ts             # QueryClient config
├── types/
│   └── shared.ts                  # SearchResult and other cross-feature types
├── utils/                         # pure functions
│   ├── formatDuration.ts
│   ├── shuffleArray.ts
│   └── artist.ts
├── assets/
└── index.css
```

## Old -> New File Mapping

| Old path | New path |
|---|---|
| `App.tsx` | `app/App.tsx` (thin) + `app/AppShell.tsx` (layout) |
| `router.tsx` | `app/router.tsx` |
| `main.tsx` | `main.tsx` (wraps with QueryClientProvider) |
| `api/api.ts` | `lib/axios.ts` + per-feature `api/*.ts` (functional) — the `AppAPI` class methods split into per-resource functional modules |
| `api/Album.ts` (types) | `Album` -> `features/library/types.ts`; `AlbumDetail` -> `features/album/types.ts` |
| `api/Song.ts` (types) | `Song` -> `features/library/types.ts` |
| `api/Video.ts` (types) | `Video`, `IVideoChapter`, `isVideo` -> `features/library/types.ts` |
| `api/Playlist.ts` (types) | `Playlist`, `PlaylistDetail` -> `features/playlist/types.ts` |
| `components/types.ts` | split -> per-feature `types.ts`; `Host`/`ListFilesResult`/`NewHostState` -> `features/hosts/types.ts`; `SearchResult` -> `types/shared.ts` |
| `components/Sidebar.tsx` | `components/layout/Sidebar.tsx` |
| `components/TopNavBar.tsx` | `components/layout/TopNavBar.tsx` |
| `components/SearchDropdown.tsx` | `components/search/SearchDropdown.tsx` |
| `components/view/*` | `components/view/*` |
| `components/media/*` | `components/media/*` |
| `components/dialogs/ManageHostsDialog.tsx` | `features/hosts/components/ManageHostsDialog.tsx` |
| `components/dialogs/AddHostDialog.tsx` | `features/hosts/components/AddHostDialog.tsx` |
| `components/dialogs/CreatePlaylistDialog.tsx` | `features/playlist/components/CreatePlaylistDialog.tsx` |
| `components/dialogs/AddToPlaylistDialog.tsx` | `features/playlist/components/AddToPlaylistDialog.tsx` |
| `views/home/Home.tsx` | `features/library/views/Home.tsx` |
| `views/songs/SongList.tsx` | `features/library/components/SongList.tsx` |
| `views/videos/VideoList.tsx` | `features/library/components/VideoList.tsx` |
| `views/albums/AlbumList.tsx` | `features/library/components/AlbumList.tsx` |
| `views/album/AlbumView.tsx` | `features/album/components/AlbumView.tsx` |
| `views/album/AlbumInfo.tsx` | `features/album/components/AlbumInfo.tsx` |
| `views/album/AlbumControlButton.tsx` | `features/album/components/AlbumControlButton.tsx` |
| `views/album/SongListTable.tsx` | `features/album/components/SongListTable.tsx` |
| `views/album/VideoList.tsx` | `features/album/components/VideoList.tsx` |
| `views/artist/ArtistView.tsx` | `features/artist/components/ArtistView.tsx` |
| `views/playlist/PlaylistView.tsx` | `features/playlist/components/PlaylistView.tsx` |
| `views/playlists/PlaylistList.tsx` | `features/playlist/components/PlaylistList.tsx` |
| `views/search/SearchResults.tsx` | `features/search/components/SearchResults.tsx` |
| `views/player/MPlayerUI.tsx` | `features/player/components/MPlayerUI.tsx` |
| `views/player/MobilePlayerUI.tsx` | `features/player/components/MobilePlayerUI.tsx` |
| `views/player/FloatingQueueList.tsx` | `features/player/components/FloatingQueueList.tsx` |
| `views/player/ControlButton.tsx` | `features/player/components/ControlButton.tsx` |
| `views/player/PlayingSlider.tsx` | `features/player/components/PlayingSlider.tsx` |
| `views/player/SongInfo.tsx` | `features/player/components/SongInfo.tsx` |
| `views/player/SongBitDepth.tsx` | `features/player/components/SongBitDepth.tsx` |
| `views/player/VolumeController.tsx` | `features/player/components/VolumeController.tsx` |
| `views/player/player.css` | `features/player/components/player.css` |
| `store/store.ts` | `app/store.ts` |
| `store/hook.ts` | `app/hooks.ts` |
| `store/player/*` | `features/player/store/*` |
| `store/thunks/*` | `features/player/thunks/*` |
| `contexts/PlaylistRefreshContext.tsx` | **deleted** — replaced by React Query `invalidateQueries(['playlists'])` |
| `utils/*` | `utils/*` |

## Per-Feature Template

Every `features/<name>/` follows the same shape. Only `player` has `thunks/` and `store/` because it is the only stateful domain today.

```
features/<name>/
├── api/          # pure async functions, return typed data
├── components/   # feature-specific UI
├── hooks/        # useXxx React Query hooks (or local state hooks)
├── types.ts      # feature-local types
└── index.ts      # public API: re-exports the components/hooks other features need
```

**Public-API rule.** Features import each other ONLY through `index.ts`. `features/player/` may `import { SongCard } from '@features/library'` but never reaches into `features/library/components/SongCard.tsx` directly. Same for `features/album` importing from `features/library`. This is what stops domain bleed.

Type ownership follows domain ownership: `Song`, `Video`, and `Album` live in `features/library/types.ts` (library is the catalog domain). `features/playlist/` and `features/album/` re-use those types via `import type { Song } from '@features/library'`. `types/shared.ts` is reserved for types that span features and have no single owner (e.g., `SearchResult`).

## `app/` Composition

### `main.tsx` (entry)

```tsx
ReactDOM.createRoot(...).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

### `app/providers.tsx`

```tsx
export const Providers = ({ children }) => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)
```

### `app/App.tsx` (thin)

```tsx
export default function App() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
```

### `app/AppShell.tsx` (layout)

```tsx
export function AppShell() {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <MainContent>
        <Outlet />
      </MainContent>
      <TopNavBar />
      <Player />
      <ManageHostsDialog />
      <AddHostDialog />
      <CreatePlaylistDialog />
    </Box>
  )
}
```

Dialog open/close state lives in `AppShell` via local `useState` for now. The dialog components own their internal state. When a feature grows enough that dialog orchestration becomes complex, those move into a `useDialog` hook or per-feature state.

### `app/router.tsx` (lazy per feature)

```ts
export const router = createHashRouter([
  {
    element: <AppShell />,   // layout route
    children: [
      { path: "/",           lazy: () => import("@features/library").then(m => ({ Component: m.Home })) },
      { path: "/albums",     lazy: () => import("@features/library").then(m => ({ Component: m.Albums })) },
      { path: "/songs",      lazy: () => import("@features/library").then(m => ({ Component: m.Songs })) },
      { path: "/videos",     lazy: () => import("@features/library").then(m => ({ Component: m.Videos })) },
      { path: "/album/:id",  lazy: () => import("@features/album").then(m => ({ Component: m.AlbumView })) },
      { path: "/artist/:name", lazy: () => import("@features/artist").then(m => ({ Component: m.ArtistView })) },
      { path: "/search",     lazy: () => import("@features/search").then(m => ({ Component: m.SearchResults })) },
      { path: "/playlists",  lazy: () => import("@features/playlist").then(m => ({ Component: m.Playlists })) },
      { path: "/playlist/:id", lazy: () => import("@features/playlist").then(m => ({ Component: m.PlaylistView })) },
    ],
  },
])
```

`MainContent` wraps the `<Outlet />` in `<Suspense fallback={<LoadingFallback />}>`.

## Data Flow with TanStack Query

`lib/axios.ts` exports a configured axios instance. The `baseURL` setup (including the `window.electronAPI.getPort()` flow) is preserved verbatim from `api/api.ts:25-37`.

Per-feature `api/` modules are thin async functions:

```ts
// features/hosts/api/hosts.ts
export const listHosts = () =>
  axios.get<Host[]>("/hosts").then(r => r.data)

export const createHost = (data: NewHost) =>
  axios.post<string>("/hosts", data).then(r => r.data)

export const deleteHost = (id: string) =>
  axios.delete(`/hosts/${id}`).then(() => undefined)

export const listHostFiles = (hostId: string) =>
  axios.get<ListFilesResult>(`/hosts/${hostId}/files`).then(r => r.data)
```

`features/hosts/hooks/useHosts.ts` is the React Query hook consumed by `AppShell` and the dialog:

```ts
import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { deleteHost, listHosts } from "@features/hosts/api/hosts"

export const hostsKeys = { all: ["hosts"] as const }

export const useHosts = () =>
  useQuery({ queryKey: hostsKeys.all, queryFn: listHosts })

export const useDeleteHost = () =>
  useMutation({
    mutationFn: deleteHost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostsKeys.all }),
  })
```

The host logic in `App.tsx` (`useState` for hosts, `useEffect` for load, `useState` for `fileListResults`, `handleDeleteHost`, `handleAddHost`, `triggerListFiles`, `newHost` state machine) is replaced by `useHosts()` + `useDeleteHost()` + `useCreateHost()` + `useHostFiles()`. This removes ~80 lines of state management from `App.tsx`.

Same pattern for playlists: `useCreatePlaylist` invalidates `['playlists']`, the `playlistRefreshKey` and `PlaylistRefreshContext` are deleted.

## Cross-Cutting Decisions

- **Path aliases:** the existing `@renderer` alias is preserved and narrowed. New aliases added in `tsconfig.web.json` (`paths`) and `vite.config.ts` (`resolve.alias`):
  - `@renderer` -> `src/renderer/src` (existing, kept for the few `@renderer/types` etc. cases)
  - `@app` -> `src/renderer/src/app`
  - `@components` -> `src/renderer/src/components`
  - `@features` -> `src/renderer/src/features`
  - `@hooks` -> `src/renderer/src/hooks`
  - `@lib` -> `src/renderer/src/lib`
  - `@utils` -> `src/renderer/src/utils`
  - `@types` is intentionally not aliased (would conflict with DefinitelyTyped packages like `@types/node`); use `@renderer/types` for the one file in `types/`.
  - All code examples in this spec use the short form (`@features/player`).
- **Dialogs:** co-located with their feature (`features/hosts/components/ManageHostsDialog.tsx`), not in a shared `dialogs/` bucket.
- **`PlaylistRefreshContext`:** deleted. React Query invalidation is the refresh mechanism.
- **Top-level `app/store.ts`:** created for the Redux store (moved from `store/store.ts`), keeping room for future non-player slices. `store/hook.ts` moves to `app/hooks.ts`.
- **`components/types.ts`:** split. `Host`/`ListFilesResult`/`NewHostState` -> `features/hosts/types.ts`; `SearchResult` -> `types/shared.ts`.
- **`PlayShuffleActions`:** during step 7 (library), review whether this is used only in album/playlist contexts. If so, move to `features/album/components/` and `features/playlist/components/` as needed; if used in both, leave in `components/view/`.

## Migration Order (scaffolding-first, one feature at a time)

Each step is a separate commit. The app must build, type-check, and pass relevant tests at the end of every step.

1. **Setup**
   - Add `@tanstack/react-query` dependency (not present today; verify the latest stable v5 supports React 18.3)
   - Add path aliases to `tsconfig.web.json` and `vite.config.ts` (see Cross-Cutting Decisions)
   - Create empty `app/`, `features/`, `lib/`, `types/` folders
   - No file moves yet
2. **`app/` shell scaffolding**
   - Create `app/AppShell.tsx`, `app/router.tsx`, `app/providers.tsx`, `app/theme.ts`, `app/store.ts`, `app/hooks.ts`
   - Wire `main.tsx` to use `app/App.tsx` (a passthrough for now)
   - Verify the app still runs
3. **Player feature**
   - Create `features/player/` with all player components, hooks, store, thunks, types
   - Add `features/player/components/Player.tsx` (single root owning desktop + mobile + queue + positioning + mobile toggle)
   - Replace the three player pieces in the old `App.tsx` with `<Player />`
   - `App.tsx` shrinks to ~200 lines
4. **TanStack Query bootstrap**
   - `lib/queryClient.ts` with `QueryClient` + `queryClient` singleton export
   - Wire `QueryClientProvider` in `main.tsx`
   - Convert ONE piece of state (hosts) end-to-end as the pattern probe: `listHosts` -> `useHosts` -> `ManageHostsDialog` consumes the hook
5. **Hosts feature**
   - Move dialogs, types, `useHosts`/`useDeleteHost`/`useCreateHost`/`useHostFiles` hooks into `features/hosts/`
   - Remove host state from `App.tsx`; `App.tsx` shrinks to ~100 lines
   - E2E test for Manage Hosts dialog passes
6. **Playlist feature**
   - Move playlists, dialogs, types, hooks into `features/playlist/`
   - Delete `contexts/PlaylistRefreshContext.tsx`
   - Replace `playlistRefreshKey` with `invalidateQueries(['playlists'])`
   - `App.tsx` shrinks to ~50 lines
   - E2E test for Create Playlist dialog passes
7. **Library feature**
   - Move `views/home`, `views/songs`, `views/videos`, `views/albums` into `features/library/`
   - Route uses lazy import for `features/library`
   - Review `PlayShuffleActions` usage; relocate if feature-specific
8. **Album feature**
   - Move `views/album/*` (with all its components) into `features/album/`
   - Lazy import
9. **Search and Artist features**
   - Move `views/search` and `views/artist` into their features
   - Lazy imports
10. **Final cleanup**
    - Old `App.tsx` deleted; `app/App.tsx` is the only entry composition
    - Old `views/`, `components/dialogs/`, `store/`, `api/`, `contexts/` folders deleted
    - Add `LoadingFallback` skeleton and `ErrorBoundary`
    - Verify chunk splitting
    - Update `docs/implement_design.md` with the new structure
    - Full E2E suite passes
11. **Polish**
    - Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`
    - Confirm no dead imports or stale references
    - Update `AGENTS.md` if any project-structure descriptions are out of date

Rollback: at any step, the previous commit is the rollback point. No step spans more than one feature.

## Testing Strategy

- **Unit tests:** continue the `*.test.ts` co-located pattern. New `features/<name>/hooks/useXxx.test.ts` for React Query hooks using `@testing-library/react`'s `renderHook` with a test `QueryClient` from `lib/queryClient.ts`.
- **E2E tests:** `e2e/gui.spec.ts` covers the major user flows. After each migration step that touches user-visible behavior (steps 3, 5, 6, 7, 8, 9), run the relevant E2E spec. Full E2E suite only at the end (step 11).
- **Type safety:** `pnpm typecheck` after every step. Strict mode stays on; no `any` introduced.
- **Lint:** `pnpm lint` after every step.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| The player is the most-touched UI; extracting it first might surface unexpected dependencies | Step 3 includes an import-audit. Anything from `views/player/*` still needing imports from outside the player folder is a smell to address before step 4 |
| React Query adds ~13kb gz to the bundle | Offset by lazy-loaded per-feature chunks. Net bundle for cold start is smaller |
| The 281-line `App.tsx` extraction is the highest-value, highest-risk step | Steps 3 (player) and 4 (TanStack Query probe with hosts) each remove independent chunks. Step 5 is the first step that meaningfully shrinks `App.tsx`; if anything is going wrong we will know by then |
| Import-path renames touch every file | Path aliases are added in step 1; the migration is per-feature, so each commit's diff is bounded |
| Lazy routes add a transient loading state during route transitions | `LoadingFallback` skeleton is part of step 10; during the refactor, the existing `Box` placeholders are acceptable |

## Open Questions Resolved During Design

- **Public API strictness:** index.ts barrel rule adopted. Justification: prevents cross-feature coupling; cheap to enforce; matches Bulletproof React.
- **Migration order:** player first because it is the most isolated and establishes the feature pattern. Hosts second because it is the smallest end-to-end probe for the React Query pattern.
- **`app/store.ts` location:** top-level rather than inside the player feature. Justification: future-proofs for non-player slices, keeps the player feature folder focused on its UI/hooks.

## Open Questions (still to confirm during implementation)

- Exact contents of `LoadingFallback` (skeleton dimensions, animation)
- Whether `ErrorBoundary` should wrap the whole shell or just the `<Outlet />` slot
- Whether `AddToPlaylistDialog` (consumed from songs/albums views) belongs in `features/playlist/components/` or in a more general `features/playlist/components/AddToPlaylistDialog.tsx` (same location, but worth confirming the import path during the playlist step)
