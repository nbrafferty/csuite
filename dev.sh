#!/bin/bash
set -e

BRANCH="claude/build-admin-messages-page-fIMVc"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "==> Pulling latest from $BRANCH..."
git pull origin "$BRANCH" --ff-only

echo ""
echo "==> Checking for dependency changes..."
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q "package.json\|package-lock.json"; then
  echo "    Dependencies changed — running npm install..."
  npm install
else
  echo "    No dependency changes, skipping install."
fi

echo ""
echo "==> Generating Prisma client..."
npx prisma generate

echo ""
echo "==> Starting dev server..."
npm run dev
