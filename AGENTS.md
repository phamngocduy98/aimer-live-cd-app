# Agent Guidelines

## Commands

| Category  | Command          | Notes                                                      |
| --------- | ---------------- | ---------------------------------------------------------- |
| Install   | `pnpm install`   |                                                            |
| Dev       | `pnpm dev`       | Electron-Vite dev server                                   |
| Dev:Web   | `pnpm dev:server` | Standalone Express backend on :3001                       |
|           | `pnpm dev:web`    | Standalone Vite frontend on :5173, /api proxied to :3001  |
|           | `pnpm dev:both`   | Both together via concurrently                            |
| Lint      | `pnpm lint`      | ESLint w/ cache                                            |
| Typecheck | `pnpm typecheck` | node + web; separate: `typecheck:node`/`:web`              |
| Format    | `pnpm format`    | Prettier                                                   |
| Test unit | `pnpm test`      | vitest run; coverage `pnpm test:coverage`                  |
| Test E2E  | `pnpm test:e2e`  | playwright; headed: `:headed`                              |
| Build     | `pnpm build`     | electron-vite build; `build:win`/`:mac`/`:linux`/`:unpack` |

## Project Structure

- `src/main/index.ts` — main process
- `src/preload/index.ts` — preload
- `src/renderer/` — React frontend (`/index.html`, `/password.html`, `src/`)
  - `components/` — `Sidebar.tsx`, `TopNavBar.tsx`, `dialogs/`, `types.ts`
- `src/main/backend/` — layered backend (`config/`, `models/`, `db/`, `routes/`, `services/`, `utils/`, `types/`, `scripts/`, `webdav/`)
- Client API calls: `src/renderer/src/core/api.ts`

## Config & Env

- No `.env` file: vars stored in encrypted `electron-store`; set on startup via `src/main/index.ts`
- First run shows password window for `AES_PW` (64-char hex for AES-256-CTR) and `MONGO_DB_HOST/USER/PW`
- Standalone server (`dev:server`) reads `.env` directly via `dotenv/config`
- Built output: `./out/`; electron-builder config: `electron-builder.yml`
- Electron-Vite v3; typecheck needs both `tsconfig.node.json` + `tsconfig.web.json`

## E2E Testing

- `e2e/app.spec.ts` — first-run config dialog
- `e2e/main-app.spec.ts` — main app (loads `.env` via `dotenv.config()`, skips config)
- `playwright.config.ts` (workers: 1, sequential); isolated temp dirs per suite
- Run single file: `pnpm test:e2e -- e2e/main-app.spec.ts`
- Capture screenshots: `await mainWindow.screenshot({ path: "e2e/screens/name.png" })`

### Interactive Explore Testing (no Electron)
- Terminal 1: `pnpm dev:server` — Express backend on :3001
- Terminal 2: `pnpm dev:web` — Vite frontend on :5173
- Single terminal: `pnpm dev:both` — runs both together via concurrently
- Browser: `http://localhost:5173` — full app with DevTools

## Testing Policy

- Write tests for every new feature
- Unit tests: `*.test.ts` co-located with source; E2E: `e2e/`
- Run only related test files (e.g. `pnpm test -- songs.mongo metadata.test`) to save time; run full suite when user asks

## Docs

- Features: `docs/features.md`
