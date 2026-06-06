# Agent Guidelines

## Commands

| Category  | Command           | Notes                                                      |
| --------- | ----------------- | ---------------------------------------------------------- |
| Install   | `pnpm install`    |                                                            |
| Dev       | `pnpm dev`        | Electron-Vite dev server                                   |
| Dev:Web   | `pnpm dev:server` | Standalone Express backend on :3001                        |
|           | `pnpm dev:web`    | Standalone Vite frontend on :5173, /api proxied to :3001   |
|           | `pnpm dev:both`   | Both together via concurrently                             |
| Lint      | `pnpm lint`       | ESLint w/ cache                                            |
| Typecheck | `pnpm typecheck`  | node + web + e2e; separate: `typecheck:node`/`:web`/`:e2e` |
| Format    | `pnpm format`     | Prettier                                                   |
| Test unit | `pnpm test`       | vitest run; coverage `pnpm test:coverage`                  |
| Test E2E  | `pnpm test:e2e`   | playwright; headed: `:headed`                              |
| Build     | `pnpm build`      | electron-vite build; `build:win`/`:mac`/`:linux`/`:unpack` |

## Docs (read these first — key to understanding the app)

- **GUI expected features (test plan):** `docs/gui_expected_features.md` — current source for GUI E2E scenarios
- **Implementation & design:** `docs/implement_design.md`

## Project Structure

- `src/main/index.ts` — main process
- `src/preload/index.ts` — preload
- `src/renderer/` — React frontend (`/index.html`, `/password.html`, `src/`)
  - `app/` — providers, router, Redux store, and application shell
  - `features/` — domain APIs, hooks, types, and components
  - `components/` — shared layout, media, view, search, and common UI
  - `lib/` — Axios and TanStack Query clients
- `src/main/backend/` — layered backend (`config/`, `models/`, `db/`, `routes/`, `services/`, `utils/`, `types/`, `scripts/`, `webdav/`)
- Client API calls: `src/renderer/src/core/api.ts`

## Config & Env

- No `.env` file: vars stored in encrypted `electron-store`; set on startup via `src/main/index.ts`
- First run shows password window for `AES_PW` (64-char hex for AES-256-CTR) and `MONGO_DB_HOST/USER/PW`
- Standalone server (`dev:server`) reads `.env` directly via `dotenv/config`
- Built output: `./out/`; electron-builder config: `electron-builder.yml`
- Electron-Vite v3; typecheck uses `tsconfig.node.json`, `tsconfig.web.json`, and `tsconfig.e2e.json` (e2e)

## E2E Testing

- `e2e/admin.spec.ts` — Manage Hosts dialog coverage using seeded E2E data
- `e2e/gui.spec.ts` — GUI coverage based on `docs/gui_expected_features.md`
- Shared utils in `e2e/utils/`:
  - `types.ts` — `ElectronApp`, `ElectronTestContext`, `LaunchOptions`
  - `temp-dir.ts` — `createTempDir`, `cleanupTempDir`
  - `electron-app.ts` — `launchApp` (Electron lifecycle, window detection, resize)
  - `first-setup-dialog.ts` — first-run config auto-fill from `.env`
  - `test-data.ts` — deterministic MongoDB seed data for E2E runs
- `playwright.config.ts` (workers: 1, sequential); isolated temp dirs per suite
- Typechecked via `tsconfig.e2e.json` (`pnpm typecheck:e2e`)
- E2E launch uses built Electron output from `out/main/index.js`; run `pnpm build` after source changes before E2E
- E2E seeds MongoDB per spec run; default `MONGO_DB_NAME=musicbtxa_e2e`, and seeding refuses DB names that do not end with `_e2e` or `_test`
- E2E launches Electron with `E2E_TEST_MODE=true`; backend stream routes return deterministic local fixture media in this mode
- Run single file: `pnpm test:e2e -- e2e/gui.spec.ts`
- Capture screenshots: `await mainWindow.screenshot({ path: "e2e/screens/name.png" })`

### Interactive Explore Testing (no Electron, with playwright-cli)

- Single terminal: `pnpm dev:both` — Express backend + Vite frontend via concurrently
- Browser: `http://localhost:5173` — full app with DevTools

## Testing Policy

- Write tests for every new feature
- Unit tests: `*.test.ts` co-located with source; E2E: `e2e/`
- Run only related test files (e.g. `pnpm test -- songs.mongo metadata.test`) to save time; run full suite when user asks

## Frontend Design Skill

- Installed at `~/.claude/skills/frontend-design/` — Anthropic's official frontend design skill
- Produces distinctive, non-generic UI with strong aesthetic direction
- Auto-discovered by opencode; invoke via `use frontend-design skill` in prompts

## Superpowers

- Installed as plugin in `opencode.jsonc` — https://github.com/obra/superpowers
- Agentic software development methodology with composable skills
- Skills include: brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, subagent-driven-development, requesting-code-review, and more
- To use: skills auto-trigger based on context; also `skill tool load superpowers/<name>`
- Restart opencode after install for plugin to load
