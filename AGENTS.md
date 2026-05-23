# Agent Guidelines for Aimer Live CD Music Player

## Development Commands

- Install: `pnpm install`
- Development: `pnpm dev` (starts Electron-Vite dev server)
- Lint: `pnpm lint` (ESLint with caching)
- Typecheck: `pnpm typecheck` (runs both node and web typechecks)
  - Node: `pnpm typecheck:node` (tsconfig.node.json)
  - Web: `pnpm typecheck:web` (tsconfig.web.json)
- Format: `pnpm format` (Prettier)
- Test: `pnpm test` (vitest run)
- Test watch: `pnpm test:watch` (vitest watch mode)
- Test coverage: `pnpm test:coverage` (vitest with V8 coverage)
- E2E Test: `pnpm test:e2e` (playwright test)
- E2E Test (headed): `pnpm test:e2e:headed` (playwright test --headed)

## Build Commands

- Build: `npm run build` (electron-vite build)
- Build for Windows: `pnpm build:win` (build + electron-builder --win)
- Build for macOS: `pnpm build:mac` (electron-vite build + electron-builder --mac)
- Build for Linux: `pnpm build:linux` (electron-vite build + electron-builder --linux)
- Unpacked build: `pnpm build:unpack` (build + electron-builder --dir)

## Project Structure

- Main process: `src/main/index.ts`
- Preload: `src/preload/index.ts`
- Renderer (React): `src/renderer/`
  - Entry HTML: `src/renderer/index.html`
  - Password page: `src/renderer/password.html`
  - Source code: `src/renderer/src/`
    - Components: `src/renderer/src/components/`
      - `Sidebar.tsx` - Main navigation drawer
      - `TopNavBar.tsx` - Top navigation bar with search and user menu
      - `dialogs/ManageHostsDialog.tsx` - Host management dialog
      - `dialogs/AddHostDialog.tsx` - Add new host dialog
      - `types.ts` - Shared type definitions for components
- Backend (`src/main/backend/`): Layered architecture
  - `config/` - App configuration (constants, env)
  - `models/` - Mongoose schema definitions (Album, Song, Video, Hosting)
  - `db/` - Data access layer (Mongo.ts, builder pattern)
  - `routes/` - Express HTTP route handlers
  - `services/` - Business logic
    - `mediaUpload/` - FTP media upload service
    - `stream/` - Audio/video streaming logic
      - `dto/` - Stream data transfer objects
      - `part_provider/` - Hosting-specific stream providers
      - `providers/` - Third-party bypass utilities
  - `utils/` - Pure utility modules (crypto, stream, cache, http, log)
  - `types/` - Shared TypeScript type definitions
  - `scripts/` - Standalone scripts and PHP assets
  - `webdav/` - WebDAV server integration

## Important Notes

- Uses Electron-Vite v3.0.0
- Type checking requires both tsconfig.node.json and tsconfig.web.json
- ESLint cache is enabled (`.eslintcache`)
- Built files go to `./out/` directory
- Electron Builder configuration in `electron-builder.yml`
- Password generation script: `pnpm passgen` (src/main/backend/scripts/passgen.ts)
- Implement client API call in `src\renderer\src\core\api.ts`

## E2E Testing (Playwright)

- Test files: `e2e/` directory
  - `app.spec.ts` - Tests for password.html config dialog (first-run flow)
  - `main-app.spec.ts` - Tests for index.html main app (loads `.env`, skips config dialog)
- Configuration: `playwright.config.ts` (workers: 1, sequential execution)
- Each test suite uses isolated temp directories to avoid state leakage
- `main-app.spec.ts` loads `.env` via `dotenv.config()` and auto-fills config dialog
- Run specific test file: `pnpm test:e2e -- e2e/main-app.spec.ts`

## Environment Variables

- Env vars are loaded via encrypted `electron-store` config (no `.env` file needed)
- First run prompts for config (AES_PW, MongoDB credentials) via password window
- `src/main/index.ts` decrypts stored config and sets `process.env` on startup
- Critical vars:
  - `AES_PW`: 64-char hex string (32 bytes) for AES-256-CTR stream encryption
  - `MONGO_DB_HOST/USER/PW`: MongoDB connection details
- Password generation script `pnpm passgen` can generate a valid `AES_PW`

## Testing Policy

- Always write tests after implementing a new feature
- Unit tests: `src/` (co-located with source files as `*.test.ts`)
- E2E tests: `e2e/` directory (Playwright)
- Run `pnpm test` and `pnpm test:e2e` to verify before marking a feature complete

## Documentation

- Feature list and user-facing capabilities: `docs/features.md`
