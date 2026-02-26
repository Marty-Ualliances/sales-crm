#!/bin/sh
# Start Express API on port 3001 (internal, background)
PORT=3001 npx tsx server/index.ts &
EXPRESS_PID=$!

# Start Next.js standalone server on port 3000 (foreground)
PORT=3000 node server.js &
NEXT_PID=$!

# If either process exits, kill the other and exit
wait -n $EXPRESS_PID $NEXT_PID 2>/dev/null || true
kill $EXPRESS_PID $NEXT_PID 2>/dev/null
wait
