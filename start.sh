#!/bin/sh
# Start Express API on port 3001 (internal only)
PORT=3001 npx tsx server/index.ts &

# Start Next.js on Railway's PORT (default 3000)
npx next start -p ${PORT:-3000}
