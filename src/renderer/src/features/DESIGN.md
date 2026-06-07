# Renderer Feature Decisions

This file records decisions shared by renderer features. It intentionally omits
API shapes and component walkthroughs that are clearer in code.

## Core Concepts

- **Route feature:** A domain page loaded by React Router, such as library,
  album, artist, search, or playlist.
- **Collection view:** A page that presents and locally filters a resource list,
  such as Songs, Albums, Videos, or Playlists.
- **Detail view:** A route centered on one resource and its related media, such
  as an album, artist, or playlist.
- **Server state:** Backend-owned data loaded and cached through TanStack Query.
- **Query invalidation:** Marking affected cached resources stale after a
  mutation so active views refetch authoritative data.
- **Play source:** Metadata describing the route and collection that started
  playback. It supports active-row identity and navigation from the queue.
- **Item occurrence:** One ordered appearance of media in a playlist. Two
  occurrences may reference the same media but remain distinct items.

## Feature Ownership

**Decision:** A feature owns its domain API functions, Query hooks, types, and
workflow-specific UI. Shared visual building blocks live in `components/`.

**Why:** Keeping workflows with their data prevents the app shell and shared
components from accumulating domain rules.

**Change guidance:** Move UI into `components/` only when it is reusable without
knowing a domain workflow. Expose cross-feature dependencies through a
feature's `index.ts` when possible.

**References:** [`router.tsx`](../app/router.tsx),
[`features/`](./), [`components/DESIGN.md`](../components/DESIGN.md)

## Routing and Feature Lifetime

**Decision:** Page features are lazy-loaded hash routes under one persistent
`AppShell`.

**Why:** Hash routing works in Electron packaging, route chunks avoid loading
every page up front, and persistent shell chrome keeps playback alive while the
page changes.

**Change guidance:** New page workflows should normally receive a route rather
than conditional rendering in `AppShell`. Do not mount a second player or
duplicate shell-level navigation inside a feature.

**References:** [`router.tsx`](../app/router.tsx),
[`AppShell.tsx`](../app/AppShell.tsx)

## Server State and Mutations

**Decision:** Library, album, artist, search, playlist, and host resources use
TanStack Query. Mutation success invalidates the smallest stable query-key
scope that can refresh affected views.

**Why:** The same resource can appear in the sidebar, list pages, detail pages,
and dialogs. Query invalidation keeps those views consistent without manual
refresh state or copied caches.

**Change guidance:** Define stable query keys beside each feature's hooks.
When adding a mutation, list every resource view it makes stale, but avoid
invalidating unrelated domains. Do not introduce refresh counters or duplicate
server objects in local or Redux state.

**References:** [`useLibrary.ts`](library/hooks/useLibrary.ts),
[`usePlaylists.ts`](playlist/hooks/usePlaylists.ts),
[`useHosts.ts`](hosts/hooks/useHosts.ts)

## Library and Detail Views

**Decision:** Library routes own collection filtering and launch playback with
an explicit play source. Album and artist routes compose shared media
components but own their hero, actions, and domain-specific presentation.

**Why:** Filtering is temporary view state, while play-source metadata is
needed globally to identify the active row and navigate back from the queue.
Detail pages have different content and responsive priorities despite sharing
cards and tables.

**Change guidance:** Preserve the source collection when starting playback.
Keep collection content aligned through shared page spacing rather than
per-item offsets. Do not force album, artist, and playlist heroes into one
abstraction unless their behavior genuinely converges.

**References:** [`SongList.tsx`](library/components/SongList.tsx),
[`AlbumView.tsx`](album/components/AlbumView.tsx),
[`ArtistView.tsx`](artist/components/ArtistView.tsx),
[`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Search

**Decision:** Search has two presentations: a debounced preview owned by the top
navigation and a route-backed full results page. Full results take the query
from the URL.

**Why:** Preview supports quick actions without navigation; URL state makes
complete results linkable and compatible with browser history.

**Change guidance:** Keep preview state transient and full-search state
route-backed. Results that start playback must provide a search play source.

**References:** [`TopNavBar.tsx`](../components/layout/TopNavBar.tsx),
[`SearchResults.tsx`](search/components/SearchResults.tsx)

## Playlists

**Decision:** Playlists may contain audio and video items. Item occurrence
identity, not only media ID, identifies rows and playback entries. Duplicate
insertion requires explicit confirmation.

Playlist detail presentation progressively removes secondary information
within the compact desktop/tablet band. Album, duration, artist, and secondary
actions may disappear as horizontal space tightens; the list itself must not
become horizontally scrollable. True mobile uses its own stacked, touch-sized
composition rather than inheriting the narrowest desktop controls.

The playlist media hero also reduces artwork, typography, spacing, and minimum
height below the expanded desktop band. Compact heroes must keep identity,
metadata, primary playback, and edit access visible without reserving a
viewport-height banner on smaller devices.

**Why:** A mixed playlist is one ordered playback context, and the same media
may intentionally appear more than once. Media ID alone cannot identify which
occurrence is active or removed.

**Change guidance:** Preserve item IDs as playback source keys. Mutations must
refresh both playlist summaries and affected detail data where applicable.
Do not silently collapse duplicates or assume every playlist item is a song.
Keep primary playback, edit, item actions, title, and occurrence order
reachable while reducing secondary columns and controls.

**References:** [`types.ts`](playlist/types.ts),
[`PlaylistView.tsx`](playlist/components/PlaylistView.tsx),
[`AddToPlaylistDialog.tsx`](playlist/components/AddToPlaylistDialog.tsx),
[`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Host Administration

**Decision:** Host management is a shell-opened feature dialog, while host data
and mutations remain owned by the hosts feature. File lists are queried only
for the expanded host.

**Why:** Administration is globally reachable but is not part of normal page
navigation. Conditional file queries avoid probing every remote host when the
dialog opens.

**Change guidance:** Keep credentials and host workflows out of shared layout
components. Preserve explicit loading and unavailable states for remote file
listing.

**References:** [`ManageHostsDialog.tsx`](hosts/components/ManageHostsDialog.tsx),
[`useHosts.ts`](hosts/hooks/useHosts.ts),
[`admin.spec.ts`](../../../../e2e/admin.spec.ts)

## Current Non-Decisions

Placeholder or absent behavior is not an architectural commitment. In
particular, suggested tracks are currently a placeholder and chapter editing is
not implemented in the renderer. Consult the GUI expectations and skipped E2E
coverage before treating either as finished behavior.
