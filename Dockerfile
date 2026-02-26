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

# Copy the ENTIRE standalone directory (includes server.js + .next/server with pages)
COPY --from=builder /app/.next/standalone ./
# Copy static assets (not included in standalone)
COPY --from=builder /app/.next/static ./.next/static
# Copy public files (not included in standalone)
COPY --from=builder /app/public ./public

# Copy Express server source files
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
