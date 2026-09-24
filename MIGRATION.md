# Migrating to v0.7

v0.7 replaces the `embedg-server` binary with `embedg-service`. The database carries over, but the config
format, the binary name and the CLI changed. If you run the Docker image, only the config and environment
variables need attention.

## Config

The config is TOML now and has to be called `embedg.toml`, in the directory the binary runs from. The
`--config` flag is gone. See the README for a full example.

Renamed keys:

| Before (`config.yaml`)   | After (`embedg.toml`)              |
| ------------------------ | ---------------------------------- |
| `postgres.host`          | `database.postgres.host`           |
| `postgres.port`          | `database.postgres.port`           |
| `postgres.dbname`        | `database.postgres.db_name`        |
| `postgres.user`          | `database.postgres.user`           |
| `postgres.password`      | `database.postgres.password`       |
| `s3.endpoint`            | `database.s3.endpoint`             |
| `s3.access_key_id`       | `database.s3.access_key_id`        |
| `s3.secret_access_key`   | `database.s3.secret_access_key`    |
| `s3.secure`              | `database.s3.secure`               |
| `s3.ssec_key`            | `database.s3.ssec_key`             |
| `premium.guild_id`       | `premium.beneficial_guild_id`      |
| `premium.role_id`        | `premium.beneficial_role_id`       |
| `debug`                  | `logging.debug`                    |

Removed keys: `log.use_json`, `discord.log_level` and everything under `nats`. Everything else keeps its name.

`premium.plans` becomes a TOML array of tables (`[[premium.plans]]` with a `[premium.plans.features]` table
under each), with the same fields as before.

New optional keys:

- `discord.shard_count` and `discord.identify_concurrency` default to 0, which takes both from Discord. Only
  set them when running several instances, together with `discord.instance_count` and
  `discord.instance_index`.
- `discord.support_guild_id` offers users to join that server when they log in.
- `api.pprof_addr` turns on a pprof listener. Keep it on localhost.

## Environment variables

The `EMBEDG_` prefix and `__` separator stay, but the names follow the new sections, so
`EMBEDG_POSTGRES__HOST` becomes `EMBEDG_DATABASE__POSTGRES__HOST` and `EMBEDG_S3__ENDPOINT` becomes
`EMBEDG_DATABASE__S3__ENDPOINT`. If you copied the old `docker-compose.yaml`, also swap
`EMBEDG_POSTGRES__DB` for `EMBEDG_DATABASE__POSTGRES__DB_NAME` and mount `./embedg.toml:/root/embedg.toml`
instead of `config.yaml`.

## Binary and CLI

If you run the binary yourself (systemd unit or similar), update the name and the migrate command:

```sh
# before
./embedg-server migrate postgres up
./embedg-server server

# after
./embedg-service database migrate postgres up
./embedg-service server
```

The Docker image runs both on start.

## Database

Migrations 001 to 018 are unchanged. v0.7 adds 019 to 022: a `guilds` table, OAuth fields on `sessions`, a
column on `embed_links` and an index. They only add, so existing data stays. The `guilds` table fills from
the gateway after the bot connects.

Migration 020 deletes all sessions, so everyone has to log in again. The login now asks for the
`guilds.members.read` scope. Nothing changes in the Discord developer portal: the redirect URL is still
`{api.public_url}/auth/callback`.

## Building from source

Go 1.25 and Node 24 are required. The frontends use pnpm instead of yarn (`corepack enable`, then
`pnpm install`).
