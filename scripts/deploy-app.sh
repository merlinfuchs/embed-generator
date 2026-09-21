#!/usr/bin/env bash
# Builds embedg-app and serves it from /srv/message.style/app. No restart needed,
# Caddy reads the files per request.
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh

echo "==> building embedg-app"
(cd embedg-app && pnpm install --frozen-lockfile && pnpm build)

deploy_static embedg-app/dist /srv/message.style/app

curl -sf -o /dev/null -w "==> https://message.style/app/ %{http_code}\n" https://message.style/app/
