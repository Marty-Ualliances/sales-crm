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

RUN npm run build \
 && (npm run build:server || npx tsc -p tsconfig.json)

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

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

EXPOSE 3000

USER nextjs

CMD ["sh", "-c", "PORT=3001 node dist/server/index.js & BACK_PID=$!; npx next start -p 3000 & FRONT_PID=$!; trap 'kill -TERM $BACK_PID $FRONT_PID 2>/dev/null' TERM INT; wait -n $BACK_PID $FRONT_PID; kill -TERM $BACK_PID $FRONT_PID 2>/dev/null; wait"]
