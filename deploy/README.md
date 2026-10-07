# Production setup

How message.style runs today, so it can be rebuilt on another host. Everything runs on one Ubuntu 24.04 machine, `embedg-main`.

| File                            | On the host                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `Caddyfile`                     | `/etc/caddy/Caddyfile`                                                       |
| `systemd/embedg-server.service` | `/etc/systemd/system/`                                                       |
| `systemd/host-heartbeat.*`      | `/etc/systemd/system/`, reads `HEARTBEAT_URL` from `/etc/host-heartbeat.env` |
| `backup/backup_*.sh`            | `/root/`, with the Better Stack heartbeat tokens filled in                   |
| `backup/crontab`                | root's crontab                                                               |
| `embedg-check.sh`               | `/root/`, run by hand for one health sample of the running server            |

Not in the repo: `/root/embedg.toml` (start from `embedg.example.toml`), `/etc/host-heartbeat.env` and the heartbeat tokens.

## Host

- **Caddy** from the `caddy-stable` apt repo, plus the `github.com/mholt/caddy-ratelimit` module the Caddyfile needs (`caddy add-package github.com/mholt/caddy-ratelimit`). An `apt upgrade` of caddy replaces the binary and drops the module, after which the config no longer loads. Re-add it after upgrading.
- **Postgres 18** from the pgdg apt repo on the same host. The server unit waits for `postgresql@18-main`.
- **embedg-server** runs as root from `/root/embedg-server` with `/root` as working directory, where it picks up `embedg.toml`.
- Caddy serves the app and site straight from `/srv/message.style/app` and `/srv/message.style/site` and proxies `/api`, `/cdn`, `/e` and the redirect paths to the server on `127.0.0.1:8080`.

## Deploying

- `scripts/deploy-server.sh` uploads the binary. Restart by hand, see the script.
- `scripts/deploy-app.sh` and `scripts/deploy-site.sh` build and upload the frontends.
- `scripts/deploy-caddy.sh` uploads `deploy/Caddyfile`, validates it on the host and reloads Caddy.

Change the Caddyfile here and deploy it with the script instead of editing it on the host, or this copy goes stale.
