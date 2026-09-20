# Embed Generator

[![Release](https://github.com/merlinfuchs/embed-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/merlinfuchs/embed-generator/releases)
[![Docker image](https://github.com/merlinfuchs/embed-generator/actions/workflows/docker-push.yaml/badge.svg)](https://hub.docker.com/r/merlintor/embed-generator)

[![Release](https://img.shields.io/github/v/release/merlinfuchs/embed-generator)](https://github.com/merlinfuchs/embed-generator/releases/latest)
[![MIT License](https://img.shields.io/github/license/merlinfuchs/embed-generator)](LICENSE)
[![Uptime](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmerlinfuchs%2Fembedg-uptime%2Fmaster%2Fapi%2Fembed-generator-api%2Fuptime.json)](https://status.kite.onl/)
[![Discord Server](https://img.shields.io/discord/730045476459642900)](https://message.style/discord)

A powerful tool for creating rich-embed Discord messages using webhooks.

You will usually want to use the hosted version at https://message.style. There is not much benefit in hosting this
yourself.

## YouTube tutorial

[![Youtube Tutorial](./tutorial.png)](https://www.youtube.com/watch?v=DnFP0MRJPIg)

## Self Hosting

This describes the easiest way to self host an instance of Embed Generator by creating a single binary that contains
both the backend and frontend.

You can find prebuilt binaries of the server with the frontend files included [here](https://github.com/merlinfuchs/embed-generator/releases/latest).

### Configure the server

To configure the server create a file called `embedg.toml` next to the binary:

```toml
[discord]
client_id = ""
client_secret = ""
public_key = ""
token = ""

# One shard is enough until your bot is in a few thousand servers. Discord refuses to let the bot
# connect once it needs more than you configured here.
shard_count = 1

[openai]
api_key = "" # for ChatGPT integration (optional)

[database.postgres]
host = "localhost"
port = 5432
db_name = "embedg"
user = "postgres"
password = ""

[database.s3]
endpoint = "localhost:9000"
access_key_id = ""
secret_access_key = ""

[app]
public_url = "http://localhost:5173/app"

[api]
# Make sure to add {public_url}/auth/callback to the OAuth2 Redirect URLs of your application in the Discord dev portal
public_url = "http://localhost:5173/api"

# Make sure to enable this when you don't have an SSL (HTTPS) certificate
insecure_cookies = true

host = "localhost"
port = 8080

[cdn]
public_url = "http://localhost:8080/cdn"

# These links are used in help commands and for redirects
[links]
discord = "https://discord.gg/CpHwbKQKHA"
source = "https://github.com/merlinfuchs/embed-generator"

[logging]
debug = false

# Here you can configure multiple tiers/plans which are linked to a Discord SKU
# The default plan that all users automatically have
[[premium.plans]]
id = "default"
default = true

[premium.plans.features]
max_saved_messages = 25
max_actions_per_component = 3
advanced_action_types = false
ai_assistant = false
is_premium = false
custom_bot = false
max_custom_commands = 0
max_scheduled_messages = 5
periodic_scheduled_messages = false
max_template_ops = 1000
max_kv_keys = 10
components_v2 = true
component_types = [1, 2, 3, 9, 10, 11, 12, 17]

# An additional premium plan that will apply when the user or guild has the SKU
[[premium.plans]]
id = "premium_server"
sku_id = "123"

[premium.plans.features]
max_saved_messages = 100
max_actions_per_component = 10
advanced_action_types = true
ai_assistant = true
is_premium = true # This is used for handing out cosmetics like a role on the support server
custom_bot = true
max_custom_commands = 25
max_image_upload_size = 8000000
max_scheduled_messages = 25
periodic_scheduled_messages = true
max_template_ops = 10000
max_kv_keys = 1000
components_v2 = true
component_types = [1, 2, 3, 9, 10, 11, 12, 13, 14, 17]
```

The S3 credentials are required; image uploads go there. The docker-compose setup below runs MinIO for it.

You can also set the config values using environment variables, with `__` between the sections. For example
`EMBEDG_DISCORD__TOKEN` sets the Discord token and `EMBEDG_DATABASE__POSTGRES__HOST` the Postgres host.

### Migrating from older versions

Releases before this one ran the `embedg-server` binary on a `config.yaml`. The database schema is unchanged, so
migrating is a config rewrite:

- The config file is TOML now and is called `embedg.toml`.
- Postgres and S3 moved under `database`, so `postgres.dbname` becomes `database.postgres.db_name`.
- `log.use_json` is gone, `logging.debug` is what's left.
- Environment variables keep the `EMBEDG_` prefix and the `__` separator, but follow the new sections.
- Add `discord.shard_count`.
- Run `embedg-service database migrate postgres up` once. Existing rows are kept, sessions are not: everyone has to log in again.

### Using Docker (docker-compose)

Install Docker and docker-compose and create a `docker-compose.yaml` file with the following contents:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres
    restart: always
    volumes:
      - embedg-local-postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: embedg
      PGUSER: postgres
      PGDATA: /var/lib/postgresql/data/pgdata
      POSTGRES_HOST_AUTH_METHOD: trust
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 3s
      timeout: 30s
      retries: 3

  minio:
    image: quay.io/minio/minio
    command: server --console-address ":9001" /data
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: embedg
      MINIO_ROOT_PASSWORD: 1234567890
    volumes:
      - embedg-local-minio:/data

  embedg:
    image: merlintor/embed-generator:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - EMBEDG_API__HOST=0.0.0.0
      - EMBEDG_API__INSECURE_COOKIES=true
      - EMBEDG_DATABASE__POSTGRES__HOST=postgres
      - EMBEDG_DATABASE__POSTGRES__USER=postgres
      - EMBEDG_DATABASE__POSTGRES__DB_NAME=embedg
      - EMBEDG_DATABASE__S3__ENDPOINT=minio:9000
      - EMBEDG_API__PUBLIC_URL=http://localhost:8080/api
      - EMBEDG_APP__PUBLIC_URL=http://localhost:8080/app
    volumes:
      - ./embedg.toml:/root/embedg.toml
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  embedg-local-postgres:
  embedg-local-minio:
```

Run the file using `docker-compose up`. It will automatically mount the `embedg.toml` file into the container. You should not configure postgres in your config file as it's using the postgres instance from the container.

Embed Generator should now be accessible in your browser at [http://localhost:8080](http://localhost:8080).

### Build from source

#### Build the app

You can download NodeJS and NPM from [nodejs.org](https://nodejs.org/en/download/).

```sh
# Switch to the embedg-app directory
cd embedg-app

# Enable pnpm (Corepack ships with NodeJS)
corepack enable

# Install dependencies
pnpm install

# Start the development server (optional)
pnpm dev

# Build for production use
pnpm build
```

#### Build the site (home page & docs)

```sh
# Switch to the embedg-app directory
cd embedg-site

# Enable pnpm (Corepack ships with NodeJS)
corepack enable

# Install dependencies
pnpm install

# Start the development server (optional)
pnpm start

# Build for production use
pnpm build
```

#### Build the server (backend)

Install Go `>=1.21` from [go.dev](https://go.dev/doc/install).

```sh
# Switch to the backend directory
cd embedg-service
# or if you are in the frontend directoy
cd ../embedg-service

# Configure the server (see steps below)

# Run database migrations
go run main.go database migrate postgres up

# Start the development server (optional)
go run --tags "embedapp embedsite" main.go server

# Build and include the frontend files in the backend binary (build app and site first)
go build --tags  "embedapp embedsite"

# Build without including the frontend files in the backend binary (you need to serve yourself)
go build
```

#### Install databases

If you are not using Docker you need to Install PostgreSQL on your device and create a user and database. I'm sure you can find instructions online!

#### Run the binary

You should now be able to run the binary and host your own instance of Embed Generator. You usually want to deploy this
behind a reverse proxy like Nginx and terminate TLS there.
