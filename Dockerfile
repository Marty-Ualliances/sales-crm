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

# Install tsx globally for TypeScript server execution
RUN npm install -g tsx

ENV NODE_ENV=production

# 1. Copy standalone build (includes server.js + compiled pages in .next/)
COPY --from=builder /app/.next/standalone ./

# 2. Overlay full node_modules (adds express, mongoose, etc. that standalone excludes)
COPY --from=builder /app/node_modules ./node_modules

# 3. Copy static and public assets (not included in standalone)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 4. Copy Express API source
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

# Run Express on 3001 (internal), Next.js on 3000 (public)
# Using sh -c to avoid CRLF issues and properly manage both processes
CMD ["sh", "-c", "API_PORT=3001 PORT=3001 npx tsx server/index.ts & PORT=3000 HOSTNAME=0.0.0.0 node server.js"]
