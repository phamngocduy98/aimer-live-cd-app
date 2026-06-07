# Renderer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/renderer/` into a feature-based layout with `app/` shell, per-feature `api/components/hooks/types/index.ts`, and React Query for server state, while preserving all current behavior and keeping the app building, type-checking, and passing E2E at every step.

**Architecture:** The current `App.tsx` (281 lines) and monolithic `api/api.ts` (168 lines) are split across feature folders (`player`, `library`, `album`, `playlist`, `search`, `artist`, `hosts`). The app shell becomes `app/AppShell.tsx` with `Sidebar` + `TopNavBar` + `<Outlet />` + `<Player />` + dialogs. Server state moves to TanStack Query; the player Redux slice and thunks move into `features/player/store/` and `features/player/thunks/`.

**Tech Stack:** React 18, Vite 6, TypeScript 5, Redux Toolkit 2, React Router 6, Material-UI 5, axios, TanStack Query 5 (new dependency).

**Spec:** `docs/superpowers/specs/2026-06-06-renderer-refactor-design.md`

---

## Conventions for This Plan

- All work happens on the current branch unless a worktree is set up via `superpowers:using-git-worktrees`.
- Every task ends with `pnpm typecheck:web` passing (plus the task-specific verifications).
- Path aliases `@app`, `@components`, `@features`, `@hooks`, `@lib`, `@utils` are introduced in Task 1 and used in code from Task 3 onwards. `@renderer` (existing) is preserved.
- File moves use `git mv` to preserve history.
- Each task is one commit. Commit messages follow the existing style (e.g. `Extract shared media and view components for library pages.`).
- When a task says "verify the app runs", the verification is: `pnpm dev:web` starts, the home page renders at `http://localhost:5173`, and the dev server shows no console errors. (Standalone web, no Electron required for the refactor verification.)

---

## Task 1: Setup — Add React Query, path aliases, and empty folders

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.web.json`
- Modify: `src/renderer/vite.config.ts`
- Create: `src/renderer/src/app/.gitkeep`
- Create: `src/renderer/src/features/.gitkeep`
- Create: `src/renderer/src/lib/.gitkeep`
- Create: `src/renderer/src/types/.gitkeep`

- [ ] **Step 1: Add the `@tanstack/react-query` dependency**

Run:
```bash
pnpm add @tanstack/react-query
```

Verify: `package.json` `dependencies` now contains `"@tanstack/react-query": "^5.x.x"` and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Add narrower path aliases**

Edit `tsconfig.web.json` `compilerOptions.paths` (keep the existing `@renderer` entry, add the new ones):

```json
"paths": {
  "@renderer/*": ["src/renderer/src/*"],
  "@app/*":       ["src/renderer/src/app/*"],
  "@components/*":["src/renderer/src/components/*"],
  "@features/*":  ["src/renderer/src/features/*"],
  "@hooks/*":     ["src/renderer/src/hooks/*"],
  "@lib/*":       ["src/renderer/src/lib/*"],
  "@utils/*":     ["src/renderer/src/utils/*"]
}
```

Edit `src/renderer/vite.config.ts` `resolve.alias` to mirror (keep the existing `@renderer` entry, add the new ones):

```ts
resolve: {
  alias: {
    "@renderer":    resolve(__dirname, "src"),
    "@app":         resolve(__dirname, "src/app"),
    "@components":  resolve(__dirname, "src/components"),
    "@features":    resolve(__dirname, "src/features"),
    "@hooks":       resolve(__dirname, "src/hooks"),
    "@lib":         resolve(__dirname, "src/lib"),
    "@utils":       resolve(__dirname, "src/utils")
  }
}
```

- [ ] **Step 3: Create the empty target folders**

Run:
```bash
mkdir -p src/renderer/src/app src/renderer/src/features src/renderer/src/lib src/renderer/src/types
```

In PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path src/renderer/src/app,src/renderer/src/features,src/renderer/src/lib,src/renderer/src/types | Out-Null
```

Add `.gitkeep` to each (so empty folders survive the commit):
```bash
touch src/renderer/src/app/.gitkeep src/renderer/src/features/.gitkeep src/renderer/src/lib/.gitkeep src/renderer/src/types/.gitkeep
```

- [ ] **Step 4: Verify typecheck still passes**

Run: `pnpm typecheck:web`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.web.json src/renderer/vite.config.ts src/renderer/src/app src/renderer/src/features src/renderer/src/lib src/renderer/src/types
git commit -m "Add @tanstack/react-query and path aliases for renderer refactor"
```

---

## Task 2: Scaffold `app/` shell (no behavior change)

**Files:**
- Create: `src/renderer/src/app/theme.ts`
- Create: `src/renderer/src/app/store.ts`
- Create: `src/renderer/src/app/hooks.ts`
- Create: `src/renderer/src/app/providers.tsx`
- Create: `src/renderer/src/app/router.tsx`
- Create: `src/renderer/src/app/App.tsx`
- Create: `src/renderer/src/app/AppShell.tsx`
- Modify: `src/renderer/src/main.tsx`

- [ ] **Step 1: Create `app/theme.ts`**

Create `src/renderer/src/app/theme.ts`:
```ts
import { createTheme } from "@mui/material"

export const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
})
```

- [ ] **Step 2: Create `app/store.ts` and `app/hooks.ts` (move from `store/`)**

Create `src/renderer/src/app/store.ts` with the exact contents of the current `src/renderer/src/store/store.ts`:
```ts
import { configureStore } from "@reduxjs/toolkit"
import playerGuiReducer from "../../store/player/playerGuiSlice"
import playerReducer from "../../store/player/playerSlice"
import playerVideoControlReducer from "../../store/player/playerVideoControl"

export const store = configureStore({
  reducer: {
    playerGui: playerGuiReducer,
    player: playerReducer,
    playerVideoControl: playerVideoControlReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
```

Create `src/renderer/src/app/hooks.ts` with the exact contents of the current `src/renderer/src/store/hook.ts`, with import path updated:
```ts
import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector, useStore } from "react-redux"
import type { AppDispatch, AppStore, RootState } from "./store"

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppStore: () => AppStore = useStore
```

(The old `store/store.ts` and `store/hook.ts` are removed in Task 3 once nothing else imports them.)

- [ ] **Step 3: Create `app/providers.tsx`**

Create `src/renderer/src/app/providers.tsx`:
```tsx
import { ReactNode } from "react"
import { CssBaseline, ThemeProvider } from "@mui/material"
import { darkTheme } from "./theme"

export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)
```

- [ ] **Step 4: Create `app/router.tsx` (initially still eager imports)**

Create `src/renderer/src/app/router.tsx` with the same contents as the current `src/renderer/src/router.tsx`, but importing from the new locations:
```tsx
import { createHashRouter } from "react-router-dom"
import { AlbumView } from "../../views/album/AlbumView"
import { Albums } from "../../views/albums/AlbumList"
import { ArtistView } from "../../views/artist/ArtistView"
import { Home } from "../../views/home/Home"
import { Songs } from "../../views/songs/SongList"
import { Videos } from "../../views/videos/VideoList"
import { SearchResults } from "../../views/search/SearchResults"
import { Playlists } from "../../views/playlists/PlaylistList"
import { PlaylistView } from "../../views/playlist/PlaylistView"

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
```

(The old `src/renderer/src/router.tsx` is removed in Task 10 once nothing else imports it.)

- [ ] **Step 5: Create `app/App.tsx` and `app/AppShell.tsx` (passthrough for now)**

Create `src/renderer/src/app/App.tsx`:
```tsx
import { Providers } from "./providers"
import { AppShell } from "./AppShell"

export default function App() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
```

Create `src/renderer/src/app/AppShell.tsx`. For this step, it is a thin wrapper that renders the existing App body to keep the app running. It will be replaced in Task 3:
```tsx
import App from "../App"

export function AppShell() {
  return <App />
}
```

- [ ] **Step 6: Update `main.tsx` to use `app/App.tsx`**

Replace the contents of `src/renderer/src/main.tsx`:
```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./index.css"
import { Provider } from "react-redux"
import { store } from "./app/store"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
```

- [ ] **Step 7: Verify typecheck and dev server**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm dev:web` and load `http://localhost:5173`. Confirm the home page renders. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/app src/renderer/src/main.tsx
git commit -m "Scaffold app/ shell with passthrough AppShell for renderer refactor"
```

---

## Task 3: Extract the player feature

**Files:**
- Create: `src/renderer/src/features/player/store/playerSlice.ts` (moved)
- Create: `src/renderer/src/features/player/store/playerGuiSlice.ts` (moved)
- Create: `src/renderer/src/features/player/store/playerVideoControl.ts` (moved)
- Create: `src/renderer/src/features/player/thunks/onNextTrack.ts` (moved)
- Create: `src/renderer/src/features/player/thunks/onPrevTrack.ts` (moved)
- Create: `src/renderer/src/features/player/thunks/onVideoPosition.ts` (moved)
- Create: `src/renderer/src/features/player/components/MPlayerUI.tsx` (moved)
- Create: `src/renderer/src/features/player/components/MobilePlayerUI.tsx` (moved)
- Create: `src/renderer/src/features/player/components/FloatingQueueList.tsx` (moved)
- Create: `src/renderer/src/features/player/components/ControlButton.tsx` (moved)
- Create: `src/renderer/src/features/player/components/PlayingSlider.tsx` (moved)
- Create: `src/renderer/src/features/player/components/SongInfo.tsx` (moved)
- Create: `src/renderer/src/features/player/components/SongBitDepth.tsx` (moved)
- Create: `src/renderer/src/features/player/components/VolumeController.tsx` (moved)
- Create: `src/renderer/src/features/player/components/player.css` (moved)
- Create: `src/renderer/src/features/player/components/Player.tsx`
- Create: `src/renderer/src/features/player/index.ts`
- Delete: `src/renderer/src/store/` (after this task)
- Delete: `src/renderer/src/views/player/` (after this task)
- Modify: `src/renderer/src/app/store.ts` (update reducer import paths)
- Modify: `src/renderer/src/app/AppShell.tsx` (drop the passthrough; render `<Player />` directly)

- [ ] **Step 1: Move the player store slices and update their imports**

Run:
```bash
git mv src/renderer/src/store/player/playerSlice.ts          src/renderer/src/features/player/store/playerSlice.ts
git mv src/renderer/src/store/player/playerGuiSlice.ts       src/renderer/src/features/player/store/playerGuiSlice.ts
git mv src/renderer/src/store/player/playerVideoControl.ts   src/renderer/src/features/player/store/playerVideoControl.ts
```

In `src/renderer/src/features/player/store/playerSlice.ts`, update the three relative imports at the top. Change:
```ts
import { Song } from "../../api/Song";
import { shuffleArray } from "../../utils/shuffleArray";
import { isVideo, IVideoChapter, Video } from "../../api/Video";
```
to use the new locations. The `Song`/`Video`/`isVideo`/`IVideoChapter` types live in `@features/library/types` (in the future), but those types do not exist yet in this task. To keep the move atomic, use the existing API type files via longer relative paths until Task 7:
```ts
import { Song } from "../../../api/Song"
import { shuffleArray } from "../../../utils/shuffleArray"
import { isVideo, IVideoChapter, Video } from "../../../api/Video"
```

(Verification: the file moved to `features/player/store/`; relative paths are now `../../../api/...`.)

- [ ] **Step 2: Move the thunks and update their imports**

Run:
```bash
git mv src/renderer/src/store/thunks/onNextTrack.ts      src/renderer/src/features/player/thunks/onNextTrack.ts
git mv src/renderer/src/store/thunks/onPrevTrack.ts      src/renderer/src/features/player/thunks/onPrevTrack.ts
git mv src/renderer/src/store/thunks/onVideoPosition.ts  src/renderer/src/features/player/thunks/onVideoPosition.ts
```

In each moved thunk, the imports `../../api/...` and `../player/...` and `../store` are now wrong. Update them:

`onNextTrack.ts`:
```ts
import { ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import { isVideo } from "../../../api/Video"
import { nextTrack, setCurrentChapter } from "../store/playerSlice"
import { videoOnProgress, videoOnSeek } from "../store/playerVideoControl"
import type { RootState } from "@app/store"
import { store } from "@app/store"

export const onNextTrack =
  (
    props: { skip?: number; isUser?: boolean } | undefined
  ): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    const skip = props?.skip ?? 0
    const isUser = props?.isUser ?? false
    const player = store.getState().player
    if (skip === 0 && isUser && player.chapters.length > 0 && player.currentChapterIdx != null) {
      const nextChapter = player.chapters[player.currentChapterIdx + 1]
      if (nextChapter != null) {
        dispatch(videoOnSeek({ position: nextChapter.time }))
        return
      }
    }
    dispatch(nextTrack(props))
  }
```

`onPrevTrack.ts`:
```ts
import { ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import { isVideo } from "../../../api/Video"
import { prevTrack, setCurrentChapter } from "../store/playerSlice"
import { videoOnProgress, videoOnSeek } from "../store/playerVideoControl"
import type { RootState } from "@app/store"
import { store } from "@app/store"

export const onPrevTrack =
  (
    props: { skip?: number } | undefined = undefined
  ): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    const skip = props?.skip ?? 0
    const player = store.getState().player
    if (skip === 0 && player.chapters.length > 0 && player.currentChapterIdx != null) {
      const prevChapter = player.chapters[player.currentChapterIdx - 1]
      if (prevChapter != null) {
        dispatch(videoOnSeek({ position: prevChapter.time }))
        return
      }
    }
    dispatch(prevTrack(props))
  }
```

`onVideoPosition.ts`:
```ts
import { ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import { isVideo } from "../../../api/Video"
import { setCurrentChapter } from "../store/playerSlice"
import { videoOnProgress } from "../store/playerVideoControl"
import type { RootState } from "@app/store"
import { store } from "@app/store"

export const onVideoPosition =
  (position: number): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    dispatch(videoOnProgress({ position }))
    const { player, playerVideoControl } = store.getState()
    if (player.playingTrack && isVideo(player.playingTrack) && player.chapters.length > 0) {
      let idx = player.playingTrack.chapters.findIndex(
        (c) => c.time > playerVideoControl.videoPosition
      )
      if (idx === -1) idx = player.chapters.length
      const nextChapterTime =
        player.playingTrack.chapters[idx]?.time ?? player.playingTrack.duration
      const currentChapterIdx = idx - 1
      const currentChapter = player.playingTrack.chapters[currentChapterIdx]
      dispatch(
        setCurrentChapter({
          chapterIdx: currentChapterIdx,
          duration: currentChapter ? nextChapterTime - currentChapter.time : 0
        })
      )
    }
  }
```

(Note: renamed `onVideoPostion` -> `onVideoPosition` to fix the typo. Search-and-replace any callers — but in this codebase no one imports the misspelled name yet, so this is safe.)

- [ ] **Step 3: Update `app/store.ts` to import the slices from their new location**

Replace `src/renderer/src/app/store.ts`:
```ts
import { configureStore } from "@reduxjs/toolkit"
import playerGuiReducer from "@features/player/store/playerGuiSlice"
import playerReducer from "@features/player/store/playerSlice"
import playerVideoControlReducer from "@features/player/store/playerVideoControl"

export const store = configureStore({
  reducer: {
    playerGui: playerGuiReducer,
    player: playerReducer,
    playerVideoControl: playerVideoControlReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
```

- [ ] **Step 4: Move the player components and update their imports**

Run:
```bash
git mv src/renderer/src/views/player/MPlayerUI.tsx          src/renderer/src/features/player/components/MPlayerUI.tsx
git mv src/renderer/src/views/player/MobilePlayerUI.tsx     src/renderer/src/features/player/components/MobilePlayerUI.tsx
git mv src/renderer/src/views/player/FloatingQueueList.tsx  src/renderer/src/features/player/components/FloatingQueueList.tsx
git mv src/renderer/src/views/player/ControlButton.tsx      src/renderer/src/features/player/components/ControlButton.tsx
git mv src/renderer/src/views/player/PlayingSlider.tsx      src/renderer/src/features/player/components/PlayingSlider.tsx
git mv src/renderer/src/views/player/SongInfo.tsx           src/renderer/src/features/player/components/SongInfo.tsx
git mv src/renderer/src/views/player/SongBitDepth.tsx       src/renderer/src/features/player/components/SongBitDepth.tsx
git mv src/renderer/src/views/player/VolumeController.tsx   src/renderer/src/features/player/components/VolumeController.tsx
git mv src/renderer/src/views/player/player.css            src/renderer/src/features/player/components/player.css
```

In each moved file, update imports. The pattern is:
- `../../api/...` (for `Song`, `Video`, `Album`, `IVideoChapter`, `isVideo`, `Host`) -> use the alias form: `@features/library/types` after Task 7, but for now use `../../../api/...` (going up three levels: `components/` -> `player/` -> `features/` -> `src/renderer/src/`).
- `../../store/...` -> use `@app/store` (for the store) and `@features/player/store/...` (for slices). Or relative `../store/...` since the moved file is in `features/player/components/`.
- `../../utils/...` -> use `@utils/...` or relative `../../../utils/...`.
- `../../components/...` (for `SearchDropdown`, `SongCard`, etc.) -> use `@components/...` or relative.
- `../../views/...` (for sibling views) -> use `@features/<other>/...` or relative.
- `../player.css` -> stays as `./player.css` (same directory).
- `../MobilePlayerUI` -> stays as `./MobilePlayerUI` (same directory).

For each file, open it, find every `../../` import, and rewrite. The grep for finding them is:

```bash
grep -rn "from \"\.\./" src/renderer/src/features/player/components/
```

Use the alias form (`@app/...`, `@features/...`, `@utils/...`, `@components/...`) where possible. For `player.css` (which is a CSS import), use `./player.css`.

Specifically, update each component file. The known imports across the 8 player components are roughly:

`MPlayerUI.tsx` imports — update `../../store/...` to `@features/player/store/...` (or relative `../store/...`); `../../api/...` to `../../../api/...` for now; `../../components/...` to `@components/...`; `../../utils/...` to `@utils/...`; `../player.css` to `./player.css`; `../MobilePlayerUI` to `./MobilePlayerUI`; `./player.css` stays.

`MobilePlayerUI.tsx` imports — same pattern.

`FloatingQueueList.tsx`, `ControlButton.tsx`, `PlayingSlider.tsx`, `SongInfo.tsx`, `SongBitDepth.tsx`, `VolumeController.tsx` — same pattern.

To keep this step concrete, here is the rule: in every file under `src/renderer/src/features/player/components/`, replace:
- `from "../../api/...` -> `from "../../../api/...`
- `from "../../store/...` -> `from "../store/...`
- `from "../../components/...` -> `from "@components/...`
- `from "../../utils/...` -> `from "@utils/...`
- `from "../../views/...` -> `from "@features/..."` (after those features are created in later tasks; for now they are still in `../../views/...`, so keep as `../../../views/...` — but the player doesn't import from other views today, so this case is unlikely)
- `from "../player.css"` -> `from "./player.css"`
- `from "../MPlayerUI"` etc. (sibling) -> `from "./MPlayerUI"` etc.
- `from "../App"` (only in old `App.tsx`; not in player files)
- `from "../../hooks/..."` (none today) -> `from "@hooks/..."`
- `from "../../contexts/..."` (none in player) -> `from "@app/..."` or relative

The exact mapping for each file should be applied file by file. After each file, run `pnpm typecheck:web` to catch any missed import.

- [ ] **Step 5: Create the `Player.tsx` root component**

Create `src/renderer/src/features/player/components/Player.tsx`:
```tsx
import { Box } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@app/hooks"
import { toggleView } from "../store/playerGuiSlice"
import { MPlayerUI } from "./MPlayerUI"
import { MobilePlayer } from "./MobilePlayerUI"
import { FloatingQueueList } from "./FloatingQueueList"

export function Player() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer)
  const dispatch = useAppDispatch()

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: showMobilePlayer ? "80px" : 0, sm: 0 },
          left: 0,
          right: 0,
          zIndex: 1202,
          userSelect: "none"
        }}
        onClick={() => dispatch(toggleView("mobilePlayer"))}
      >
        <MPlayerUI />
      </Box>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          transform: `translateY(${showMobilePlayer ? "0" : "100dvh"})`,
          transition: "transform .6s ease"
        }}
      >
        <MobilePlayer />
      </div>

      <FloatingQueueList />
    </>
  )
}
```

- [ ] **Step 6: Create `features/player/index.ts`**

Create `src/renderer/src/features/player/index.ts`:
```ts
export { Player } from "./components/Player"
```

- [ ] **Step 7: Replace the player pieces in `App.tsx` with `<Player />` and update App imports**

Open `src/renderer/src/App.tsx`. Remove the three player pieces (the `<Box ... onClick={...}><MPlayerUI /></Box>`, the `<div ...><MobilePlayer /></div>`, and the `<FloatingQueueList />` at root). Replace them with:

```tsx
import { Player } from "@features/player"
// ...
<Player />
```

Remove the now-unused imports from `App.tsx`:
- `import { useAppDispatch, useAppSelector } from "./store/hook";` (the shell still uses them for other things, so keep `useAppSelector`; check each usage)
- `import { toggleView } from "./store/player/playerGuiSlice";` (no longer needed in App)
- `import MPlayerUI from "./views/player/MPlayerUI";` (no longer needed)
- `import { MobilePlayer } from "./views/player/MobilePlayerUI";` (no longer needed)

Specifically, the original `App.tsx` lines 222-250 (the three player pieces) become:
```tsx
<Player />
```

- [ ] **Step 8: Delete the empty old player folders**

Run:
```bash
rmdir src/renderer/src/views/player
rmdir src/renderer/src/store/player
rmdir src/renderer/src/store/thunks
rmdir src/renderer/src/store
```

(If `git rm` is preferred to track the deletion: `git rm -r src/renderer/src/views/player src/renderer/src/store`.)

- [ ] **Step 9: Verify typecheck and dev server**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm dev:web` and load `http://localhost:5173`. Confirm:
- The home page renders.
- The mobile and desktop player UIs render (MPlayerUI is the always-visible bottom bar; MobilePlayer is the slide-up panel).
- The mobile player toggle click works (clicking the bottom bar toggles the slide-up).
- The queue list (`FloatingQueueList`) opens and closes.

Stop the server.

- [ ] **Step 10: Commit**

```bash
git add -A src/renderer/src/features/player src/renderer/src/app src/renderer/src/App.tsx
git commit -m "Extract player feature into features/player with single Player root"
```

---

## Task 4: TanStack Query bootstrap and hosts pattern probe

**Files:**
- Create: `src/renderer/src/lib/axios.ts`
- Create: `src/renderer/src/lib/queryClient.ts`
- Create: `src/renderer/src/features/hosts/api/hosts.ts`
- Create: `src/renderer/src/features/hosts/types.ts`
- Create: `src/renderer/src/features/hosts/hooks/useHosts.test.ts` (TDD probe)
- Create: `src/renderer/src/features/hosts/hooks/useHosts.ts`
- Modify: `src/renderer/src/main.tsx`
- Modify: `src/renderer/src/App.tsx` (probe: switch host state to the hook)

- [ ] **Step 1: Create `lib/axios.ts`**

Create `src/renderer/src/lib/axios.ts`:
```ts
import axios from "axios"

export const apiClient = axios.create()

export function configureApiBaseUrl() {
  if (window.electronAPI) {
    window.electronAPI.getPort().then((port) => {
      apiClient.defaults.baseURL = `http://localhost:${port}/api`
    })
  } else {
    apiClient.defaults.baseURL = "/api"
  }
}
```

- [ ] **Step 2: Create `lib/queryClient.ts`**

Create `src/renderer/src/lib/queryClient.ts`:
```ts
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1
    }
  }
})
```

- [ ] **Step 3: Wire `QueryClientProvider` and `configureApiBaseUrl` in `main.tsx`**

Replace `src/renderer/src/main.tsx`:
```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./index.css"
import { Provider } from "react-redux"
import { store } from "./app/store"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { configureApiBaseUrl } from "@lib/axios"

configureApiBaseUrl()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 4: Verify typecheck passes after wiring**

Run: `pnpm typecheck:web`
Expected: no errors.

- [ ] **Step 5: Create `features/hosts/types.ts`**

Create `src/renderer/src/features/hosts/types.ts`:
```ts
import type { SelectChangeEvent } from "@mui/material/Select"

export interface Host {
  _id: string
  name: string
  provider: string
  path?: string
}

export interface ListFilesResult {
  loading: boolean
  available: boolean | null
  files: { fileName: string; parts: string; title: string; fileCount: number }[]
  error?: string
}

export interface NewHostState {
  host: string
  provider: string
  path: string
  ftpHost: string
  ftpPort: number
  ftpUsername: string
  ftpPassword: string
  ftpRoot: string
}
```

- [ ] **Step 6: Create `features/hosts/api/hosts.ts`**

Create `src/renderer/src/features/hosts/api/hosts.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Host, ListFilesResult } from "../types"

export const listHosts = async (): Promise<Host[]> => {
  const resp = await apiClient.get<Host[]>("/hosts")
  return resp.data
}

export const deleteHost = async (id: string): Promise<void> => {
  await apiClient.delete(`/hosts/${id}`)
}

export const listHostFiles = async (hostId: string): Promise<ListFilesResult> => {
  const resp = await apiClient.get<ListFilesResult>(`/hosts/${hostId}/files`)
  return resp.data
}

export interface NewHostPayload {
  host: string
  provider: string
  path?: string
  ftpCredential: {
    host: string
    port?: number
    username: string
    password: string
    secure?: boolean
  }
  ftpRoot: string
}

export const createHost = async (data: NewHostPayload): Promise<string> => {
  const resp = await apiClient.post<string>("/hosts", data)
  return resp.data
}
```

- [ ] **Step 7: Write the failing test for `useHosts` (TDD probe)**

Create `src/renderer/src/features/hosts/hooks/useHosts.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useHosts } from "./useHosts"

vi.mock("@lib/axios", () => ({
  apiClient: { get: vi.fn() }
}))

import { apiClient } from "@lib/axios"
import type { ReactNode } from "react"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useHosts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns hosts from the API", async () => {
    const mockHosts = [{ _id: "1", name: "h1", provider: "x" }]
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockHosts })

    const { result } = renderHook(() => useHosts(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockHosts)
  })
})
```

Run: `pnpm test -- features/hosts/hooks/useHosts.test.ts`
Expected: FAIL with "Cannot find module './useHosts'" or similar.

- [ ] **Step 8: Implement `useHosts` to make the test pass**

Create `src/renderer/src/features/hosts/hooks/useHosts.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listHosts } from "../api/hosts"

export const hostsKeys = { all: ["hosts"] as const }

export const useHosts = () =>
  useQuery({ queryKey: hostsKeys.all, queryFn: listHosts })
```

Run: `pnpm test -- features/hosts/hooks/useHosts.test.ts`
Expected: PASS.

- [ ] **Step 9: Wire `useHosts` into `App.tsx` as a probe (verify the pattern end-to-end)**

Open `src/renderer/src/App.tsx`. Replace:
- `const [hosts, setHosts] = useState<Host[]>([]);` with `const { data: hosts = [] } = useHosts();`
- Remove the `useEffect` block that calls `appAPI.getHosts()`.
- Add `import { useHosts } from "@features/hosts/hooks/useHosts";`

(The dialog component `ManageHostsDialog` still receives `hosts` as a prop. Delete-related state and the `handleDeleteHost` callback stay in `App.tsx` for now — those are converted in Task 5.)

- [ ] **Step 10: Verify typecheck, tests, and dev server**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm test -- features/hosts/hooks/useHosts.test.ts`
Expected: PASS.

Run: `pnpm dev:web`, open `http://localhost:5173`. Open the user menu and select Admin. Confirm the Admin dialog opens and the list of hosts is empty (or shows seeded E2E data). Stop the server.

- [ ] **Step 11: Commit**

```bash
git add -A src/renderer/src/lib src/renderer/src/main.tsx src/renderer/src/features/hosts src/renderer/src/App.tsx
git commit -m "Add TanStack Query bootstrap and hosts useHosts hook (pattern probe)"
```

---

## Task 5: Move the hosts feature into `features/hosts/`

**Files:**
- Create: `src/renderer/src/features/hosts/components/ManageHostsDialog.tsx` (moved from `components/dialogs/`)
- Create: `src/renderer/src/features/hosts/components/AddHostDialog.tsx` (moved)
- Create: `src/renderer/src/features/hosts/hooks/useDeleteHost.test.ts`
- Create: `src/renderer/src/features/hosts/hooks/useDeleteHost.ts`
- Create: `src/renderer/src/features/hosts/hooks/useCreateHost.test.ts`
- Create: `src/renderer/src/features/hosts/hooks/useCreateHost.ts`
- Create: `src/renderer/src/features/hosts/hooks/useHostFiles.test.ts`
- Create: `src/renderer/src/features/hosts/hooks/useHostFiles.ts`
- Create: `src/renderer/src/features/hosts/index.ts`
- Delete: `src/renderer/src/components/dialogs/ManageHostsDialog.tsx`
- Delete: `src/renderer/src/components/dialogs/AddHostDialog.tsx`
- Modify: `src/renderer/src/components/types.ts` (remove `Host`-related types — already done in Task 4; remove `ManageHostsDialogProps` and `AddHostDialogProps`)
- Modify: `src/renderer/src/App.tsx` (remove all host state and handlers; consume hooks)

- [ ] **Step 1: Move the dialog components**

Run:
```bash
git mv src/renderer/src/components/dialogs/ManageHostsDialog.tsx src/renderer/src/features/hosts/components/ManageHostsDialog.tsx
git mv src/renderer/src/components/dialogs/AddHostDialog.tsx     src/renderer/src/features/hosts/components/AddHostDialog.tsx
```

In each moved file, update imports:
- `from "../api/api"` (for `Host`) -> `from "../types"`
- `from "../types"` (for `ListFilesResult`, `NewHostState`, dialog props) -> update: dialog props are co-located with the dialog now, so move the props interfaces to the dialog file itself. Specifically, `ManageHostsDialogProps` and `AddHostDialogProps` move from `components/types.ts` to their respective dialog files.
- `from "../appAPI"` (none in dialogs) -> `from "@features/hosts/api/hosts"`
- `from "@mui/material/..."` stays.
- `from "../../api/api"` -> `from "@features/hosts/api/hosts"`
- `from "../../components/..."` -> `from "@components/..."`

Open each moved file and apply the above. After the moves, both dialogs should have their `Props` interface declared at the top of the file and the previous `components/types.ts` entries removed.

- [ ] **Step 2: Write the failing test for `useDeleteHost` (TDD)**

Create `src/renderer/src/features/hosts/hooks/useDeleteHost.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { delete: vi.fn() } }))
vi.mock("@lib/queryClient", () => ({ queryClient: new QueryClient() }))

import { apiClient } from "@lib/axios"
import { queryClient } from "@lib/queryClient"
import { useDeleteHost } from "./useDeleteHost"
import { hostsKeys } from "./useHosts"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useDeleteHost", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls the API and invalidates the hosts query", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    ;(apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({})

    const { result } = renderHook(() => useDeleteHost(), { wrapper: makeWrapper() })
    result.current.mutate("host-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.delete).toHaveBeenCalledWith("/hosts/host-1")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostsKeys.all })
  })
})
```

Run: `pnpm test -- features/hosts/hooks/useDeleteHost.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `useDeleteHost` to pass the test**

Create `src/renderer/src/features/hosts/hooks/useDeleteHost.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { deleteHost } from "../api/hosts"
import { hostsKeys } from "./useHosts"

export const useDeleteHost = () =>
  useMutation({
    mutationFn: (id: string) => deleteHost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostsKeys.all })
  })
```

Run: `pnpm test -- features/hosts/hooks/useDeleteHost.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing test for `useCreateHost`**

Create `src/renderer/src/features/hosts/hooks/useCreateHost.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { post: vi.fn() } }))
vi.mock("@lib/queryClient", () => ({ queryClient: new QueryClient() }))

import { apiClient } from "@lib/axios"
import { queryClient } from "@lib/queryClient"
import { useCreateHost } from "./useCreateHost"
import { hostsKeys } from "./useHosts"
import type { NewHostPayload } from "../api/hosts"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

const samplePayload: NewHostPayload = {
  host: "h",
  provider: "x",
  ftpCredential: { host: "f", username: "u", password: "p" },
  ftpRoot: "/"
}

describe("useCreateHost", () => {
  beforeEach(() => vi.clearAllMocks())

  it("posts the new host and invalidates the hosts query", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: "new-id" })

    const { result } = renderHook(() => useCreateHost(), { wrapper: makeWrapper() })
    result.current.mutate(samplePayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith("/hosts", samplePayload)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostsKeys.all })
  })
})
```

Run: `pnpm test -- features/hosts/hooks/useCreateHost.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement `useCreateHost`**

Create `src/renderer/src/features/hosts/hooks/useCreateHost.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { createHost, type NewHostPayload } from "../api/hosts"
import { hostsKeys } from "./useHosts"

export const useCreateHost = () =>
  useMutation({
    mutationFn: (data: NewHostPayload) => createHost(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostsKeys.all })
  })
```

Run: `pnpm test -- features/hosts/hooks/useCreateHost.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing test for `useHostFiles`**

Create `src/renderer/src/features/hosts/hooks/useHostFiles.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from "@lib/axios"
import { useHostFiles } from "./useHostFiles"
import type { ListFilesResult } from "../types"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useHostFiles", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns files for a host", async () => {
    const mock: ListFilesResult = {
      loading: false,
      available: true,
      files: [{ fileName: "f", parts: "1", title: "t", fileCount: 1 }]
    }
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mock })

    const { result } = renderHook(() => useHostFiles("host-1"), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mock)
    expect(apiClient.get).toHaveBeenCalledWith("/hosts/host-1/files")
  })
})
```

Run: `pnpm test -- features/hosts/hooks/useHostFiles.test.ts`
Expected: FAIL.

- [ ] **Step 7: Implement `useHostFiles`**

Create `src/renderer/src/features/hosts/hooks/useHostFiles.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listHostFiles } from "../api/hosts"

export const hostFilesKeys = {
  all: ["hostFiles"] as const,
  byHost: (hostId: string) => [...hostFilesKeys.all, hostId] as const
}

export const useHostFiles = (hostId: string) =>
  useQuery({
    queryKey: hostFilesKeys.byHost(hostId),
    queryFn: () => listHostFiles(hostId),
    enabled: Boolean(hostId)
  })
```

Run: `pnpm test -- features/hosts/hooks/useHostFiles.test.ts`
Expected: PASS.

- [ ] **Step 8: Update `ManageHostsDialog` to consume the hooks**

Open `src/renderer/src/features/hosts/components/ManageHostsDialog.tsx`. Replace the props-based callbacks with hook calls inside the component:
- Remove `hosts`, `isLoadingHosts`, `fileListResults`, `onDeleteHost`, `onListHostFiles` props.
- Inside the component, call `useHosts()`, `useDeleteHost()`, `useHostFiles(id)` per host row.
- Local state inside the dialog tracks which host's "List files" was clicked (an `expandedHostId: string | null`).

The new props interface is:
```ts
export interface ManageHostsDialogProps {
  open: boolean
  onClose: () => void
  onAddHostClick: () => void
}
```

Replace the function body. The component uses `useHosts()` for the list, `useDeleteHost()` for the delete action, and a per-row "List files" toggle that switches `expandedHostId`. When `expandedHostId` is set, the row renders `useHostFiles(expandedHostId)`.

- [ ] **Step 9: Update `AddHostDialog` to use `useCreateHost`**

Open `src/renderer/src/features/hosts/components/AddHostDialog.tsx`. Remove the `onSubmit` prop. The dialog's "Submit" button calls `useCreateHost().mutate(payload)` and closes on success.

The new props interface:
```ts
export interface AddHostDialogProps {
  open: boolean
  onClose: () => void
  newHost: NewHostState
  onNewHostChange: (field: string) => (event: ...) => void
}
```

`onSubmit` is removed; the button's `onClick` calls the mutation directly. The `newHost` state still lives in `App.tsx` (it is form state, not server state).

- [ ] **Step 10: Update `App.tsx` to drop the host state and pass only the dialog visibility**

Open `src/renderer/src/App.tsx`. Remove the following blocks:
- `import { appAPI, Host } from "./api/api";` (Host is no longer needed here)
- `import { ListFilesResult, NewHostState } from "./components/types";`
- `const [hosts, setHosts] = useState<Host[]>([]);` (now from `useHosts()` inside the dialog)
- `const [isLoadingHosts, setIsLoadingHosts] = useState(false);` (now from `useHosts()`)
- `const [fileListResults, setFileListResults] = useState<...>({});` (now from `useHostFiles()`)
- The `useEffect` that loads hosts on dialog open.
- `const handleDeleteHost = async (hostId: string) => { ... };` (now `useDeleteHost()`)
- `const triggerListFiles = async (hostId: string) => { ... };` (now `useHostFiles()`)

Keep:
- `const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);`
- `const [isAddHostDialogOpen, setIsAddHostDialogOpen] = useState(false);`
- `const [newHost, setNewHost] = useState<NewHostState>(...);`
- `const handleNewHostChange = ...;`
- `const handleAddHost = async () => { ... };` (now calls `useCreateHost().mutate(payload)` — but `useCreateHost` is called from inside `AddHostDialog` instead. Actually, simpler: keep `handleAddHost` in App.tsx for now; it builds the payload and closes the dialog; the dialog's submit triggers the mutation. Read the dialog refactor in Step 9: the dialog itself calls the mutation on submit. So `handleAddHost` in App.tsx can be removed entirely.)

The dialog usage becomes:
```tsx
<ManageHostsDialog
  open={isHostDialogOpen}
  onClose={() => setIsHostDialogOpen(false)}
  onAddHostClick={() => setIsAddHostDialogOpen(true)}
/>

<AddHostDialog
  open={isAddHostDialogOpen}
  onClose={() => setIsAddHostDialogOpen(false)}
  newHost={newHost}
  onNewHostChange={handleNewHostChange}
/>
```

- [ ] **Step 11: Create `features/hosts/index.ts`**

Create `src/renderer/src/features/hosts/index.ts`:
```ts
export { ManageHostsDialog } from "./components/ManageHostsDialog"
export { AddHostDialog } from "./components/AddHostDialog"
```

- [ ] **Step 12: Clean up `components/types.ts`**

Edit `src/renderer/src/components/types.ts`. Remove `Host`, `ListFilesResult`, `NewHostState`, `ManageHostsDialogProps`, `AddHostDialogProps` — they are now in `features/hosts/types.ts` and the dialog files. Keep `SidebarProps` and `TopNavBarProps` for now (those move to their files in Task 7).

The remaining file:
```ts
export interface SidebarProps {
  drawerWidth: number
}

export interface TopNavBarProps {
  drawerWidth: number
  isMenuOpen: boolean
  anchorEl: HTMLElement | null
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void
  onMenuClose: () => void
  onManageHostsClick: () => void
  onBackClick: () => void
}
```

(The `Host` import at the top of the file is removed.)

- [ ] **Step 13: Verify typecheck, tests, and dev server**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm test -- features/hosts`
Expected: all hosts tests pass.

Run: `pnpm dev:web`. Open Admin > Hosting Provider. Confirm:
- Hosts load
- Delete host works
- List files works
- Add host works

Stop the server.

- [ ] **Step 14: Commit**

```bash
git add -A src/renderer/src/features/hosts src/renderer/src/components/types.ts src/renderer/src/App.tsx
git commit -m "Move hosts feature into features/hosts with React Query hooks"
```

---

## Task 6: Move the playlist feature and delete `PlaylistRefreshContext`

**Files:**
- Create: `src/renderer/src/features/playlist/types.ts`
- Create: `src/renderer/src/features/playlist/api/playlists.ts`
- Create: `src/renderer/src/features/playlist/hooks/usePlaylists.test.ts`
- Create: `src/renderer/src/features/playlist/hooks/usePlaylists.ts`
- Create: `src/renderer/src/features/playlist/hooks/useCreatePlaylist.test.ts`
- Create: `src/renderer/src/features/playlist/hooks/useCreatePlaylist.ts`
- Create: `src/renderer/src/features/playlist/hooks/usePlaylist.test.ts`
- Create: `src/renderer/src/features/playlist/hooks/usePlaylist.ts`
- Create: `src/renderer/src/features/playlist/hooks/useUpdatePlaylist.ts`
- Create: `src/renderer/src/features/playlist/hooks/useDeletePlaylist.ts`
- Create: `src/renderer/src/features/playlist/hooks/useAddSongsToPlaylist.ts`
- Create: `src/renderer/src/features/playlist/hooks/useRemoveSongFromPlaylist.ts`
- Create: `src/renderer/src/features/playlist/components/PlaylistView.tsx` (moved)
- Create: `src/renderer/src/features/playlist/components/PlaylistList.tsx` (moved)
- Create: `src/renderer/src/features/playlist/components/CreatePlaylistDialog.tsx` (moved)
- Create: `src/renderer/src/features/playlist/components/AddToPlaylistDialog.tsx` (moved)
- Create: `src/renderer/src/features/playlist/index.ts`
- Delete: `src/renderer/src/components/dialogs/CreatePlaylistDialog.tsx`
- Delete: `src/renderer/src/components/dialogs/AddToPlaylistDialog.tsx`
- Delete: `src/renderer/src/contexts/PlaylistRefreshContext.tsx`
- Delete: `src/renderer/src/views/playlist/`
- Delete: `src/renderer/src/views/playlists/`
- Delete: `src/renderer/src/api/Playlist.ts` (after types move)
- Modify: `src/renderer/src/App.tsx` (drop the `PlaylistRefreshProvider`; replace `handleCreatePlaylist` with hook)
- Modify: `src/renderer/src/app/router.tsx` (still eager imports in this task; lazy import is added in Task 7+)

- [ ] **Step 1: Move playlist types**

Create `src/renderer/src/features/playlist/types.ts`:
```ts
import type { Song } from "@features/library/types"
```

Wait — `features/library/types.ts` does not exist yet. It is created in Task 7. For this task, use the existing `api/Song.ts` via a longer path. Update Step 1:

Create `src/renderer/src/features/playlist/types.ts`:
```ts
import type { Song } from "../../api/Song"

export interface Playlist {
  _id: string
  name: string
  description?: string
  songCount: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistDetail {
  _id: string
  name: string
  description?: string
  songs: Song[]
  createdAt: string
  updatedAt: string
}
```

(After Task 7, change the import to `import type { Song } from "@features/library/types"`.)

- [ ] **Step 2: Create `features/playlist/api/playlists.ts`**

Create `src/renderer/src/features/playlist/api/playlists.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Playlist, PlaylistDetail } from "../types"

export const listPlaylists = async (): Promise<Playlist[]> => {
  const resp = await apiClient.get<Playlist[]>("/playlists")
  return resp.data
}

export const getPlaylist = async (id: string): Promise<PlaylistDetail> => {
  const resp = await apiClient.get<PlaylistDetail>(`/playlist/${id}`)
  return resp.data
}

export const createPlaylist = async (data: {
  name: string
  description?: string
}): Promise<string> => {
  const resp = await apiClient.post<string>("/playlists", data)
  return resp.data
}

export const updatePlaylist = async (
  id: string,
  data: { name?: string; description?: string }
): Promise<void> => {
  await apiClient.put(`/playlist/${id}`, data)
}

export const deletePlaylist = async (id: string): Promise<void> => {
  await apiClient.delete(`/playlist/${id}`)
}

export const addSongsToPlaylist = async (
  playlistId: string,
  songIds: string[]
): Promise<string> => {
  const resp = await apiClient.post<string>(`/playlist/${playlistId}/songs`, { songIds })
  return resp.data
}

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
): Promise<void> => {
  await apiClient.delete(`/playlist/${playlistId}/songs/${songId}`)
}
```

- [ ] **Step 3: Write the failing test for `usePlaylists`**

Create `src/renderer/src/features/playlist/hooks/usePlaylists.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from "@lib/axios"
import { usePlaylists } from "./usePlaylists"
import type { Playlist } from "../types"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("usePlaylists", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the playlist list", async () => {
    const mock: Playlist[] = [{ _id: "p1", name: "P1", songCount: 0, createdAt: "", updatedAt: "" }]
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mock })

    const { result } = renderHook(() => usePlaylists(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mock)
  })
})
```

Run: `pnpm test -- features/playlist/hooks/usePlaylists.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `usePlaylists` and the rest of the playlist hooks**

Create `src/renderer/src/features/playlist/hooks/usePlaylists.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listPlaylists } from "../api/playlists"

export const playlistKeys = {
  all: ["playlists"] as const,
  detail: (id: string) => [...playlistKeys.all, "detail", id] as const
}

export const usePlaylists = () =>
  useQuery({ queryKey: playlistKeys.all, queryFn: listPlaylists })
```

Create `src/renderer/src/features/playlist/hooks/useCreatePlaylist.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { createPlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const useCreatePlaylist = () =>
  useMutation({
    mutationFn: (data: { name: string; description?: string }) => createPlaylist(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  })
```

Create `src/renderer/src/features/playlist/hooks/useCreatePlaylist.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { post: vi.fn() } }))
vi.mock("@lib/queryClient", () => ({ queryClient: new QueryClient() }))

import { apiClient } from "@lib/axios"
import { queryClient } from "@lib/queryClient"
import { useCreatePlaylist } from "./useCreatePlaylist"
import { playlistKeys } from "./usePlaylists"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useCreatePlaylist", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates a playlist and invalidates the list", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: "new-id" })

    const { result } = renderHook(() => useCreatePlaylist(), { wrapper: makeWrapper() })
    result.current.mutate({ name: "P", description: "d" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: playlistKeys.all })
  })
})
```

Create `src/renderer/src/features/playlist/hooks/usePlaylist.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { getPlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const usePlaylist = (id: string) =>
  useQuery({
    queryKey: playlistKeys.detail(id),
    queryFn: () => getPlaylist(id),
    enabled: Boolean(id)
  })
```

Create `src/renderer/src/features/playlist/hooks/usePlaylist.test.ts`:
```ts
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

vi.mock("@lib/axios", () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from "@lib/axios"
import { usePlaylist } from "./usePlaylist"

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("usePlaylist", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the playlist detail", async () => {
    const mock = { _id: "p1", name: "P1", songs: [], createdAt: "", updatedAt: "" }
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mock })

    const { result } = renderHook(() => usePlaylist("p1"), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mock)
  })
})
```

Create `src/renderer/src/features/playlist/hooks/useUpdatePlaylist.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { updatePlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const useUpdatePlaylist = () =>
  useMutation({
    mutationFn: (vars: { id: string; data: { name?: string; description?: string } }) =>
      updatePlaylist(vars.id, vars.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all })
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.id) })
    }
  })
```

Create `src/renderer/src/features/playlist/hooks/useDeletePlaylist.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { deletePlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const useDeletePlaylist = () =>
  useMutation({
    mutationFn: (id: string) => deletePlaylist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  })
```

Create `src/renderer/src/features/playlist/hooks/useAddSongsToPlaylist.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { addSongsToPlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const useAddSongsToPlaylist = () =>
  useMutation({
    mutationFn: (vars: { playlistId: string; songIds: string[] }) =>
      addSongsToPlaylist(vars.playlistId, vars.songIds),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all })
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.playlistId) })
    }
  })
```

Create `src/renderer/src/features/playlist/hooks/useRemoveSongFromPlaylist.ts`:
```ts
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import { removeSongFromPlaylist } from "../api/playlists"
import { playlistKeys } from "./usePlaylists"

export const useRemoveSongFromPlaylist = () =>
  useMutation({
    mutationFn: (vars: { playlistId: string; songId: string }) =>
      removeSongFromPlaylist(vars.playlistId, vars.songId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.playlistId) })
    }
  })
```

Run: `pnpm test -- features/playlist`
Expected: all playlist tests pass.

- [ ] **Step 5: Move the playlist view and dialog components**

Run:
```bash
git mv src/renderer/src/views/playlist/PlaylistView.tsx      src/renderer/src/features/playlist/components/PlaylistView.tsx
git mv src/renderer/src/views/playlists/PlaylistList.tsx    src/renderer/src/features/playlist/components/PlaylistList.tsx
git mv src/renderer/src/components/dialogs/CreatePlaylistDialog.tsx src/renderer/src/features/playlist/components/CreatePlaylistDialog.tsx
git mv src/renderer/src/components/dialogs/AddToPlaylistDialog.tsx  src/renderer/src/features/playlist/components/AddToPlaylistDialog.tsx
```

In each moved file, update imports:
- `from "../../api/Playlist"` -> `from "../types"`
- `from "../../api/Song"` -> `from "@features/library/types"` (or `from "../../../api/Song"` for now if library types don't exist yet; same caveat as in Task 3 — use the longer relative path until Task 7)
- `from "../../api/api"` -> `from "@features/playlist/api/playlists"`
- `from "../types"` (for `ListFilesResult` etc., not present in playlist) -> n/a
- `from "../../components/..."` -> `from "@components/..."`
- `from "../../utils/..."` -> `from "@utils/..."`
- `from "../components/..."` (for shared components) -> `from "@components/..."`
- `from "../playlist/..."` (sibling views) -> `from "./..."` if same dir, or `from "@features/playlist/..."`

- [ ] **Step 6: Update `App.tsx` to drop `PlaylistRefreshContext`**

In `App.tsx`:
- Remove `import { PlaylistRefreshProvider } from "./contexts/PlaylistRefreshContext";`
- Remove `<PlaylistRefreshProvider value={{ ... }}>...</PlaylistRefreshProvider>` wrapper around `<ThemeProvider>`.
- Remove `import { useState, useCallback } from "react";` parts that were only used for the refresh key.
- Replace the `handleCreatePlaylist` and the `triggerRefresh` plumbing: `CreatePlaylistDialog` now calls `useCreatePlaylist().mutate({ name, description })` itself; on success it closes. The `playlistRefreshKey` is gone.
- `onCreatePlaylist` prop on `Sidebar` stays (it just opens the dialog).

- [ ] **Step 7: Update `CreatePlaylistDialog` to use `useCreatePlaylist`**

In `src/renderer/src/features/playlist/components/CreatePlaylistDialog.tsx`:
- Remove the `onSubmit` prop.
- Inside, call `const createPlaylist = useCreatePlaylist();`
- The "Create" button's `onClick` calls `createPlaylist.mutate({ name, description }, { onSuccess: () => onClose() })`.

- [ ] **Step 8: Delete the old files and folders**

Run:
```bash
git rm -r src/renderer/src/views/playlist src/renderer/src/views/playlists
git rm src/renderer/src/api/Playlist.ts
git rm src/renderer/src/components/dialogs/CreatePlaylistDialog.tsx
git rm src/renderer/src/components/dialogs/AddToPlaylistDialog.tsx
git rm src/renderer/src/contexts/PlaylistRefreshContext.tsx
rmdir src/renderer/src/views
rmdir src/renderer/src/contexts
```

(After this, `src/renderer/src/views/` and `src/renderer/src/contexts/` are gone.)

- [ ] **Step 9: Create `features/playlist/index.ts`**

Create `src/renderer/src/features/playlist/index.ts`:
```ts
export { PlaylistView } from "./components/PlaylistView"
export { PlaylistList } from "./components/PlaylistList"
export { CreatePlaylistDialog } from "./components/CreatePlaylistDialog"
export { AddToPlaylistDialog } from "./components/AddToPlaylistDialog"
```

- [ ] **Step 10: Update `app/router.tsx` to import from the new locations**

Edit `src/renderer/src/app/router.tsx`:
```tsx
import { createHashRouter } from "react-router-dom"
import { AlbumView } from "../../views/album/AlbumView"            // (still in views for now)
import { Albums } from "../../views/albums/AlbumList"               // (still in views for now)
import { ArtistView } from "../../views/artist/ArtistView"          // (still in views for now)
import { Home } from "../../views/home/Home"                        // (still in views for now)
import { Songs } from "../../views/songs/SongList"                 // (still in views for now)
import { Videos } from "../../views/videos/VideoList"               // (still in views for now)
import { SearchResults } from "../../views/search/SearchResults"    // (still in views for now)
import { Playlists, PlaylistView } from "@features/playlist"

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
```

(Playlists and PlaylistView are now from `@features/playlist`. The others stay as `../../views/...` until their tasks.)

- [ ] **Step 11: Verify typecheck, tests, and dev server**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm test -- features/playlist`
Expected: all playlist tests pass.

Run: `pnpm dev:web`. Confirm:
- Sidebar's "Create Playlist" button opens the dialog.
- Creating a playlist closes the dialog and the new playlist appears in the list.
- Opening a playlist detail loads it.
- E2E test for the Create Playlist dialog flow passes (if the E2E suite is run).

Stop the server.

- [ ] **Step 12: Commit**

```bash
git add -A src/renderer/src/features/playlist src/renderer/src/app/router.tsx src/renderer/src/App.tsx
git commit -m "Move playlist feature into features/playlist and delete PlaylistRefreshContext"
```

---

## Task 7: Move the library feature (songs, videos, albums lists + Home)

**Files:**
- Create: `src/renderer/src/features/library/types.ts`
- Create: `src/renderer/src/features/library/api/songs.ts`
- Create: `src/renderer/src/features/library/api/videos.ts`
- Create: `src/renderer/src/features/library/api/albums.ts`
- Create: `src/renderer/src/features/library/hooks/useSongs.ts`
- Create: `src/renderer/src/features/library/hooks/useVideos.ts`
- Create: `src/renderer/src/features/library/hooks/useAlbums.ts`
- Create: `src/renderer/src/features/library/components/SongList.tsx` (moved)
- Create: `src/renderer/src/features/library/components/VideoList.tsx` (moved)
- Create: `src/renderer/src/features/library/components/AlbumList.tsx` (moved)
- Create: `src/renderer/src/features/library/views/Home.tsx` (moved)
- Create: `src/renderer/src/features/library/index.ts`
- Create: `src/renderer/src/types/shared.ts`
- Delete: `src/renderer/src/views/songs/`
- Delete: `src/renderer/src/views/videos/`
- Delete: `src/renderer/src/views/albums/`
- Delete: `src/renderer/src/views/home/`
- Delete: `src/renderer/src/api/Song.ts`
- Delete: `src/renderer/src/api/Video.ts`
- Delete: `src/renderer/src/api/Album.ts`
- Delete: `src/renderer/src/api/api.ts` (after Tasks 4-6 have moved every method)
- Modify: `src/renderer/src/app/router.tsx` (lazy import for library)
- Modify: `src/renderer/src/App.tsx` (drop `import { appAPI, ... }`)

- [ ] **Step 1: Create `features/library/types.ts`**

Create `src/renderer/src/features/library/types.ts`:
```ts
export interface Song {
  _id: string
  type?: "audio" | "video"
  trackNo: number
  title: string
  artist: string[]
  size: number
  duration: number
  format: string
  lossless: boolean
  bitrate: number
  fileExtension: string
  bitdepth: string
  bitsPerSample?: number
  sampleRate: number
  album?: Album
}

export interface Album {
  _id: string
  cover?: string
  title: string
  artist: string
  year?: number
}

export interface IVideoChapter {
  time: number
  title: string
  subTitle: string
}

export interface Video {
  _id: string
  type?: "audio" | "video"
  title: string
  artist: string[]
  size: number
  duration: number
  videoWidth: number
  videoHeight: number
  videoCodecRaw: string
  audioLossless: boolean
  audioSampleRate: number
  audioBitsPerSample: number
  audioCodecRaw: string
  youtubeUrl?: string
  fileExtension: string
  format: string
  bitrate: number
  album?: Album
  chapters: IVideoChapter[]
}

export function isVideo(v: Video | Song | null): v is Video {
  return v?.type === "video"
}
```

(The circular `Album <-> Song` reference works because TypeScript resolves these at the type level. Both are declared in the same file. `AlbumDetail` is a separate interface in `features/album/types.ts` — see Task 8.)

- [ ] **Step 2: Create `features/library/api/songs.ts`, `videos.ts`, `albums.ts`**

Create `src/renderer/src/features/library/api/songs.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Song } from "../types"

export const listSongs = async (page = 0, pageSize = 50): Promise<Song[]> => {
  const resp = await apiClient.get<Song[]>("/songs", { params: { page, pageSize } })
  return resp.data
}

export const getSong = async (id: string): Promise<Song> => {
  const resp = await apiClient.get<Song>(`/song/${id}`)
  return resp.data
}
```

Create `src/renderer/src/features/library/api/videos.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Video } from "../types"

export const listVideos = async (page = 0, pageSize = 50): Promise<Video[]> => {
  const resp = await apiClient.get<Video[]>("/videos", { params: { page, pageSize } })
  return resp.data
}
```

Create `src/renderer/src/features/library/api/albums.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Album } from "../types"

export const listAlbums = async (page = 0, pageSize = 30): Promise<Album[]> => {
  const resp = await apiClient.get<Album[]>("/albums", { params: { page, pageSize } })
  return resp.data
}
```

- [ ] **Step 3: Create the library hooks**

Create `src/renderer/src/features/library/hooks/useSongs.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listSongs } from "../api/songs"

export const songKeys = { all: ["songs"] as const, list: (page: number, pageSize: number) =>
  [...songKeys.all, "list", page, pageSize] as const }

export const useSongs = (page = 0, pageSize = 50) =>
  useQuery({ queryKey: songKeys.list(page, pageSize), queryFn: () => listSongs(page, pageSize) })
```

Create `src/renderer/src/features/library/hooks/useVideos.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listVideos } from "../api/videos"

export const videoKeys = { all: ["videos"] as const, list: (page: number, pageSize: number) =>
  [...videoKeys.all, "list", page, pageSize] as const }

export const useVideos = (page = 0, pageSize = 50) =>
  useQuery({ queryKey: videoKeys.list(page, pageSize), queryFn: () => listVideos(page, pageSize) })
```

Create `src/renderer/src/features/library/hooks/useAlbums.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { listAlbums } from "../api/albums"

export const albumKeys = { all: ["albums"] as const, list: (page: number, pageSize: number) =>
  [...albumKeys.all, "list", page, pageSize] as const }

export const useAlbums = (page = 0, pageSize = 30) =>
  useQuery({ queryKey: albumKeys.list(page, pageSize), queryFn: () => listAlbums(page, pageSize) })
```

- [ ] **Step 4: Create `types/shared.ts`**

Create `src/renderer/src/types/shared.ts`:
```ts
import type { Song } from "@features/library/types"
import type { Album } from "@features/library/types"
import type { Video } from "@features/library/types"

export interface SearchResult {
  songs: Song[]
  albums: Album[]
  videos: Video[]
}
```

- [ ] **Step 5: Move the library views and components**

Run:
```bash
git mv src/renderer/src/views/songs/SongList.tsx     src/renderer/src/features/library/components/SongList.tsx
git mv src/renderer/src/views/videos/VideoList.tsx   src/renderer/src/features/library/components/VideoList.tsx
git mv src/renderer/src/views/albums/AlbumList.tsx   src/renderer/src/features/library/components/AlbumList.tsx
git mv src/renderer/src/views/home/Home.tsx          src/renderer/src/features/library/views/Home.tsx
```

In each moved file, update imports:
- `from "../../api/Song"` -> `from "@features/library/types"`
- `from "../../api/Video"` -> `from "@features/library/types"`
- `from "../../api/Album"` -> `from "@features/library/types"`
- `from "../../api/api"` -> `from "@features/library/api/..."` (per resource)
- `from "../api/api"` -> `from "@features/library/api/..."`
- `from "../components/..."` -> `from "@components/..."`
- `from "../../components/..."` -> `from "@components/..."`
- `from "../../utils/..."` -> `from "@utils/..."`
- `from "../views/..."` (for sibling views in `views/`) -> `from "@features/.../views/..."` or `from "./..."` if same dir.

- [ ] **Step 6: Switch the moved views to use the new hooks**

In each moved list view (`SongList`, `VideoList`, `AlbumList`):
- Remove the `useState` + `useEffect` + axios call.
- Replace with `useSongs()` / `useVideos()` / `useAlbums()`.

In `Home.tsx`:
- Same pattern: replace direct API calls with the three hooks.

- [ ] **Step 7: Create `features/library/index.ts`**

Create `src/renderer/src/features/library/index.ts`:
```ts
export { Home } from "./views/Home"
export { SongList } from "./components/SongList"
export { VideoList } from "./components/VideoList"
export { AlbumList } from "./components/AlbumList"

export type { Song, Album, Video, IVideoChapter } from "./types"
export { isVideo } from "./types"
```

- [ ] **Step 8: Switch `app/router.tsx` to lazy import for library**

Replace `src/renderer/src/app/router.tsx`:
```tsx
import { createHashRouter } from "react-router-dom"
import { AlbumView } from "../../views/album/AlbumView"            // (still in views for now)
import { ArtistView } from "../../views/artist/ArtistView"          // (still in views for now)
import { SearchResults } from "../../views/search/SearchResults"    // (still in views for now)

export const router = createHashRouter([
  {
    element: <AppShellPlaceholder />,   // replaced with AppShell below
    children: [
      { path: "/",           lazy: () => import("@features/library").then(m => ({ Component: m.Home })) },
      { path: "/albums",     lazy: () => import("@features/library").then(m => ({ Component: m.AlbumList })) },
      { path: "/songs",      lazy: () => import("@features/library").then(m => ({ Component: m.SongList })) },
      { path: "/videos",     lazy: () => import("@features/library").then(m => ({ Component: m.VideoList })) },
      { path: "/album/:id",  element: <AlbumView /> },
      { path: "/artist/:name", element: <ArtistView /> },
      { path: "/search",     element: <SearchResults /> },
      { path: "/playlists",  lazy: () => import("@features/playlist").then(m => ({ Component: m.Playlists })) },
      { path: "/playlist/:id", lazy: () => import("@features/playlist").then(m => ({ Component: m.PlaylistView })) }
    ]
  }
])

function AppShellPlaceholder() { return <div /> }
```

This step only introduces lazy for library (and playlist, which is already on disk). Album/artist/search stay eager in the route map.

Important: the `<Outlet />` lives in `app/AppShell.tsx` per the layout route. In Task 2, `AppShell.tsx` was a passthrough that rendered the old `App` directly. With this step introducing a layout route, `AppShell.tsx` is upgraded to render `<Outlet />` (and the Suspense boundary). Edit `AppShell.tsx` to:

```tsx
import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { Box } from "@mui/material"
import { Sidebar } from "@components/layout/Sidebar"
import { TopNavBar } from "@components/layout/TopNavBar"
import { Player } from "@features/player"
import { ManageHostsDialog, AddHostDialog } from "@features/hosts"
import { CreatePlaylistDialog } from "@features/playlist"
import { PlaylistRefreshProvider } from "@app/PlaylistRefreshProvider"   // (already deleted in Task 6; remove this import)
import { LoadingFallback } from "@components/common/LoadingFallback"
```

The exact body of `AppShell.tsx` is: the current `App.tsx` layout (Sidebar + TopNavBar + main content area with `<Outlet />` inside `<Suspense fallback={<LoadingFallback />}>` + Player + dialogs), minus the host/playlist state (which has been moved to hooks in Tasks 5-6).

For this step (Task 7), the simplest version of `AppShell.tsx`:

```tsx
import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { Box } from "@mui/material"
import { Sidebar } from "@components/layout/Sidebar"
import { TopNavBar } from "@components/layout/TopNavBar"
import { Player } from "@features/player"
import { ManageHostsDialog, AddHostDialog } from "@features/hosts"
import { CreatePlaylistDialog } from "@features/playlist"
import { LoadingFallback } from "@components/common/LoadingFallback"
import { useAppSelector } from "@app/hooks"

const drawerWidth = 240

export function AppShell() {
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer)

  return (
    <Box sx={{ display: "flex", height: "100vh", marginBottom: "350px" }}>
      <CssBaseline />
      <Sidebar drawerWidth={drawerWidth} onCreatePlaylist={() => setIsCreatePlaylistOpen(true)} />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "black", p: 3, height: "100%", paddingBottom: "86px", overflow: "hidden auto", marginBottom: 330, padding: 0 }}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </Box>
      <TopNavBar drawerWidth={drawerWidth} isMenuOpen={isMenuOpen} isHome={isHome} anchorEl={anchorEl} ... />
      <Player />
      <ManageHostsDialog open={isHostDialogOpen} onClose={...} onAddHostClick={...} />
      <AddHostDialog open={isAddHostDialogOpen} onClose={...} newHost={newHost} onNewHostChange={...} />
      <CreatePlaylistDialog open={isCreatePlaylistOpen} onClose={...} />
    </Box>
  )
}
```

(Exact body is a near-copy of `App.tsx`'s layout, with all the host/playlist state already converted to hooks from Tasks 5-6.)

- [ ] **Step 9: Create `LoadingFallback`**

Create `src/renderer/src/components/common/LoadingFallback.tsx`:
```tsx
import { Box, CircularProgress } from "@mui/material"

export const LoadingFallback = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
    <CircularProgress />
  </Box>
)
```

- [ ] **Step 10: Move `Sidebar` and `TopNavBar` to `components/layout/`**

Run:
```bash
git mv src/renderer/src/components/Sidebar.tsx    src/renderer/src/components/layout/Sidebar.tsx
git mv src/renderer/src/components/TopNavBar.tsx  src/renderer/src/components/layout/TopNavBar.tsx
```

In each moved file, update imports:
- `from "../api/api"` -> `from "@lib/axios"` or `from "@features/.../api/..."` per usage
- `from "../components/..."` -> `from "@components/..."`
- `from "../views/..."` -> `from "@features/..."`
- `from "../store/..."` -> `from "@app/..."` or `@features/player/store/...`

- [ ] **Step 11: Update lingering `../../api/...` imports across `features/`**

After Steps 5-9, several files still import from the old `api/` folder via relative paths like `../../../api/Song` and `../../api/Video` (used as a transitional path before `features/library/types.ts` existed). Now that `features/library/types.ts` exists, find and rewrite every lingering `../../api/...` import:

```bash
grep -rn "from \"\.\./.*api/" src/renderer/src/features/
```

For each match, replace with the new location:
- `from "../../../api/Song"` or `from "../../api/Song"` -> `from "@features/library/types"`
- `from "../../../api/Video"` or `from "../../api/Video"` -> `from "@features/library/types"`
- `from "../../../api/Album"` or `from "../../api/Album"` -> `from "@features/library/types"`
- `from "../../api/api"` -> `from "@features/.../api/..."` (per the feature the file belongs to)

In particular, update:
- `src/renderer/src/features/player/store/playerSlice.ts` (uses `Song`, `Video`, `isVideo`, `IVideoChapter`)
- `src/renderer/src/features/player/thunks/onNextTrack.ts`, `onPrevTrack.ts`, `onVideoPosition.ts` (use `isVideo`)
- `src/renderer/src/features/playlist/types.ts` (uses `Song`)
- Any other file surfaced by the grep

- [ ] **Step 12: Delete the old api type files and `api/api.ts`**

After Step 11, verify nothing imports from `api/api.ts`, `api/Album.ts`, `api/Song.ts`, or `api/Video.ts`:
```bash
grep -rn "from .*api/" src/renderer/src/
```
Expected: no matches.

Then:
```bash
git rm src/renderer/src/api/Album.ts src/renderer/src/api/Song.ts src/renderer/src/api/Video.ts src/renderer/src/api/api.ts
rmdir src/renderer/src/api
```

- [ ] **Step 13: Verify typecheck, dev server, and E2E**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm dev:web`. Confirm:
- Home page renders with songs/videos/albums lists.
- Sidebar links navigate to /songs, /videos, /albums.
- Each list page renders its data.

Run: `pnpm test:e2e -- e2e/gui.spec.ts` (with seeded E2E data, per `AGENTS.md`).
Expected: all GUI E2E tests pass.

- [ ] **Step 14: Commit**

```bash
git add -A src/renderer/src/features/library src/renderer/src/components/layout src/renderer/src/components/common src/renderer/src/types src/renderer/src/app src/renderer/src/api
git commit -m "Move library feature into features/library with lazy routes"
```

---

## Task 8: Move the album feature

**Files:**
- Create: `src/renderer/src/features/album/types.ts`
- Create: `src/renderer/src/features/album/api/album.ts`
- Create: `src/renderer/src/features/album/hooks/useAlbum.ts`
- Create: `src/renderer/src/features/album/components/AlbumView.tsx` (moved)
- Create: `src/renderer/src/features/album/components/AlbumInfo.tsx` (moved)
- Create: `src/renderer/src/features/album/components/AlbumControlButton.tsx` (moved)
- Create: `src/renderer/src/features/album/components/SongListTable.tsx` (moved)
- Create: `src/renderer/src/features/album/components/VideoList.tsx` (moved)
- Create: `src/renderer/src/features/album/index.ts`
- Delete: `src/renderer/src/views/album/`
- Modify: `src/renderer/src/app/router.tsx` (lazy import for album)

- [ ] **Step 1: Create `features/album/types.ts`**

Create `src/renderer/src/features/album/types.ts`:
```ts
import type { Song, Video } from "@features/library/types"

export interface AlbumDetail {
  _id: string
  cover?: string
  title: string
  artist: string
  year: number
  genre: string[]
  trackList: Song[]
  videoList: Video[]
}
```

- [ ] **Step 2: Create `features/album/api/album.ts` and the hook**

Create `src/renderer/src/features/album/api/album.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { AlbumDetail } from "../types"

export const getAlbum = async (id: string): Promise<AlbumDetail> => {
  const resp = await apiClient.get<AlbumDetail>(`/album/${id}`)
  return resp.data
}
```

Create `src/renderer/src/features/album/hooks/useAlbum.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { getAlbum } from "../api/album"

export const albumDetailKey = (id: string) => ["album", id] as const

export const useAlbum = (id: string) =>
  useQuery({ queryKey: albumDetailKey(id), queryFn: () => getAlbum(id), enabled: Boolean(id) })
```

- [ ] **Step 3: Move the album components**

Run:
```bash
git mv src/renderer/src/views/album/AlbumView.tsx           src/renderer/src/features/album/components/AlbumView.tsx
git mv src/renderer/src/views/album/AlbumInfo.tsx           src/renderer/src/features/album/components/AlbumInfo.tsx
git mv src/renderer/src/views/album/AlbumControlButton.tsx  src/renderer/src/features/album/components/AlbumControlButton.tsx
git mv src/renderer/src/views/album/SongListTable.tsx       src/renderer/src/features/album/components/SongListTable.tsx
git mv src/renderer/src/views/album/VideoList.tsx           src/renderer/src/features/album/components/VideoList.tsx
```

In each moved file, update imports:
- `from "../../api/Album"` -> `from "@features/library/types"` (for `Album`) and `from "../types"` (for `AlbumDetail`)
- `from "../../api/api"` -> `from "@features/album/api/album"`
- `from "../../components/..."` -> `from "@components/..."`
- `from "../../utils/..."` -> `from "@utils/..."`
- `from "../api/api"` (inside `views/album/`) -> `from "@features/album/api/album"`
- `from "../views/..."` (sibling views) -> `from "@features/.../components/..."`

- [ ] **Step 4: Update `AlbumView` to use the hook**

In `features/album/components/AlbumView.tsx`:
- Remove the `useState` + `useEffect` + `appAPI.album(id)` call.
- Replace with `const { data: album } = useAlbum(id);` (read the id from `useParams`).

- [ ] **Step 5: Create `features/album/index.ts`**

Create `src/renderer/src/features/album/index.ts`:
```ts
export { AlbumView } from "./components/AlbumView"
```

- [ ] **Step 6: Update `app/router.tsx` to lazy-import the album route**

Replace the `/album/:id` route entry:
```ts
{ path: "/album/:id", lazy: () => import("@features/album").then(m => ({ Component: m.AlbumView })) }
```

(Remove the eager `import { AlbumView } from "../../views/album/AlbumView";` line.)

- [ ] **Step 7: Verify typecheck, dev server, and E2E**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm dev:web`. Open an album. Confirm the album detail page renders.

Run: `pnpm test:e2e -- e2e/gui.spec.ts` (with the album flow).
Expected: album flow passes.

- [ ] **Step 8: Commit**

```bash
git add -A src/renderer/src/features/album src/renderer/src/app/router.tsx
git commit -m "Move album feature into features/album with lazy route"
```

---

## Task 9: Move the search and artist features

**Files:**
- Create: `src/renderer/src/features/search/api/search.ts`
- Create: `src/renderer/src/features/search/hooks/useSearch.ts`
- Create: `src/renderer/src/features/search/components/SearchResults.tsx` (moved)
- Create: `src/renderer/src/features/search/index.ts`
- Create: `src/renderer/src/features/artist/api/artist.ts`
- Create: `src/renderer/src/features/artist/hooks/useArtist.ts`
- Create: `src/renderer/src/features/artist/components/ArtistView.tsx` (moved)
- Create: `src/renderer/src/features/artist/index.ts`
- Delete: `src/renderer/src/views/search/`
- Delete: `src/renderer/src/views/artist/`
- Modify: `src/renderer/src/components/search/SearchDropdown.tsx` (move to `features/search/`)
- Modify: `src/renderer/src/app/router.tsx` (lazy import for search and artist)

- [ ] **Step 1: Create `features/search/api/search.ts` and the hook**

Create `src/renderer/src/features/search/api/search.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { SearchResult } from "@renderer/types/shared"

export const search = async (q: string): Promise<SearchResult> => {
  const resp = await apiClient.get<SearchResult>("/search", { params: { q } })
  return resp.data
}
```

Create `src/renderer/src/features/search/hooks/useSearch.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { search } from "../api/search"

export const searchKeys = { all: ["search"] as const, query: (q: string) =>
  [...searchKeys.all, q] as const }

export const useSearch = (q: string) =>
  useQuery({ queryKey: searchKeys.query(q), queryFn: () => search(q), enabled: Boolean(q) })
```

- [ ] **Step 2: Move the search view and dropdown**

Run:
```bash
git mv src/renderer/src/views/search/SearchResults.tsx  src/renderer/src/features/search/components/SearchResults.tsx
git mv src/renderer/src/components/search/SearchDropdown.tsx src/renderer/src/features/search/components/SearchDropdown.tsx
```

In each moved file, update imports:
- `from "../../api/api"` -> `from "../api/search"`
- `from "../../api/Song"` / `from "../../api/Video"` / `from "../../api/Album"` -> `from "@features/library/types"`
- `from "../../types"` (for `SearchResult`) -> `from "@renderer/types/shared"`
- `from "../types"` -> `from "@renderer/types/shared"`
- `from "../../components/..."` -> `from "@components/..."`
- `from "../components/..."` -> `from "@components/..."`

- [ ] **Step 3: Create `features/search/index.ts`**

Create `src/renderer/src/features/search/index.ts`:
```ts
export { SearchResults } from "./components/SearchResults"
export { SearchDropdown } from "./components/SearchDropdown"
```

- [ ] **Step 4: Create `features/artist/api/artist.ts` and the hook**

Create `src/renderer/src/features/artist/api/artist.ts`:
```ts
import { apiClient } from "@lib/axios"
import type { Song } from "@features/library/types"

export const getArtistTopTracks = async (name: string): Promise<Song[]> => {
  const resp = await apiClient.get<Song[]>(`/artist/${name}/top-tracks`)
  return resp.data
}
```

Create `src/renderer/src/features/artist/hooks/useArtist.ts`:
```ts
import { useQuery } from "@tanstack/react-query"
import { getArtistTopTracks } from "../api/artist"

export const artistKeys = { all: ["artist"] as const, top: (name: string) =>
  [...artistKeys.all, name] as const }

export const useArtist = (name: string) =>
  useQuery({ queryKey: artistKeys.top(name), queryFn: () => getArtistTopTracks(name), enabled: Boolean(name) })
```

- [ ] **Step 5: Move the artist view**

Run:
```bash
git mv src/renderer/src/views/artist/ArtistView.tsx  src/renderer/src/features/artist/components/ArtistView.tsx
```

In the moved file, update imports:
- `from "../../api/api"` -> `from "../api/artist"`
- `from "../../api/Song"` -> `from "@features/library/types"`
- `from "../../components/..."` -> `from "@components/..."`
- `from "../../utils/..."` -> `from "@utils/..."`

Update the component body to use `useArtist(name)` instead of direct API calls.

- [ ] **Step 6: Create `features/artist/index.ts`**

Create `src/renderer/src/features/artist/index.ts`:
```ts
export { ArtistView } from "./components/ArtistView"
```

- [ ] **Step 7: Update `app/router.tsx` to lazy-import search and artist**

Replace the search and artist route entries:
```ts
{ path: "/artist/:name", lazy: () => import("@features/artist").then(m => ({ Component: m.ArtistView })) },
{ path: "/search",     lazy: () => import("@features/search").then(m => ({ Component: m.SearchResults })) }
```

(Remove the eager `import { SearchResults } from "../../views/search/SearchResults";` and `import { ArtistView } from "../../views/artist/ArtistView";` lines.)

- [ ] **Step 8: Update consumers of `SearchDropdown`**

`TopNavBar` (in `components/layout/TopNavBar.tsx`) imports `SearchDropdown`. Update its import:
```ts
import { SearchDropdown } from "@features/search"
```

(Or keep `SearchDropdown` in `components/search/` and re-export from there if `TopNavBar` lives outside the search feature. The chosen location per the spec is `components/search/SearchDropdown.tsx`. But this task moves it to `features/search/components/SearchDropdown.tsx`. Update the import in `TopNavBar`.)

- [ ] **Step 9: Delete the old search and artist folders and `components/search/`**

Run:
```bash
git rm -r src/renderer/src/views/search src/renderer/src/views/artist
rmdir src/renderer/src/components/search
```

- [ ] **Step 10: Verify typecheck, dev server, and E2E**

Run: `pnpm typecheck:web`
Expected: no errors.

Run: `pnpm dev:web`. Confirm:
- Search from the top nav: results render.
- Click a song/album/video result: navigates correctly.
- Navigate to an artist page: top tracks render.

Run: `pnpm test:e2e -- e2e/gui.spec.ts`.
Expected: all GUI tests pass.

- [ ] **Step 11: Commit**

```bash
git add -A src/renderer/src/features/search src/renderer/src/features/artist src/renderer/src/components/layout src/renderer/src/app/router.tsx
git commit -m "Move search and artist features with lazy routes"
```

---

## Task 10: Final cleanup — delete old folders, add `ErrorBoundary`, update docs

**Files:**
- Delete: `src/renderer/src/App.tsx` (the old god component)
- Delete: `src/renderer/src/router.tsx` (replaced by `app/router.tsx`)
- Delete: `src/renderer/src/api/` (already empty after Task 7)
- Delete: `src/renderer/src/views/` (already empty after Task 9)
- Delete: `src/renderer/src/store/` (already empty after Task 3)
- Delete: `src/renderer/src/contexts/` (already empty after Task 6)
- Create: `src/renderer/src/components/common/ErrorBoundary.tsx`
- Modify: `src/renderer/src/app/AppShell.tsx` (wrap `<Outlet />` in `ErrorBoundary`)
- Modify: `src/renderer/src/app/App.tsx` (drop the `AppShell` import; just renders `<AppShell />` — already the case)
- Modify: `docs/implement_design.md` (document the new structure)

- [ ] **Step 1: Create `components/common/ErrorBoundary.tsx`**

Create `src/renderer/src/components/common/ErrorBoundary.tsx`:
```tsx
import { Component, type ReactNode } from "react"
import { Box, Typography } from "@mui/material"

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error)
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" color="error">Something went wrong</Typography>
          <Typography variant="body2">{this.state.error.message}</Typography>
        </Box>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Wrap the `<Outlet />` in `ErrorBoundary`**

In `src/renderer/src/app/AppShell.tsx`, wrap the `<Outlet />` (or the `<Suspense>`):
```tsx
<ErrorBoundary>
  <Suspense fallback={<LoadingFallback />}>
    <Outlet />
  </Suspense>
</ErrorBoundary>
```

- [ ] **Step 3: Delete the old `App.tsx`, `router.tsx`, and any remaining empty folders**

Verify nothing imports from these locations:
```bash
grep -rn "from \"./App\"\|from \"./router\"\|from \"./api/\"\|from \"./views/\"\|from \"./store/\"\|from \"./contexts/\"\|from \"\.\./App\"\|from \"\.\./router\"" src/renderer/src/
```
Expected: no matches.

Then:
```bash
git rm src/renderer/src/App.tsx src/renderer/src/router.tsx
rmdir src/renderer/src/api src/renderer/src/views src/renderer/src/store src/renderer/src/contexts 2>/dev/null || true
```

(Each `rmdir` is best-effort; if non-empty, leave for the next pass after fixing missed imports.)

- [ ] **Step 4: Verify `pnpm typecheck:web` is clean**

Run: `pnpm typecheck:web`
Expected: no errors.

- [ ] **Step 5: Verify chunk splitting**

Run: `pnpm build` (this builds the renderer for production). Inspect `out/renderer/assets/` (or wherever the chunks land — the location is set by the Vite build). Confirm there are at least 7 chunks: one per feature (player, library, album, playlist, search, artist, hosts), plus the main entry chunk. Use `ls -la out/renderer/assets/ | grep \.js$` (or PowerShell equivalent) to list them.

- [ ] **Step 6: Update `docs/implement_design.md`**

Add a new section after "Tech Stack" titled "Renderer Folder Structure" (or rename the section if appropriate). The content should reflect the new structure: `app/` shell, `features/` per domain, `components/` shared, `lib/` for axios and query client, `types/` for cross-feature types. Reference the spec for the full tree.

- [ ] **Step 7: Run the full E2E suite**

Run: `pnpm test:e2e`
Expected: all E2E tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A src/renderer/src docs/implement_design.md
git commit -m "Final cleanup: drop old App/router/views/store/contexts, add ErrorBoundary, update docs"
```

---

## Task 11: Polish — lint, typecheck, full tests, AGENTS.md

**Files:**
- Modify: `AGENTS.md` (if any project-structure descriptions are out of date)
- Modify: any files flagged by `pnpm lint`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: clean. If issues, fix them (likely unused imports after file moves).

- [ ] **Step 2: Run typecheck (full)**

Run: `pnpm typecheck`
Expected: no errors across node, web, and e2e.

- [ ] **Step 3: Run unit tests**

Run: `pnpm test`
Expected: all pass.

- [ ] **Step 4: Run E2E tests**

Run: `pnpm test:e2e`
Expected: all pass.

- [ ] **Step 5: Update `AGENTS.md` if needed**

Read `AGENTS.md`. If any line describes the old renderer structure (e.g., "src/renderer/src/views/", "src/renderer/src/api/"), update it to reflect the new structure (`src/renderer/src/features/`, `@features/...` aliases, etc.). The current `AGENTS.md` line "Project Structure" lists `src/renderer/` (React frontend, `/index.html`, `/password.html`, `src/`), so a small addition like "Renderer is organized as `app/` (shell), `features/` (per domain), `components/` (shared), `lib/` (axios/queryClient), `types/`" would suffice.

- [ ] **Step 6: Commit**

```bash
git add -A AGENTS.md
git commit -m "Update AGENTS.md to reflect new renderer structure"
```

(If `AGENTS.md` had no changes, skip this commit.)

---

## End

All 11 tasks complete. The renderer is now feature-based with React Query for server state, the `app/` shell composition is explicit, and `App.tsx` is gone. Each commit is independently revertible.
