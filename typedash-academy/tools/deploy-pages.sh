#!/usr/bin/env bash
# Publish typedash-academy/ to the gh-pages branch, which GitHub Pages serves at
# https://anisharma07.github.io/TypeDash/
#
# Usage (from anywhere inside the repository, with your changes committed):
#   bash typedash-academy/tools/deploy-pages.sh
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
APP=typedash-academy

echo "1/4 Checking content and logic..."
node "$APP/tools/validate-data.js" > /dev/null
node "$APP/tools/test-core.js"

echo "2/4 Refreshing the offline cache list..."
node "$APP/tools/build-sw.js"
if ! git diff --quiet -- "$APP"; then
  echo "sw.js (or other files) changed. Commit the changes in $APP/ first, then run this again."
  exit 1
fi

echo "3/4 Building the gh-pages branch from $APP/..."
git branch -D gh-pages-deploy > /dev/null 2>&1 || true
git subtree split -q --prefix "$APP" -b gh-pages-deploy

echo "4/4 Pushing to origin/gh-pages..."
git push --force origin gh-pages-deploy:gh-pages
git branch -D gh-pages-deploy > /dev/null
echo "Done. GitHub Pages usually refreshes within a minute or two."
