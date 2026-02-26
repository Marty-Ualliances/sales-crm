#!/bin/sh
# Start Express API on port 3001 (internal only)
PORT=3001 npx tsx server/index.ts &

# Start Next.js standalone server on Railway's PORT (default 3000)
node server.js
