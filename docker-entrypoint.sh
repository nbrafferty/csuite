#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: db push failed (DB may not be ready yet)"

echo "Running seed..."
npx tsx prisma/seed.ts 2>&1 || echo "Warning: seed failed (may already be seeded)"

echo "Starting Next.js server..."
exec node server.js
