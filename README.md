# ZNL-DRIVE

ZNL-DRIVE is a SvelteKit app that provides a simple “drive” experience with **local filesystem** storage and **Tigris object storage** support, plus user authentication and a REST-ish API for file operations.

## Features

- **Auth**: Better Auth (email/password + optional GitHub/Google OAuth)
- **Storage providers**:
  - **Local** (files stored on the server’s filesystem)
  - **Tigris** (S3-compatible object storage via `@tigrisdata/storage`)
- **Drive UI**: files/folders, shared items, trash, dashboard stats
- **Docs**: onboarding documentation via mdsvex
- **UI**: Tailwind CSS + DaisyUI (prefixed classes `d-...`)

## Tech stack

- **SvelteKit** + **Svelte 5** (adapter-node)
- **Postgres** via **Drizzle ORM** (Neon serverless driver)
- **Better Auth** sessions/cookies
- **Tigris Storage** SDK

## Quick start (local development)

### Prerequisites

- Node.js (project is built against Node 24)
- `pnpm` (Corepack is used)
- Postgres database (local or hosted)

### Setup

1. Install dependencies:

```bash
corepack enable
pnpm install
```

2. Create an `.env` file:

```bash
cp .env.example .env
```

3. Fill in required variables in `.env`:

- `DATABASE_URL`
- `ORIGIN` (local example: `http://localhost:5173`)
- `BETTER_AUTH_SECRET`

4. Push DB schema:

```bash
pnpm db:push
```

5. Start dev server:

```bash
pnpm dev
```

Open `http://localhost:5173`.

## Environment variables

See `.env.example`. Key variables:

- **`DATABASE_URL`**: Postgres connection string
- **`ORIGIN`**: public site URL (no trailing slash)
  - local: `http://localhost:5173`
  - Fly.io: `https://YOUR_APP.fly.dev` (or your custom domain)
- **`BETTER_AUTH_SECRET`**: required in production (use a strong random secret)
- **OAuth (optional)**:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Database workflows

Common scripts:

- **`pnpm db:push`**: push schema to the database
- **`pnpm db:generate`**: generate migrations (if you’re using migrations)
- **`pnpm db:migrate`**: run migrations
- **`pnpm db:studio`**: open Drizzle Studio

## Storage providers

This project supports:

- **Local**: files are stored on the server’s filesystem (good for dev and single-node deployments).
- **Tigris**: objects stored in Tigris buckets via `@tigrisdata/storage`.

If you add another provider later, the cleanest next step is typically another **S3-compatible** backend (AWS S3, Cloudflare R2, MinIO, Backblaze B2 S3 API, Wasabi, etc.).

## Deployment (Fly.io)

This repo is configured for Fly with `fly.toml` and a Dockerfile.

### Required secrets on Fly

Set secrets (examples):

```bash
fly secrets set ORIGIN=https://YOUR_APP.fly.dev
fly secrets set BETTER_AUTH_SECRET=YOUR_LONG_RANDOM_SECRET
fly secrets set DATABASE_URL='postgresql://...'
```

### Important: CSRF / “Cross-site POST form submissions are forbidden”

SvelteKit protects POST form actions by verifying the request origin. On Fly, your app often receives HTTP internally while the browser is on HTTPS.

This repo sets the adapter-node env var in `fly.toml`:

- `PROTOCOL_HEADER='x-forwarded-proto'`

That tells SvelteKit to treat requests as HTTPS based on Fly’s `X-Forwarded-Proto`.

### GitHub Actions deploy

Deployment is done via `.github/workflows/fly-deploy.yml` using:

- `flyctl deploy --remote-only`

Note: Docker image builds in CI run without Fly secrets. Auth initialization is **build-safe** (placeholders during `pnpm run build`) but the app will still require real `ORIGIN`/`BETTER_AUTH_SECRET` at runtime in production.

## Troubleshooting (production)

- **Login fails with “Cross-site POST form submissions are forbidden”**
  - Ensure Fly has `PROTOCOL_HEADER='x-forwarded-proto'` (already in `fly.toml`)
  - Ensure `ORIGIN` matches the public URL exactly (protocol + hostname, no trailing slash)
- **Build fails complaining about Better Auth secret**
  - Runtime must have `BETTER_AUTH_SECRET` set (Fly secret)
  - CI builds should pass without secrets (placeholders are used only during the build step)
- **Database unavailable**
  - Confirm `DATABASE_URL` is set on Fly and reachable from your app region

## Scripts

From `package.json`:

- `pnpm dev` — dev server
- `pnpm build` — build
- `pnpm preview` — preview build
- `pnpm check` — svelte-check
- `pnpm lint` / `pnpm format`
- `pnpm test` — unit + e2e

## License

GPLv3 — see `LICENSE`.
