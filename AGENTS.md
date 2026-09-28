# Embed Generator

Embed Generator (message.style) lets users build Discord messages with embeds, components and interactive actions in a web editor, then send them through webhooks or their own custom bot.

- `embedg-server`: Go backend (fiber API, disgo gateway, Postgres via sqlc, S3). Go 1.25.
- `embedg-app`: the editor. React 18, Vite, zustand, Tailwind 4, biome, vitest. pnpm.
- `embedg-site`: landing page and docs. Docusaurus, pnpm.

The server can embed the built app and site into its binary with the `embedapp` and `embedsite` build tags.

## Checks

CI runs all of these on every PR. Run them before pushing.

```shell
# Server
cd embedg-server
gofmt -l .        # must print nothing
go vet ./...
go test ./...

# Generated files, must leave no diff (see below)
go run github.com/gzuidhof/tygo@v0.2.19 generate   # in the repo root
sqlc generate                                      # in embedg-server, sqlc v1.29.0

# App
cd embedg-app
pnpm install
pnpm run format   # biome, CI runs biome ci
pnpm test
pnpm run build    # also typechecks

# Site
cd embedg-site
pnpm install
pnpm run build
```

## Generated files

Never edit these by hand. Change the source and regenerate.

| File                                  | Source                                                 | Command                            |
| ------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `embedg-app/src/api/wire.ts`          | Go types in `embedg-server/api/wire` (see `tygo.yaml`) | `tygo generate` in repo root       |
| `embedg-server/db/postgres/pgmodel/*` | `db/postgres/queries` and `db/postgres/migrations`     | `sqlc generate` in `embedg-server` |

## Server layout

- `api/handlers`: HTTP handlers, one package per resource. Routes are registered in `api/routes.go`.
- `api/wire`: request and response types shared with the app through tygo.
- `model`: domain types. `store`: store interfaces. `db/postgres`: their implementations.
- `access`: permission checks for users acting on guilds and channels.
- `actions`: interactive component actions (parsing, permission checks, execution, templates).
- `command`: the main bot's slash commands.
- `manager`: background work (custom bots, premium, scheduled messages, webhooks).
- `embedg`: the gateway client and the cached REST client in `embedg/rest`.
- `config`: config types in `model.go`, defaults in `default.toml`. Document new options in `embedg.example.toml`.

## Database

Migrations are in `embedg-server/db/postgres/migrations` as `NNN_description.up.sql` and `.down.sql`. Take the next free number and check `main` hasn't used it since you branched. After changing migrations or queries, run `sqlc generate`.

## Rules

- Match the surrounding code: naming, structure, comment density. Run gofmt and biome.
- Keep PRs to one feature. No drive-by refactors, reformatting, dependency bumps or Go version changes.
- Add Go dependencies with `go get` so `go.mod` and `go.sum` are updated. Never vendor them.
- Don't delete or loosen `.gitignore`, validation, tests or existing comments unless that's the point of the change.
- Every handler that touches a guild or channel checks access through `access.AccessManager` (`CheckGuildAccessForRequest`, `CheckChannelAccessForRequest`, ...). Don't trust IDs from the request.
- Plan limits (`model.PlanFeatures`) are enforced on the server. Hiding something in the app is not enough.
- The bot runs in hundreds of thousands of guilds. There is no in-memory guild cache: read Discord state through the REST client, which caches briefly. Don't add privileged intents; the bot only has `GUILDS`.
- The server runs as several instances that never talk to each other. Work that must happen once per guild is gated on `Shards.Owns`, work that must happen once per deployment on `Shards.IsLeader`.
- Treat message and template input as untrusted. Enforce Discord's limits and fail on invalid input instead of silently picking a default.
