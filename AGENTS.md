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

## Important Notes
- Uses Electron-Vite v3.0.0
- Type checking requires both tsconfig.node.json and tsconfig.web.json
- ESLint cache is enabled (`.eslintcache`)
- Built files go to `./out/` directory
- Electron Builder configuration in `electron-builder.yml`
- Password generation script: `pnpm passgen` (src/main/backend/passgen.ts)