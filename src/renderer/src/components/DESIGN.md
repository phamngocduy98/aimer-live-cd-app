# Shared Component Decision Guide

Shared components provide reusable renderer presentation. They should not own
domain fetching, mutations, or workflow state.

## Core Concepts

- **Shared component:** Reusable presentation controlled through props rather
  than a feature-specific API or mutation.
- **Shell chrome:** Persistent application controls outside route content,
  including navigation and the top bar.
- **Page scaffold:** Shared page framing for top-bar clearance, player
  clearance, width, background, and responsive padding.
- **Media component:** A reusable representation of a song, video, album, or
  playlist, such as a card, table, shelf, or actions menu.
- **Action surface:** The menu, dialog, button group, or compact control used to
  expose the same action at a given width.
- **Responsive band:** One of the mobile, compact desktop/tablet, or expanded
  desktop width ranges. A band changes presentation, not domain ownership.
- **Accessibility contract:** A stable role, landmark, or accessible name used
  by keyboard users and role-based E2E selectors.
- **Media Detail Page:** The album-style hero, identity, actions, and content
  composition shared by Album, Playlist, Video, and future album-style pages.
- **Filtered Collection Page:** The shared header, filter, content alignment,
  and state contract used by Albums, Songs, Videos, and Playlists.

## Shared Versus Feature UI

**Decision:** A component belongs here when multiple features can use it through
presentation-oriented props without importing a domain API or workflow hook.

**Why:** Shared components reduce visual duplication, but domain-aware shared
components become hidden feature coordinators and make changes harder to
reason about.

**Change guidance:** Keep API calls and mutations in features. A shared
component may dispatch established player actions when media playback is part
of its explicit contract, but feature-specific orchestration stays with the
caller.

**References:** [`features/DESIGN.md`](../features/DESIGN.md),
[`media/`](media/), [`view/`](view/)

## Layout Components

**Decision:** `Sidebar`, `TopNavBar`, and `MobileNavigation` are shell chrome,
not route content. Desktop/tablet use the sidebar; mobile uses bottom
navigation. The top bar owns search preview and the global administration
entry point.

**Why:** Navigation must remain stable across routes while adapting to available
space. Search preview needs global access without turning every page into a
search owner.

**Change guidance:** Preserve route-aware active states and the responsive
handoff between sidebar and mobile navigation. Do not duplicate these controls
inside feature pages.

**References:** [`AppShell.tsx`](../app/AppShell.tsx),
[`layout/`](layout/), [`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Responsive Shell Model

**Decision:** Shell behavior follows three width bands based on the default MUI
breakpoints.

| Width band                                               | Shell decision                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile: below `sm` (600 px)                              | Hide the sidebar, desktop search, and avatar menu. Show bottom mobile navigation with the compact player, or by itself when nothing is playing.  |
| Compact desktop/tablet: `sm` to below `lg` (600–1199 px) | Keep desktop-style top bar, player chrome, and permanent sidebar, but default the sidebar to its collapsed width. Do not show mobile navigation. |
| Expanded desktop: `lg` and above (1200 px+)              | Default the permanent sidebar to its expanded width. Keep the same desktop top bar and player model.                                             |

**Why:** The app needs a true touch-oriented mobile composition, but intermediate
windows still have enough room for desktop controls. Collapsing instead of
replacing the sidebar avoids an abrupt desktop/mobile switch at tablet widths.

**Change guidance:** Treat `sm` as the mobile/desktop composition boundary and
`lg` as the default sidebar expansion boundary. A manual sidebar toggle may
override the default until a breakpoint change recalculates it. If either
boundary changes, review top-bar width, route padding, player chrome, search
availability, and navigation reachability together.

**Test anchors:** E2E exercises 390 px mobile, 800/1024 px compact desktop, and
1280 px expanded desktop. These widths are representative checks, not additional
breakpoints.

**References:** [`AppShell.tsx`](../app/AppShell.tsx),
[`Sidebar.tsx`](layout/Sidebar.tsx),
[`TopNavBar.tsx`](layout/TopNavBar.tsx),
[`MobileNavigation.tsx`](layout/MobileNavigation.tsx),
[`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Page Spacing and Alignment

**Decision:** Page-level width, horizontal padding, top-bar clearance, and
player clearance come from shared scaffolds and headers. Collection headings
and their first table/grid content share the same horizontal alignment.

**Why:** Repeating independent margins caused visible drift between related
screens and makes responsive changes inconsistent.

**Change guidance:** Extend `PageScaffold`, `CollectionHeader`, or section
containers before adding compensating offsets to individual cards or rows.
Check alignment at all breakpoints after changing shared spacing.

**References:** [`PageScaffold.tsx`](view/PageScaffold.tsx),
[`CollectionHeader.tsx`](view/CollectionHeader.tsx),
[`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Design Tokens And Page Families

**Decision:** Reusable renderer visual values live in the typed
`Theme.design` object. `MediaDetailHero`, `MediaDetailIdentity`,
`DetailActions`, and `DetailContent` implement the **Media Detail Page**.
`CollectionHeader`, `CollectionContent`, and `PageState` implement the
**Filtered Collection Page**.

**Change guidance:** Do not create feature-local page widths, gutters, card
radii, shadows, or palette values when the theme expresses the decision. New
album-style pages use the detail-page composition exactly. New searchable
library pages use the filtered-collection composition whether their content is
a grid or table.

**References:** [`theme.ts`](../app/theme.ts),
[`designSystem.tsx`](view/designSystem.tsx),
[`MediaDetailPage.tsx`](view/MediaDetailPage.tsx),
[`renderer_design_system.md`](../../../../docs/renderer_design_system.md)

## Media Components

**Decision:** Shared media cards, shelves, tables, and action menus own
consistent representation and interaction surfaces. The feature supplies the
collection, play source, and workflow callbacks.

The currently playing song uses the shared yellow now-playing color and a
subtle yellow row background wherever it appears as an active list row,
including collection tables, playlist detail, and the play queue.

**Why:** Albums, songs, and videos appear in several routes, but their queue
context and mutations differ by feature.

**Change guidance:** Avoid embedding route-specific fetching in media
components. Preserve source-aware active-row behavior and mixed audio/video
support when extending tables or menus. Do not introduce feature-specific
active-row colors; use the shared now-playing presentation.

Album and Video cards use `MediaCard` with `square` and `landscape` artwork
variants respectively. Resource wrappers retain navigation, playback source,
favorite behavior, menus, and metadata formatting. Do not introduce another
card frame for a resource that can map to this presentation contract.

**References:** [`media/`](media/),
[`player/DESIGN.md`](../features/player/DESIGN.md)

## Responsive Actions

**Decision:** The same action may use a menu, dialog, or compact control at
different widths, but its accessible name and outcome remain stable.

**Why:** Desktop hover/menu patterns do not always fit touch layouts, while
stable semantics support keyboard use and resilient E2E selectors.

**Change guidance:** Treat `aria-label`, roles, and landmark names as behavior
contracts. Prefer role/name selectors over styling or DOM-position selectors
when adding tests.

**References:** [`MediaActionsMenu.tsx`](media/MediaActionsMenu.tsx),
[`SongTable.tsx`](media/SongTable.tsx),
[`gui.spec.ts`](../../../../e2e/gui.spec.ts)

## Loading and Failure Boundaries

**Decision:** Route loading and render failures are handled around the route
outlet, while feature request states remain inside the owning feature.

**Why:** A route chunk or page render failure should not remove persistent
shell/player UI. Request-specific recovery requires domain context.

**Change guidance:** Keep `Suspense` and the error boundary around route content.
Do not use the global boundary as a replacement for explicit query loading,
empty, or error states.

**References:** [`AppShell.tsx`](../app/AppShell.tsx),
[`common/`](common/)
