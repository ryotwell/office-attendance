# =========================
# Base
# =========================
FROM oven/bun:1.2-alpine AS base


# =========================
# Dependencies
# =========================
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app


# Copy package
COPY package.json bun.lock* ./


# Install dependencies
RUN bun install --frozen-lockfile


# Copy prisma schema
COPY prisma ./prisma/


# Generate Prisma Client
RUN bunx prisma generate



# =========================
# Builder
# =========================
FROM base AS builder

WORKDIR /app


# Copy node_modules
COPY --from=deps /app/node_modules ./node_modules


# COPY HASIL PRISMA GENERATE
# ini bagian yang diperbaiki
COPY --from=deps /app/generated ./generated


# Copy source code
COPY . .


ENV NEXT_TELEMETRY_DISABLED=1


RUN bun run build



# =========================
# Runner
# =========================
FROM base AS runner

WORKDIR /app


ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


RUN addgroup --system --gid 1001 nodejs

RUN adduser --system --uid 1001 nextjs



# Copy public
COPY --from=builder /app/public ./public


# Copy Next standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./


# Copy static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


# Copy generated prisma (jika diperlukan runtime)
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated



USER nextjs


EXPOSE 3000


ENV PORT=3000
ENV HOSTNAME="0.0.0.0"


CMD ["node", "server.js"]