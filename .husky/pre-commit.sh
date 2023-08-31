#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run build -ws
git add .
npx lint-staged