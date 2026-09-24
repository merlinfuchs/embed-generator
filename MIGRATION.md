# Migrating to v0.7

v0.7 rewrites the server. The database carries over and an existing `config.yaml` still loads, so most
setups upgrade without changes. The YAML config is deprecated though, convert it to `embedg.toml` when you
get to it.

## Upgrading

With Docker, pull the new image and restart. It runs the migrations on start.

With the binary, replace it and run the migrations before starting it, as with earlier releases:

```sh
./embedg-server migrate postgres up
./embedg-server server
```

Everyone has to log in again afterwards, see [Database](#database).

## Config

The config is TOML now. It's read from `embedg.toml` in the working directory, or from the path passed with
`--config` (or `EMBEDG_CONFIG`). [`embedg.example.toml`](embedg.example.toml) has every section.

Until you convert, the server falls back to `config.yaml` when there is no `embedg.toml`, or reads the YAML
file passed with `--config`. It maps the old keys below to their new names and logs a warning on startup.

The conversion is mechanical. A YAML section becomes a `[section]` header, `key: value` becomes
`key = value`, strings need quotes, and nested sections join with a dot:

```yaml
# config.yaml
discord:
  client_id: "123"
  token: "abc"
postgres:
  host: localhost
  dbname: embedg
premium:
  plans:
    - id: default
      default: true
      features:
        max_saved_messages: 25
```

```toml
# embedg.toml
[discord]
client_id = "123"
token = "abc"

[database.postgres]
host = "localhost"
db_name = "embedg"

[[premium.plans]]
id = "default"
default = true

[premium.plans.features]
max_saved_messages = 25
```

Each plan in the `premium.plans` list becomes its own `[[premium.plans]]` block, followed by its
`[premium.plans.features]` table.

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

New optional keys:

- `discord.shard_count` and `discord.identify_concurrency` default to 0, which takes both from Discord. Only
  set them when running several instances, together with `discord.instance_count` and
  `discord.instance_index`.
- `discord.support_guild_id` offers users to join that server when they log in.
- `api.pprof_addr` turns on a pprof listener. Keep it on localhost.

## Environment variables

The `EMBEDG_` prefix and `__` separator stay, but the names follow the new sections, so
`EMBEDG_POSTGRES__HOST` becomes `EMBEDG_DATABASE__POSTGRES__HOST` and `EMBEDG_S3__ENDPOINT` becomes
`EMBEDG_DATABASE__S3__ENDPOINT`. The old names still work for now and log a warning. When both are set,
the new one wins.

If you copied the old `docker-compose.yaml`, switch the volume to `./embedg.toml:/root/embedg.toml` once
you've converted. Its `EMBEDG_POSTGRES__DB` never matched a key, so drop it or use
`EMBEDG_DATABASE__POSTGRES__DB_NAME`.

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
