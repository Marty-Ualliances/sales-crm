# ── Stage 1: Build Next.js ──
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ── Stage 2: Production image ──
FROM node:20-slim AS runner
WORKDIR /app

# Install tsx globally for running the Express server
RUN npm install -g tsx

ENV NODE_ENV=production

# 1. Copy standalone build FIRST (includes minimal node_modules + .next/server pages)
COPY --from=builder /app/.next/standalone ./

# 2. Copy FULL node_modules ON TOP (overwrites standalone's minimal deps, adds express etc.)
COPY --from=builder /app/node_modules ./node_modules

# 3. Copy static assets + public (not included in standalone)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 4. Copy Express server source files
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

# 5. Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
