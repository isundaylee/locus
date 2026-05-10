# Locus

Personal day tracker. Each day has a **status** (`working` / `out_of_office`) and a **location** (`CA` / `NY` / `other`), plus an optional note. Weekends render as out-of-office by default unless explicitly overridden. Built for tax-reporting use.

## Stack

Next.js 16 (App Router) · TypeScript · Postgres (`postgres` + Drizzle) · TanStack Query · Radix Popover · Tailwind v4.

## Dev (docker-compose)

```bash
docker compose up --build
# open http://localhost:3000
```

The compose file runs Postgres alongside the app, bind-mounts source for hot reload, and persists DB data in a named volume. On first run, `npm install` is executed inside the container's `node_modules` anonymous volume. No host install needed.

`DATABASE_URL=postgresql://locus:locus@db:5432/locus` is wired in for you.

To run an ad-hoc command (e.g. linting) inside the container:

```bash
docker compose run --rm app npm run lint
```

## Prod image

Build with the multi-stage `Dockerfile` (not `Dockerfile.dev`):

```bash
docker build -t <your-registry>/locus:<tag> .
docker push <your-registry>/locus:<tag>
```

Deployment to the homelab is via a Helm chart (TBD — not in this repo yet).

## Notes

- Schema is created on first DB connection (idempotent `CREATE TABLE IF NOT EXISTS` in `lib/db.ts`). No separate migration step.
- "Today" is computed in browser-local time. Stored dates are zone-less `YYYY-MM-DD` strings.
