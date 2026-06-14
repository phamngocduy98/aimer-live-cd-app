# Renderer Decision Guide

This guide records renderer decisions that are easy to break or expensive to
rediscover. Read it before changing renderer behavior. Use the linked code and
tests for mechanics; these documents explain intent, ownership, and invariants.

## Core Concepts

- **Renderer:** The React application running in Electron's renderer process.
  It includes pages, navigation, dialogs, and playback UI, but not the backend
  or Electron main process.
- **App shell / chrome:** UI that persists while routes change, including the
  sidebar, top bar, global dialogs, and player.
- **Feature:** A business domain that owns its workflow, data access, and
  feature-specific UI, such as playlists or albums.
- **Shared component:** Reusable presentation that does not own a business
  workflow or server resource.
- **Compact player:** The persistent mini-player shown near the bottom edge.
- **Expanded player:** The large player presentation opened from the compact
  player. Tests may call this the "full screen player"; it is distinct from
  browser or operating-system fullscreen.
- **Compact video:** Video displayed inside the compact player's video area.
  It uses the same persistent runtime as expanded video.

## UI Ownership Tree

```text
main.tsx
├── QueryClientProvider
├── Redux Provider
└── App
    └── Theme providers
        └── RouterProvider
            └── AppShell
                ├── Sidebar
                ├── lazy route content (Outlet)
                ├── TopNavBar
                ├── persistent Player
                └── shell-owned dialogs
```

`AppShell` owns application chrome and transient orchestration. Route features
own page behavior. The player remains mounted across route changes so playback
does not restart during navigation.

## State Boundaries

| State                                                 | Owner             | Reason                                                                |
| ----------------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| Current screen, route parameters, search query        | React Router      | Navigation must be linkable and survive route transitions.            |
| Backend resources and mutation refresh                | TanStack Query    | Server data needs caching, request status, and targeted invalidation. |
| Queue, current media, playback controls, player views | Redux             | Playback spans routes and coordinates distant controls and runtimes.  |
| Filters, menus, dialog visibility, draft forms        | Local React state | Short-lived UI state should stay near the component using it.         |

Before moving state, verify that its lifetime and consumers actually cross the
current ownership boundary. Do not put fetched resource copies in Redux or
transient component state in the global store without a concrete need.

## Responsive Model

The renderer intentionally uses three width bands: mobile below MUI `sm`,
compact desktop/tablet from `sm` through below `lg`, and expanded desktop at
`lg` and above. Responsive behavior changes navigation and presentation, not
feature or playback ownership. See the shared component and player guides
before changing breakpoints.

## Renderer Design System

Reusable visual values are owned by the typed `Theme.design` tokens. Album and
Video cards use the shared `MediaCard`; Album, Playlist, and Video details use
the **Media Detail Page** family; Albums, Songs, Videos, and Playlists use the
**Filtered Collection Page** family. New pages described as album-style must
consume the shared detail composition rather than copy album CSS.

Videos are independent artist-managed releases. They own their cover, year,
genres, artists, and chapters; renderer code must not infer video artwork or
release metadata from an album.

Do not add new raw colors, shadows, radii, page widths, or responsive gutters
to feature components when a theme token or shared primitive can represent the
same decision. See the [renderer design-system reference](docs/renderer_design_system.md).

Scrollable immersive surfaces, including expanded lyrics, must inherit the
global `::-webkit-scrollbar` styles from
[`index.css`](src/renderer/src/index.css). Keep the scroll container inset from
the viewport edge, but do not set `scrollbarColor`, `scrollbarWidth`, or local
`::-webkit-scrollbar` overrides in feature components. See the player guide for
lyric alignment, fade-mask, and artwork-column constraints.

## Dependency Rules

- `app/` composes providers, routing, global store, and shell chrome.
- `features/` owns domain APIs, queries, mutations, types, and feature-specific
  UI. Cross-feature imports should use the feature's public `index.ts` when an
  export is available.
- `components/` contains reusable UI that does not own a business workflow.
- `lib/` configures infrastructure clients; `utils/` contains pure helpers.
- Tests and implementation remain authoritative for detailed behavior. Update
  the relevant decision guide when a change intentionally alters an invariant.

## Detailed Guides

- [Feature decisions](src/renderer/src/features/DESIGN.md)
- [Player decisions](src/renderer/src/features/player/DESIGN.md)
- [Shared component decisions](src/renderer/src/components/DESIGN.md)
- [Renderer design system](docs/renderer_design_system.md)
- [System implementation overview](docs/implement_design.md)
- [GUI acceptance expectations](docs/gui_expected_features.md)
- [Renderer E2E coverage](e2e/gui.spec.ts)
- [Admin E2E coverage](e2e/admin.spec.ts)
