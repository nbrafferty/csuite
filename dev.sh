#!/bin/bash
set -e

BRANCH="claude/build-admin-messages-page-fIMVc"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "==> Pulling latest from $BRANCH..."
git pull origin "$BRANCH" --ff-only

echo ""
echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Generating Prisma client..."
npx prisma generate

echo ""
echo "==> Starting dev server..."
npm run dev
