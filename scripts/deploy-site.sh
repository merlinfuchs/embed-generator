#!/usr/bin/env bash
# Builds embedg-site and serves it from /srv/message.style/site. No restart needed,
# Caddy reads the files per request.
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh

echo "==> building embedg-site"
(cd embedg-site && pnpm install --frozen-lockfile && pnpm build)

deploy_static embedg-site/dist /srv/message.style/site

curl -sf -o /dev/null -w "==> https://message.style/ %{http_code}\n" https://message.style/
