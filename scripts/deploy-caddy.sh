#!/usr/bin/env bash
# Puts deploy/Caddyfile in place and reloads Caddy. The new file is validated on the
# host before it replaces the live one, so a broken config never gets loaded.
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh

echo "==> copying deploy/Caddyfile to $DEPLOY_HOST"
scp -q deploy/Caddyfile "$DEPLOY_HOST:/etc/caddy/Caddyfile.new"

ssh "$DEPLOY_HOST" "
	set -e
	cd /etc/caddy
	if ! caddy validate --config Caddyfile.new --adapter caddyfile > /dev/null 2>&1; then
		caddy validate --config Caddyfile.new --adapter caddyfile 2>&1 | tail -5
		rm -f Caddyfile.new
		exit 1
	fi
	cp -p Caddyfile Caddyfile.prev
	mv Caddyfile.new Caddyfile
	systemctl reload caddy
"

curl -sf -o /dev/null -w "==> https://message.style/ %{http_code}\n" https://message.style/
