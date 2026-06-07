# Mobile Navigation Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `MobileNavigation` so the bottom bar reads as a compact, balanced pill with a clearly defined active state and prominent icons, without changing routes, icons, or accessibility contracts.

**Architecture:** Extract the styled `sx` values into named exports from `MobileNavigation.tsx` so they are unit-testable in the current `node` vitest environment. Update the values, apply them in the component, then verify via unit tests, lint, typecheck, and the existing E2E suite.

**Tech Stack:** React 18, MUI v6 (`Box`, `IconButton`), React Router (`NavLink`), Vitest (node env), Playwright E2E.

---

## File Structure

- `src/renderer/src/components/layout/MobileNavigation.tsx` — modify. Extract sx values to named exports; update the visual constants; use them in the existing `Box` and `IconButton`.
- `src/renderer/src/components/layout/MobileNavigation.test.ts` — modify. Add tests for the extracted sx values and confirm existing `isMobileNavItemActive` assertions still pass.
- `docs/superpowers/specs/2026-06-07-mobile-navigation-restyle-design.md` — reference only; no edits.

No other files change. `Player.tsx` outer container, route helper, icons, and `aria-label`s are preserved.

---

## Task 1: Extract and update styled values + tests

**Files:**
- Modify: `src/renderer/src/components/layout/MobileNavigation.tsx:1-63`
- Modify: `src/renderer/src/components/layout/MobileNavigation.test.ts:1-17`

- [ ] **Step 1: Add the failing test for the extracted sx values**

Replace `src/renderer/src/components/layout/MobileNavigation.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { isMobileNavItemActive } from "./mobileNavigationRoutes";
import { activeIconButtonSx, containerSx, iconButtonSx, iconFontSize } from "./MobileNavigation";

describe("isMobileNavItemActive", () => {
  it("matches collection routes and their detail routes", () => {
    expect(isMobileNavItemActive("/albums", "/albums")).toBe(true);
    expect(isMobileNavItemActive("/album/album-id", "/albums")).toBe(true);
    expect(isMobileNavItemActive("/playlists", "/playlists")).toBe(true);
    expect(isMobileNavItemActive("/playlist/playlist-id", "/playlists")).toBe(true);
  });

  it("does not match unrelated routes or partial route names", () => {
    expect(isMobileNavItemActive("/songs", "/")).toBe(false);
    expect(isMobileNavItemActive("/songwriter", "/songs")).toBe(false);
    expect(isMobileNavItemActive("/search", "/songs")).toBe(false);
  });
});

describe("MobileNavigation styled values", () => {
  it("uses a compact pill container height", () => {
    expect(containerSx.height).toBe(58);
  });

  it("renders inactive items with the E2E color and a transparent background", () => {
    expect(iconButtonSx.color).toBe("rgba(239,235,220,.62)");
    expect(iconButtonSx.bgcolor).toBe("transparent");
  });

  it("highlights the active item with a visible white tint and white icon color", () => {
    expect(activeIconButtonSx.color).toBe("#fff");
    expect(activeIconButtonSx.bgcolor).toBe("rgba(255,255,255,.18)");
    expect(activeIconButtonSx.borderRadius).toBe("999px");
  });

  it("uses a 24px icon font size for prominence", () => {
    expect(iconFontSize).toBe(24);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (the new exports don't exist yet)**

Run: `pnpm test -- MobileNavigation`
Expected: FAIL — `Failed to resolve import "./MobileNavigation"` for `activeIconButtonSx`, `containerSx`, `iconButtonSx`, `iconFontSize`.

- [ ] **Step 3: Refactor `MobileNavigation.tsx` to export the styled values and apply them**

Replace the entire contents of `src/renderer/src/components/layout/MobileNavigation.tsx` with:

```tsx
import AlbumOutlinedIcon from "@mui/icons-material/AlbumOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, IconButton } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { isMobileNavItemActive } from "./mobileNavigationRoutes";

const items = [
  { label: "Home", path: "/", icon: HomeOutlinedIcon },
  { label: "Songs", path: "/songs", icon: MusicNoteOutlinedIcon },
  { label: "Albums", path: "/albums", icon: AlbumOutlinedIcon },
  { label: "Playlists", path: "/playlists", icon: LibraryMusicOutlinedIcon },
  { label: "Search", path: "/search", icon: SearchOutlinedIcon }
];

export const containerSx = {
  height: 58,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-around",
  px: 1
} as const;

export const iconFontSize = 24;

const baseIconButtonSx = {
  width: 64,
  height: 46,
  borderRadius: "999px",
  transition: "color 160ms ease, background-color 160ms ease",
  "&:hover": {
    color: "#fff",
    bgcolor: "rgba(255,255,255,.07)"
  }
} as const;

export const iconButtonSx = {
  ...baseIconButtonSx,
  color: "rgba(239,235,220,.62)",
  bgcolor: "transparent",
  "&:hover": {
    ...baseIconButtonSx["&:hover"]
  }
} as const;

export const activeIconButtonSx = {
  ...baseIconButtonSx,
  color: "#fff",
  bgcolor: "rgba(255,255,255,.18)",
  "&:hover": {
    ...baseIconButtonSx["&:hover"],
    bgcolor: "rgba(255,255,255,.18)"
  }
} as const;

export function MobileNavigation(): React.JSX.Element {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Mobile navigation"
      onClick={(event) => event.stopPropagation()}
      sx={containerSx}
    >
      {items.map(({ label, path, icon: Icon }) => {
        const selected = isMobileNavItemActive(location.pathname, path);
        return (
          <IconButton
            key={label}
            component={NavLink}
            to={path}
            aria-label={label}
            aria-current={selected ? "page" : undefined}
            sx={{
              ...(selected ? activeIconButtonSx : iconButtonSx),
              "& .MuiSvgIcon-root": { fontSize: iconFontSize }
            }}
          >
            <Icon />
          </IconButton>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- MobileNavigation`
Expected: PASS — both `isMobileNavItemActive` and `MobileNavigation styled values` describe blocks green.

- [ ] **Step 5: Lint and typecheck**

Run: `pnpm lint` and `pnpm typecheck`
Expected: both pass with no errors. The `as const` exports give us literal types so the test assertions match exactly.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/layout/MobileNavigation.tsx src/renderer/src/components/layout/MobileNavigation.test.ts
git commit -m "style(mobile-nav): compact pill, prominent active state, 24px icons"
```

---

## Task 2: E2E verification

**Files:**
- No file edits; verification only.

- [ ] **Step 1: Build the renderer so E2E has up-to-date output**

Run: `pnpm build`
Expected: build completes; `out/main/index.js` and `out/renderer/...` regenerated.

- [ ] **Step 2: Run the GUI E2E suite**

Run: `pnpm test:e2e -- e2e/gui.spec.ts`
Expected: PASS. Pay attention to the mobile navigation block (around lines 567–612 in `e2e/gui.spec.ts`):
- `getByRole("navigation", { name: "Mobile navigation" })` visible at 390 px
- `getByRole("link", { name: "Home" })`, `"Songs"`, `"Albums"`, `"Playlists"`, `"Search"` all present
- After clicking `"Songs"`, `aria-current="page"` and `color: rgb(255, 255, 255)` on the Songs link
- `"Search"` link retains `color: rgba(239, 235, 220, 0.62)`

If any E2E assertion fails, the sx values drifted away from the contract — fix and re-run before committing.

- [ ] **Step 3: Commit only if E2E required a fix**

Skip this step if E2E passed unchanged. Otherwise:

```bash
git add -A
git commit -m "fix(mobile-nav): restore E2E color/aria contract"
```

---

## Self-Review

- **Spec coverage:**
  - Container height 50 → 58 → Task 1 Step 3 (`containerSx.height: 58`)
  - Icon size 22 → 24 → Task 1 Step 3 (`iconFontSize: 24`)
  - Active background `.14` → `.18` → Task 1 Step 3 (`activeIconButtonSx.bgcolor`)
  - Active pill dimensions 56×40 → 64×46 → Task 1 Step 3 (`baseIconButtonSx`)
  - Aria labels / aria-current / landmark preserved → Task 1 Step 3 (no change to those props)
  - Test added for new values → Task 1 Step 1
  - E2E verification → Task 2
- **Placeholder scan:** No TBDs, no "etc." steps, every code block is complete.
- **Type consistency:** Exported `as const` objects keep the test assertions exact. `iconFontSize` matches the value spread into the sx prop.
