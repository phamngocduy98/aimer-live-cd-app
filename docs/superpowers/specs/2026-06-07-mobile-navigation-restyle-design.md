# Mobile Navigation Restyle

## Problem

The current mobile bottom navigation has visual issues when no media is playing:

- Container proportions are too wide/flat — height-to-width ratio reads as stretched
- Active state highlight is too subtle and visually loose
- Icons feel small relative to the container
- Spacing is loose, making the bar feel empty

The container shell (dark pill, border, backdrop blur) is already correct. The issues are the internal layout and active-state emphasis.

## Goal

Restyle `MobileNavigation` to match a cleaner, more balanced pill reference: compact container, clearly defined active pill, more prominent icons, tighter spacing.

Constraints:
- Keep all 5 routes: Home, Songs, Albums, Playlists, Search
- Keep all 5 icons: HomeOutlinedIcon, MusicNoteOutlinedIcon, AlbumOutlinedIcon, LibraryMusicOutlinedIcon, SearchOutlinedIcon
- Keep `aria-label` values: "Home", "Songs", "Albums", "Playlists", "Search"
- Keep `aria-current="page"` on the selected item
- Keep E2E color selectors compatible: active `rgb(255, 255, 255)`, inactive `rgba(239, 235, 220, 0.62)`
- Keep `<Box component="nav" aria-label="Mobile navigation">` landmark
- Keep `onClick stopPropagation` behavior used by the player shell
- Keep import path `@components/layout/MobileNavigation` and the existing `mobileNavigationRoutes` helper

## Design

### Container

`MobileNavigation` root `Box`:
- Height: `50` → `58`
- `pb: 0.5` → removed (rely on container height)
- `px: 1` kept

Item layout stays `display: flex; justify-content: space-around` so E2E role-based selectors continue to find each link.

### Icon Button

Each item's `IconButton`:
- `width: 56` → `64`
- `height: 40` → `46`
- `borderRadius: "999px"` kept
- `color: selected ? "#fff" : "rgba(239,235,220,.62)"` kept (E2E contract)
- `bgcolor: selected ? "rgba(255,255,255,.18)" : "transparent"` (was `.14` — more visible active pill)
- `transition` kept
- `&:hover` color/bg kept
- `& .MuiSvgIcon-root` font size: `22` → `24` (more prominent icons)

### Active Pill Visibility

The `.18` active background is the primary visual change. Combined with the larger button (64×46) the pill reads as a clear, compact highlight on a 58px-tall container.

### Untouched

- `Player.tsx` outer container (border-radius 30, blur, border) — already correct
- `mobileNavigationRoutes.ts` `isMobileNavItemActive` logic
- `MobileNavigation.test.ts` route-matching tests
- Route paths, labels, and icons
- "Mobile navigation" landmark name

## Files

- `src/renderer/src/components/layout/MobileNavigation.tsx` — restyle
- `src/renderer/src/components/layout/MobileNavigation.test.ts` — add a test for the new sx values (active bg, height, icon size) so a future regression is caught
- `e2e/gui.spec.ts` — no changes expected; existing color/role selectors should still pass

## Verification

- `pnpm test -- MobileNavigation`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:e2e -- e2e/gui.spec.ts` (existing mobile navigation assertions must still pass)
