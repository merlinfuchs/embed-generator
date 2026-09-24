#!/usr/bin/env bash
# Builds the service and puts the binary in place. It does NOT restart: a restart
# re-identifies all 256 shards against a daily session limit, so it stays deliberate.
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOY_HOST="${DEPLOY_HOST:-root@embedg-main}"
REMOTE_BIN="${REMOTE_BIN:-/root/embedg-server}"

out="$(mktemp -t embedg-server)"
trap 'rm -f "$out"' EXIT

echo "==> building for linux/amd64"
(cd embedg-server && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o "$out" .)

echo "==> copying to $DEPLOY_HOST:$REMOTE_BIN"
# Uploaded next to the live binary and renamed into place: writing over a running
# executable fails with ETXTBSY, while a rename leaves the running process on its
# own inode until it exits.
scp -q "$out" "$DEPLOY_HOST:$REMOTE_BIN.new"
ssh "$DEPLOY_HOST" "chown root:root '$REMOTE_BIN.new' && chmod 0755 '$REMOTE_BIN.new' && mv -f '$REMOTE_BIN.new' '$REMOTE_BIN'"

echo "==> in place, still running the old binary. restart when you're ready:"
echo "    ssh $DEPLOY_HOST 'systemctl restart embedg-server'"
echo "    curl -s https://message.style/api/health/shards | head -c 120"
