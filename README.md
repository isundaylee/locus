# Locus

Personal day tracker. Each day has a **status** (`working` / `out_of_office`) and a **location** (`CA` / `NY` / `other`), plus an optional note. Weekends render as out-of-office by default unless explicitly overridden. Built for tax-reporting use.

## Stack

Next.js 16 (App Router) · TypeScript · Postgres (`postgres` + Drizzle) · TanStack Query · Radix Popover · Tailwind v4.

## Dev (docker-compose)

```bash
docker compose up --build
# open http://localhost:3000
```

The compose file runs Postgres alongside the app, bind-mounts source for hot reload, and persists DB data in a named volume. The app container uses **pnpm** (activated via Corepack from the `packageManager` field in `package.json`); `pnpm install` runs on each container start into an anonymous `node_modules` volume. No host install needed.

`DATABASE_URL=postgresql://locus:locus@db:5432/locus` is wired in for you.

The first `pnpm install` will create `pnpm-lock.yaml` (via the bind mount); commit it. `pnpm.supportedArchitectures` in `package.json` ensures the lockfile contains native binaries for every platform we care about (linux/darwin × x64/arm64 × glibc/musl), so the same lockfile is valid in both dev and CI.

To run an ad-hoc command (e.g. linting, drizzle-kit) inside the *running* container, use `exec` so it reuses the populated `node_modules` volume:

```bash
docker compose exec app pnpm run lint
docker compose exec app pnpm db:generate
```

Use `docker compose run --rm app sh -c "pnpm install --frozen-lockfile && <cmd>"` if the stack isn't already up.

## Prod image

Build with the multi-stage `Dockerfile` (not `Dockerfile.dev`):

```bash
docker build -t <your-registry>/locus:<tag> .
docker push <your-registry>/locus:<tag>
```

Homelab deployment uses the Helm chart at `helm/locus/` — see [`helm/locus/README.md`](helm/locus/README.md). It targets Kubernetes with a CloudNativePG Cluster providing Postgres.

## Notes

- Schema is created on first DB connection (idempotent `CREATE TABLE IF NOT EXISTS` in `lib/db.ts`). No separate migration step.
- "Today" is computed in browser-local time. Stored dates are zone-less `YYYY-MM-DD` strings.
