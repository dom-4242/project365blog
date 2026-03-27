#!/bin/sh
set -e

echo "▶ Prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy

echo "▶ Starting Next.js..."
exec node server.js
