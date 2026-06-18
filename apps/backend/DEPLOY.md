# Backend Deploy Contract

The backend is a standalone Node/Express app rooted at `apps/backend`.
Electron and the standalone web renderer call it over HTTP through
`API_BASE_URL` and `STREAM_BASE_URL`; Electron must not import backend modules
or connect to MongoDB directly.

## Commands

- Dev: `pnpm backend:dev`
- Typecheck: `pnpm typecheck:backend`
- Build: `pnpm backend:build` (compiles TypeScript and copies PHP helper assets)
- Start built output: `pnpm backend:start`

## Entrypoint

- Source entrypoint: `apps/backend/src/standalone.ts`
- Built entrypoint: `apps/backend/dist/standalone.js`
- Default port: `3001`, overridden by `PORT`
- Vercel function entrypoint: `api/index.ts`

## Required Environment

- `MONGO_DB_HOST`
- `MONGO_DB_NAME`
- `MONGO_DB_USER`
- `MONGO_DB_PW`
- `AUTH_SESSION_SECRET`
- `DB_STORE_PW`
- `AES_PW`

## Deployment Environment

- `PORT` sets the HTTP port.
- `CORS_ORIGIN` can be a comma-separated list of allowed origins. Omit it for
  permissive local/dev behavior.
- `AUTH_COOKIE_SAMESITE` defaults to `None` in production and `Lax` otherwise.
- `AUTH_COOKIE_SECURE` can force secure cookies with `true` or disable them
  with `false`.

## Optional Services

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` seed the first admin.
- `MYMEMORY_EMAIL` raises MyMemory translation quota.
- `LIBRETRANSLATE_URL` enables LibreTranslate.
- `LIBRETRANSLATE_API_KEY` supplies the optional LibreTranslate key.
- `YT_DLP_PATH` points YouTube metadata import at a specific `yt-dlp` binary.

## Vercel Deployment

- Import the GitHub repository from the repo root so Vercel can read
  `package.json`, `pnpm-lock.yaml`, `api/index.ts`, and `vercel.json`.
- Vercel install command: `pnpm install --frozen-lockfile`.
- Vercel build command: `pnpm typecheck:backend && pnpm typecheck:vercel`.
- `api/index.ts` initializes MongoDB, the first admin seed, and WebDAV once per
  warm function instance before handing requests to the shared Express app.
- Set production cookies with `AUTH_COOKIE_SAMESITE=None` and
  `AUTH_COOKIE_SECURE=true`; set `CORS_ORIGIN` to the deployed frontend origin.
- MongoDB Atlas network access must allow Vercel function egress. Vercel
  serverless functions do not provide one stable outbound IP by default, so use
  an Atlas access-list strategy that matches the deployment plan before treating
  `/api/health` as ready.
- Validate streaming, uploads, SSE upload progress, WebDAV, FTP-backed host
  operations, and YouTube metadata import in a preview deployment before
  promoting the Git branch to production.
