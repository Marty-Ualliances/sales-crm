# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js frontend
RUN npm run build

# Bundle server TypeScript into a single ESM file using esbuild (avoids tsx at runtime)
RUN npx esbuild server/index.ts \
      --bundle \
      --platform=node \
      --format=esm \
      --target=node20 \
      --outfile=dist/server.mjs \
      --packages=external \
      --sourcemap=inline

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat \
 && addgroup -S nodejs \
 && adduser -S nextjs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package*.json ./

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# Copy pre-compiled server bundle (no tsx needed at runtime)
COPY --from=builder /app/dist ./dist

EXPOSE 3001

USER nextjs

# Single unified server (Express + Next.js) — no separate 'next start' process
CMD ["node", "dist/server.mjs"]
