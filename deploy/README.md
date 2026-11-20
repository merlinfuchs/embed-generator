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

Not in the repo: `/opt/embedg/embedg.toml` (start from `embedg.example.toml`), `/etc/host-heartbeat.env` and the heartbeat tokens.

## Host

- **Caddy** from the `caddy-stable` apt repo, plus the `github.com/mholt/caddy-ratelimit` module the Caddyfile needs (`caddy add-package github.com/mholt/caddy-ratelimit`). An `apt upgrade` of caddy replaces the binary and drops the module, after which the config no longer loads. Re-add it after upgrading.
- **Postgres 18** from the pgdg apt repo on the same host. The server unit waits for `postgresql@18-main`.
- **embedg-server** runs as the `embedg` system user from `/opt/embedg/embedg-server` with `/opt/embedg` as working directory, where it picks up `embedg.toml`. The directory and `embedg.toml` are `root:embedg` with modes 750 and 640, the binary is `root:root`, so the server can read its config but not change it or itself. The backup scripts run as root from cron.
- Caddy serves the app and site straight from `/srv/message.style/app` and `/srv/message.style/site` and proxies `/api`, `/cdn`, `/e` and the redirect paths to the server on `127.0.0.1:8080`.

## Deploying

- `scripts/deploy-server.sh` uploads the binary. Restart by hand, see the script.
- `scripts/deploy-app.sh` and `scripts/deploy-site.sh` build and upload the frontends.
- `scripts/deploy-caddy.sh` uploads `deploy/Caddyfile`, validates it on the host and reloads Caddy.

Change the Caddyfile here and deploy it with the script instead of editing it on the host, or this copy goes stale.

## Moving from /root

The server used to run as root from `/root`. To move it, on the host:

```sh
useradd --system --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin embedg
install -d -o root -g embedg -m 750 /opt/embedg
cp -p /root/embedg-server /opt/embedg/
install -o root -g embedg -m 640 /root/embedg.toml /opt/embedg/embedg.toml
sed -i 's|^cd /root$|cd /opt/embedg|' /root/backup_daily.sh /root/backup_weekly.sh
```

Then install `systemd/embedg-server.service`, run `systemctl daemon-reload` and restart the server when a restart suits, see `scripts/deploy-server.sh`. Edit `embedg.toml` in `/opt/embedg` afterwards. The files in `/root` stay around for going back to the old unit.
