# Agent Guidelines for Aimer Live CD Music Player

## Development Commands

- Install: `pnpm install`
- Development: `pnpm dev` (starts Electron-Vite dev server)
- Lint: `pnpm lint` (ESLint with caching)
- Typecheck: `pnpm typecheck` (runs both node and web typechecks)
  - Node: `pnpm typecheck:node` (tsconfig.node.json)
  - Web: `pnpm typecheck:web` (tsconfig.web.json)
- Format: `pnpm format` (Prettier)

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

## Important Notes

- Uses Electron-Vite v3.0.0
- Type checking requires both tsconfig.node.json and tsconfig.web.json
- ESLint cache is enabled (`.eslintcache`)
- Built files go to `./out/` directory
- Electron Builder configuration in `electron-builder.yml`
- Password generation script: `pnpm passgen` (src/main/backend/passgen.ts)
- Implement client API call in `src\renderer\src\core\api.ts`

## Environment Variables

- Env vars are loaded via encrypted `electron-store` config (no `.env` file needed)
- First run prompts for config (AES_PW, MongoDB credentials) via password window
- `src/main/index.ts` decrypts stored config and sets `process.env` on startup
- Critical vars:
  - `AES_PW`: 64-char hex string (32 bytes) for AES-256-CTR stream encryption
  - `MONGO_DB_HOST/USER/PW`: MongoDB connection details
- Password generation script `pnpm passgen` can generate a valid `AES_PW`