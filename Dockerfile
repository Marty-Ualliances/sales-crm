# ── Stage 1: Build Next.js ──
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ── Stage 2: Production dependencies only ──
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# ── Stage 3: Production image ──
FROM node:20-slim AS runner
WORKDIR /app

# Install process manager to run both Next.js and Express
RUN npm install -g concurrently tsx

ENV NODE_ENV=production

# Copy production node_modules (has next in dependencies)
COPY --from=deps /app/node_modules ./node_modules
# Copy built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

# Copy server source files (Express API)
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000 3001

# Run both services: Next.js on 3000, Express API on 3001
CMD ["concurrently", "--kill-others", "npx next start", "npm run start:server"]
