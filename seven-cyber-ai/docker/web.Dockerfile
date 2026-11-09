# syntax=docker/dockerfile:1
# SEVEN web dashboard. Next.js standalone output, unprivileged user.
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY apps/web/package.json apps/web/pnpm-lock.yaml apps/web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
RUN pnpm build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S seven && adduser -S seven -G seven
COPY --from=build --chown=seven:seven /app/.next/standalone ./
COPY --from=build --chown=seven:seven /app/.next/static ./.next/static
COPY --from=build --chown=seven:seven /app/public ./public
USER seven
EXPOSE 3000
CMD ["node", "server.js"]
