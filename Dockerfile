# ── Stage 1: Build Next.js ──────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install deps first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production runtime ────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production deps only (includes tsx since it's in dependencies)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy server source (tsx runs it directly)
COPY --from=builder /app/server ./server

# Copy config files needed at runtime
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/next-env.d.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tailwind.config.ts ./
COPY --from=builder /app/postcss.config.js ./
COPY --from=builder /app/src/index.css ./src/index.css

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]
