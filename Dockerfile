# =========================
# Base
# =========================
FROM node:22-alpine AS base


# =========================
# Dependencies
# =========================
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate


# =========================
# Builder
# =========================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/generated ./generated

COPY . .

# NEXT_PUBLIC_* harus tersedia SAAT BUILD (bukan cuma runtime),
# karena Next.js meng-inline nilainya ke bundle client di sini.
ARG NEXT_PUBLIC_APP_NAME
ARG OFFICE_LATITUDE
ARG OFFICE_LONGITUDE
ARG OFFICE_RADIUS_METERS

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV OFFICE_LATITUDE=$OFFICE_LATITUDE
ENV OFFICE_LONGITUDE=$OFFICE_LONGITUDE
ENV OFFICE_RADIUS_METERS=$OFFICE_RADIUS_METERS



RUN npm run build


# =========================
# Runner
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs

RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]