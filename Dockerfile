# syntax=docker/dockerfile:1.7

# ---------- build ----------
# Single deps+build stage. Next.js standalone output is self-contained,
# so we don't need to copy node_modules to the runner — which avoids
# pnpm's symlinked node_modules layout breaking across stages.
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Bundle the migration script into a self-contained file. Next.js standalone
# only carries packages its server.js graph imports; the out-of-band migrate
# runner doesn't share that graph, so we inline its deps here.
RUN pnpm exec esbuild scripts/migrate.mjs \
    --bundle --platform=node --target=node22 --format=cjs \
    --outfile=scripts/migrate.bundle.cjs

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Migration SQL — not traced by Next.js standalone, copy explicitly.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
# Self-contained migration runner for the Helm pre-upgrade Job (esbuild bundle).
COPY --from=build --chown=nextjs:nodejs /app/scripts/migrate.bundle.cjs ./scripts/migrate.bundle.cjs

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
