# Consolidation plan

Goal: one Go service (`embedg-service`) that owns the Discord gateway itself via disgo, can run as N instances over disjoint shard ranges without talking to each other, and a frontend editor built on a flat store. `embedg-server` and Stateway go away.

Base branch: `origin/service`. Work branch: `merlin/consolidate`. Do not touch `main` until step B10.

Conventions for whoever executes this:

- One PR per step. Every step compiles and is deployable on its own. Run `cd embedg-service && go build ./... && go vet ./...` before opening a PR. Run `cd embedg-app && ./node_modules/.bin/tsc --noEmit` if the frontend changed.
- sqlc regenerates `embedg-service/db/postgres/pgmodel`. After editing `db/postgres/queries/*.sql` or adding a migration run `cd embedg-service && sqlc generate`. Commit the generated files.
- Migrations live in `embedg-service/db/postgres/migrations/`, numbered `NNN_name.up.sql` and `.down.sql`. Next free number is `019`.
- Store pattern: interface in `embedg-service/store/<entity>.go`, implementation in `embedg-service/db/postgres/store_<entity>.go`, model struct in `embedg-service/model/<entity>.go`. `store.ErrNotFound` is the sentinel.
- IDs are `common.ID` which is `snowflake.ID` from disgo. Postgres columns for IDs are `bigint`.
- Logging is `log/slog`. Config is koanf, TOML file plus env vars.
- Commit messages: short, plain, no prefixes like `feat:`.
- Do not "clean up" unrelated code in these PRs. Scope creep makes review impossible.

Scale that drives the design: the main bot is in about 250k guilds. A full in-process guild/channel/role cache would be roughly 9 GB, so the service runs with **no gateway cache**. Guild membership comes from Postgres (B2), everything else guild-scoped comes from REST with a short TTL (B5). Instances never need each other.

Terms used below:

- Owner instance: the process whose shard range contains `(guild_id >> 22) % shard_count` for a guild.
- Leader: the instance whose `discord.shard_ids` contains `0`.

---

## Part B: backend

### B1. CI and branch hygiene

Files: `.github/workflows/ci.yaml` (new).

```yaml
name: CI
on: [pull_request]
jobs:
  service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version-file: embedg-service/go.mod }
      - run: go build ./... && go vet ./...
        working-directory: embedg-service
  app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable && yarn install --frozen-lockfile && ./node_modules/.bin/tsc --noEmit
        working-directory: embedg-app
```

Also in this PR: fix the env prefix in `embedg-service/config/config.go` line 65. It reads `XENEX_` and must be `EMBEDG_`. Keep the `__` to `.` delimiter mapping.

Delete remote branch `merlin/scheduled-messages-fixes` (already squash-merged as #210, diff against service is empty).

Done when: CI green on the PR, `EMBEDG_DATABASE__POSTGRES__HOST=x` overrides the TOML value.

### B2. Guilds table (merged as #213)

Purpose: any instance can answer "is the bot in guild X" without gateway state. This replaces Stateway's `CheckGuildsExist`.

Implemented: migration `019_create_guilds_table` (id, name, icon, owner_id, joined_at, left_at, updated_at), `store.GuildStore` with `UpsertGuild`, `MarkGuildLeft`, `GetGuilds`, listener cases in `entry/server/handler.go` for `GuildReady`, `GuildJoin`, `GuildUpdate`, `GuildLeave`. Until B7 the events come through Stateway, so `compat.DisgoGatewayConfig.EventTypes` in `embedg/embedg.go` carries `guild.create`, `guild.update`, `guild.delete`. `GuildLeave.Guild` is read from the disgo cache, which we don't populate, so the listener uses `e.GuildID`.

Do not handle `GuildUnavailable`. That is an outage, not a leave. Do not store channels, roles, or member counts. Do not store a shard id: it is `(id >> 22) % shard_count` and goes stale on resharding.

### B2b. Batch guild writes

Purpose: #213 does one upsert per event. On every restart the gateway replays about 250k `GuildReady` events within a minute or two, so that's 250k statements per boot, and later with N instances it's 250k across all of them every rolling deploy. Batch it before B7 makes the service own the gateway.

Replace `UpsertGuild` in `db/postgres/queries/guilds.sql` with:

```sql
-- name: UpsertGuilds :exec
INSERT INTO guilds (id, name, icon, owner_id, joined_at, left_at, updated_at)
SELECT id, name, icon, owner_id, $5, NULL, $5
FROM unnest($1::bigint[], $2::text[], $3::text[], $4::bigint[]) AS t(id, name, icon, owner_id)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    owner_id = EXCLUDED.owner_id,
    left_at = NULL,
    updated_at = EXCLUDED.updated_at
WHERE guilds.name IS DISTINCT FROM EXCLUDED.name
   OR guilds.icon IS DISTINCT FROM EXCLUDED.icon
   OR guilds.owner_id IS DISTINCT FROM EXCLUDED.owner_id
   OR guilds.left_at IS NOT NULL;
```

`icon` is nullable; pass it as `[]*string` or use `sqlc.narg`. `store.GuildStore.UpsertGuild(ctx, model.Guild)` becomes `UpsertGuilds(ctx, []model.Guild)`. The `WHERE` clause makes unchanged rows a no-op so a restart mostly touches nothing; `joined_at` is refreshed on rejoin via the `left_at IS NOT NULL` branch.

Move the guild cases out of `EventHandler` into a new `manager/guild/tracker.go`:

```go
type GuildTracker struct {
    store store.GuildStore
    mu    sync.Mutex
    buf   map[common.ID]model.Guild // dedup within a batch, last write wins
}

func (t *GuildTracker) OnEvent(event bot.Event) {
    switch e := event.(type) {
    case *events.GuildReady:  t.enqueue(guildFromEvent(e.Guild.Guild))
    case *events.GuildJoin:   t.enqueue(guildFromEvent(e.Guild.Guild))
    case *events.GuildUpdate: t.enqueue(guildFromEvent(e.Guild))
    case *events.GuildLeave:  t.store.MarkGuildLeft(ctx, e.GuildID, now) // rare, write directly
    }
}

// Run flushes buf every 2 seconds or when it reaches 1000 entries, whichever first. Flush on ctx.Done too.
func (t *GuildTracker) Run(ctx context.Context)
```

Register with `embedg.Client().AddEventListeners(tracker)` and `go tracker.Run(ctx)` in `entry/server/server.go`. Remove `guildStore` from `EventHandler`.

Done when: restart the service and watch `pg_stat_statements` or the Postgres log: guild upserts are in the low hundreds of statements for the whole boot, not 250k. Rename a test guild, the row updates within a few seconds.

### B3. User-token member fetch

Purpose: dashboard permission checks fetch the user's own member with the user's OAuth token instead of the bot token. Per-user rate limit bucket, works on any instance.

**Scope.** `api/handlers/auth/handler.go` `New()`: add `discord.ScopeGuildsMembersRead` to `Scopes`.

**Session storage.** Migration `020_add_session_oauth_fields`:

```sql
-- up
ALTER TABLE sessions
    ADD COLUMN refresh_token TEXT NOT NULL DEFAULT '',
    ADD COLUMN token_expires_at TIMESTAMP,
    ADD COLUMN scopes TEXT[] NOT NULL DEFAULT '{}';
-- down
ALTER TABLE sessions DROP COLUMN refresh_token, DROP COLUMN token_expires_at, DROP COLUMN scopes;
```

Update `queries/sessions.sql` `InsertSession` to write the three columns, add:

```sql
-- name: UpdateSessionTokens :exec
UPDATE sessions SET access_token = $2, refresh_token = $3, token_expires_at = $4 WHERE token_hash = $1;
```

`model.Session` gets `RefreshToken string`, `TokenExpiresAt time.Time`, `Scopes []string`. `store.SessionStore` gets `UpdateSessionTokens`. `session.SessionManager.CreateSession` signature grows to accept the `*oauth2.Token` and scopes. `authenticateWithCode` in the auth handler passes `tokenData` through; the granted scopes are in `tokenData.Extra("scope")` as a space-separated string.

**Scope check in middleware.** In `api/session/middleware.go` `SessionRequired`: if the session's `Scopes` does not contain `guilds.members.read`, return `handlers.Unauthorized("scope_missing", "Please log in again")`. The frontend already redirects to login on 401 with `invalid_session`; make sure it does the same for `scope_missing` (check `embedg-app/src/api/client.ts`).

**Token refresh.** New method on `SessionManager`:

```go
// UserToken returns a valid access token, refreshing via oauth2 if it expires within 5 minutes.
func (s *SessionManager) UserToken(ctx context.Context, sess *Session) (string, error)
```

Uses `oauth2.Config.TokenSource(ctx, &oauth2.Token{...}).Token()`. On success with a new token, call `UpdateSessionTokens`. The `oauth2.Config` currently lives only in the auth handler; move its construction into `SessionManager` (it already receives config for cookies) and have the auth handler take it from there.

**Member fetch.** New file `access/user_member.go`:

```go
// GetMemberForUser fetches the session user's member in guildID using the user's own OAuth token.
// Cached per (session token hash, guild) for 60s. Returns store.ErrNotFound if the user is not in the guild.
func (m *AccessManager) GetMemberForUser(ctx context.Context, sess *session.Session, guildID common.ID) (*discord.Member, error)
```

Endpoint: `GET https://discord.com/api/v10/users/@me/guilds/{guildID}/member` with `Authorization: Bearer <token>`. Use disgo's `rest.NewClient` with a bearer token if it supports it, otherwise plain `net/http`. Decode into `discord.Member`. 404 maps to `store.ErrNotFound`. Cache: `ttlcache` keyed by `tokenHash + ":" + guildID.String()`, TTL 60s, plus the singleflight `getOrSet` helper copied from `embedg/rest/rest.go` (generalize it into `common/singleflight.go` so both callers use it).

`AccessManager` needs the `*session.SessionManager` to call `UserToken`. Wire it in `entry/server/server.go`; note `sessionManager` is currently created after `accessManager`, reorder.

**OAuth guild list.** Also in `access/user_member.go`:

```go
type UserGuild struct {
    ID          common.ID
    Name        string
    Icon        null.String
    Owner       bool
    Permissions discord.Permissions // guild-level, as computed by Discord
}

// GetGuildsForUser fetches /users/@me/guilds with the user's token. Cached per session token hash for 60s.
func (m *AccessManager) GetGuildsForUser(ctx context.Context, sess *session.Session) ([]UserGuild, error)
```

This replaces `session.GuildIDs`, which is captured at login and never refreshed (a guild joined after login doesn't show until logout). Keep the column for now; stop reading it in B5.

**Call sites.** `GetGuildAccessForUser(userID, guildID)` and `GetChannelAccessForUser(userID, channelID)` change signature to take `sess *session.Session` instead of `userID`. Callers are in `api/handlers/guilds/handler.go`, `api/handlers/send_message/handler.go`, `api/handlers/custom_bots/handler.go`, `api/handlers/scheduled_messages/handler.go`, `api/handlers/saved_messages/handler.go`, and `actions/parser/permissions.go` (see B4 for that one). Every handler already has `session := c.Locals("session").(*session.Session)`.

Inside, replace `m.GetGuildMember(guildID, userID)` for the user with `m.GetMemberForUser(ctx, sess, guildID)`. Keep `GetGuildMember` for the bot's own member and for the scheduled message sender (B4), which has no session.

Done when: log in fresh, guild picker and channel list work, bot-token `GetMember` calls for dashboard users are gone (grep `GetGuildMember(` and confirm remaining calls pass `m.appContext.ApplicationID()` or a scheduled message creator id). Old session gets a 401 and is sent to login once.

### B4. Parser permission functions take the member from the caller

Purpose: `actions/parser/permissions.go` stops fetching members itself, so dashboard callers can supply the user-token member from B3 and the scheduled sender keeps using a bot-token fetch of the creator.

Background, so nobody "fixes" the wrong thing: at runtime `actions/handler/handle.go` never fetches members. It reads `DerivedPermissions` stored on the action set (the creator's authority, computed at save time) and, for the permission-check action type, reads `interaction.Member().Permissions` straight from the payload. Leave the runtime path alone.

Callers of `DerivePermissionsForActions` and `CheckPermissionsForActionSets`:

- `api/handlers/send_message/handler.go:143`, `api/handlers/custom_bots/commands.go:140` and `:209`. Dashboard, have a session, use `GetMemberForUser` from B3.
- `manager/scheduled_message/manager.go:238`. Background, no session. Fetch the creator with the bot token via `AccessManager.GetGuildMember(guildID, creatorID)`. If that returns unknown member or missing access, call the manager's existing `disable(ctx, msg, "creator is no longer a member of the server")` and skip the send instead of sending with empty permissions.

Change both parser functions to:

```go
type MemberInfo struct {
    UserID  common.ID
    RoleIDs []common.ID
}

func (m *ActionParser) CheckPermissionsForActionSets(ctx context.Context, actionSets map[string]actions.ActionSet, member MemberInfo, guildID, channelID common.ID) error
func (m *ActionParser) DerivePermissionsForActions(ctx context.Context, member MemberInfo, guildID, channelID common.ID) (actions.ActionDerivedPermissions, error)
```

Remove the internal `m.accessManager.GetGuildMember` calls. Channel-level permissions inside these functions come from `AccessManager.ComputeUserPermissionsForChannel`, which also needs to accept the member instead of a user id (B5 rewrites that function; in B4 add a variant taking `*discord.Member` and keep the old one until B5 deletes it).

Done when: grep `GetGuildMember(` in `actions/` returns nothing, saving a message with actions from the dashboard works, a scheduled message whose creator left the guild gets disabled with a visible reason.

### B5. Access manager off Stateway

Purpose: `access/access.go` no longer imports `stateway-lib`. Works on owner and non-owner instances.

**Guild state provider.** New package `embedg-service/guildstate`:

```go
type Provider struct {
    rest   rest.Rest
    guilds *ttlcache.Cache[common.ID, *State]          // 2 min TTL
    chans  *ttlcache.Cache[common.ID, discord.GuildChannel] // 2 min TTL, for lookups by channel id
    sf     singleflight                                 // from common/singleflight.go (B3)
}

type State struct {
    Guild    discord.Guild
    Channels []discord.GuildChannel
    Roles    []discord.Role
}

func (p *Provider) Guild(ctx context.Context, guildID common.ID) (*State, error)          // GetGuild + GetGuildChannels + GetRoles, one singleflight key
func (p *Provider) Channel(ctx context.Context, channelID common.ID) (discord.GuildChannel, error) // GetChannel, 404 -> store.ErrNotFound
func (p *Provider) Invalidate(guildID common.ID)
```

There is no gateway cache to consult. Every read is REST behind the TTL cache. `Invalidate` is called from the event listener on `GuildChannelCreate/Update/Delete`, `GuildRoleCreate/Update/Delete`, and `GuildUpdate` for guilds this instance owns, so the owner instance sees changes immediately and others within two minutes.

**Payload before REST.** Interactions already carry most of what the templates and handlers read from the cache. Use it before touching the provider:

- `actions/template/provider.go` `InteractionProvider.ProvideData` calls `NewChannelData(caches, id, nil)`. Pass `p.interaction.Channel()` instead; it's a partial channel with id, type, name, parent id, which covers the common template fields. Only fall back to the provider for fields the partial lacks.
- `actions/template/data.go` `NewCommandOptionData` resolves channel, role, and member options from the cache. Read them from the interaction's `Resolved` data (`SlashCommandInteractionData.Resolved.Channels/Roles/Members`) instead. Zero fetches.
- `GuildData`, `ChannelData`, `RoleData`, `MemberData.Roles()` stay lazy as they are today. They must call the provider only inside `ensure*()`, never in the constructor, so a template that doesn't reference `{{Guild...}}` costs nothing.
- `manager/webhook/message.go` reads the channel on every send to find the thread parent and type. Route through `provider.Channel`. This is one extra `GET /channels/{id}` per distinct channel per two minutes on a path that already does one or two webhook REST calls; acceptable.

Replace all 30 `caches.X(...)` read sites in the service with the provider. They are in `actions/parser/permissions.go` (10), `manager/webhook/message.go` (6), `actions/template/data.go` (3), `access/access.go` (3), `api/handlers/guilds/handler.go` (2), `api/handlers/custom_bots/handler.go` (2), `command/cmd_message.go` (1), `api/handlers/send_message/handler.go` (1). Every one of them currently treats a cache miss as an error or as "no permissions"; with the provider a miss is a real REST error or 404 and should be handled as such. Remove `cache.Caches` from every constructor that only used it for these reads.

**CheckGuildsKnown.** Replace body with `m.guildStore.GetGuilds(ctx, guildIDs)` and map back to `[]bool` in input order. Add `guildStore store.GuildStore` to `AccessManager`.

**Guild list endpoint.** `HandleListGuilds` in `api/handlers/guilds/handler.go` currently calls `GetGuildAccessForUser` for every guild in the session, which needs channels and roles per guild. On a non-owner instance that's up to three REST calls per guild. Replace with:

1. `userGuilds := am.GetGuildsForUser(ctx, sess)` (B3).
2. Keep only those where `Permissions & (ManageWebhooks | Administrator) != 0`.
3. `known := guildStore.GetGuilds(ctx, ids)`. Intersect.
4. Respond with `id`, `name`, `icon` from the `guilds` table row and the user's guild-level permissions. No channel-level computation here.

Check `wire.GuildWire` for fields the frontend expects beyond these and source them from the table or the OAuth response. If the frontend relies on a channel-level "bot has access" boolean in the list, drop it from the list and let the guild view surface it.

`HandleGetGuild` keeps the full `GetGuildAccessForUser` check. That's one guild, one state fetch, cached two minutes.

**GetGuildAccessForUser.** Replace the two `m.cache.GetGuildWithPermissions` calls with a local function:

```go
// maxChannelPermissions ORs memberPermissions() over every channel in st. Returns early once
// all bits of stopAt are set. This mirrors stateway's MaxChannelPermissions with abortAtPermissions.
func maxChannelPermissions(st *guildstate.State, userID common.ID, roleIDs []common.ID, stopAt discord.Permissions) discord.Permissions
```

using the existing `memberPermissions` in `access/helpers.go` (signature `memberPermissions(guild *discord.Guild, roles []discord.Role, channel discord.GuildChannel, userID, roleIDs)`). Skip channels of type category when iterating, they don't matter for sending. Bot member: `GetGuildMember(guildID, m.appContext.ApplicationID())`. User member: `GetMemberForUser` from B3.

**ComputeUserPermissionsForChannel.** Takes a `*discord.Member` (B4). `provider.Channel(channelID)`, then `provider.Guild(channel.GuildID())`, then `memberPermissions(...)`. Drop the `m.caches.MemberPermissionsInChannel` call, it only works on cached data.

**GetGuildMember.** Keep for the bot's own member and for scheduled message creators. Plain `m.rest.GetMember`; the `RestClient` in `embedg/rest/rest.go` already caches members 5 minutes with singleflight. Drop the `m.caches.Member` lookup.

**Remove** the `cache cache.Cache` field, the `stateway-lib/cache` import, and the `discordgo` import (replace `discordgo.ErrCodeUnknownMember` etc. with disgo's `discord.JSONErrorCode` constants; `common.IsDiscordRestErrorCode` may need adjusting, check `common/discord.go`).

**Guild handlers.** `HandleListGuildChannels`, `HandleListGuildRoles`, `HandleGetGuild` use the provider. Emojis and stickers: REST through the same TTL and singleflight helper, separate cache keys.

Stateway still runs in this step but nothing reads its caches anymore, so prod exercises the REST path fully before the switch in B7. Watch the rate limit headers in logs for a day.

Done when: `grep -rn "caches\." embedg-service` returns nothing outside `embedg/embedg.go`, and `grep -r stateway-lib embedg-service/access embedg-service/actions embedg-service/api/handlers` is empty. Guild picker, channel list, role list, save-with-actions, sending, and scheduled sends all work.

### B6. Custom bots in-process

Purpose: custom bots (under 100, presence only) run as disgo clients inside the service. Replaces Stateway's `UpsertApp`, `DeleteApp`, `GetApp`, `GetApps`.

New file `manager/custom_bot/client.go`:

```go
type runningBot struct {
    client *bot.Client
    token  string // to detect token changes
}

type clientPool struct {
    mu   sync.Mutex
    bots map[common.ID]*runningBot // keyed by ApplicationID
}

func (p *clientPool) start(ctx context.Context, cb *model.CustomBot, onInteraction bot.EventListener) error
func (p *clientPool) stop(appID common.ID)
func (p *clientPool) status(appID common.ID) (connected bool, ok bool)
```

`start` builds:

```go
disgo.New(cb.Token,
    bot.WithDefaultShardManager(),
    bot.WithShardManagerConfigOpts(sharding.WithShardCount(1), sharding.WithShardIDs(0)),
    bot.WithGatewayConfigOpts(
        gateway.WithIntents(0),
        gateway.WithPresenceOpts(presenceOptsFromCustomBot(cb)...),
    ),
    bot.WithCacheConfigOpts(cache.WithCaches(0)),
    bot.WithRest(rest.NewRestClient(cb.Token)),
    bot.WithEventListeners(onInteraction),
)
```

then `client.OpenGateway(ctx)`. `presenceOptsFromCustomBot` maps `GatewayStatus` to `gateway.WithOnlineStatus` and `GatewayActivityType` (0 playing, 1 streaming, 2 listening, 3 watching, 4 custom, 5 competing) to the matching `gateway.With*Activity` option using `GatewayActivityName`, `GatewayActivityState`, `GatewayActivityUrl`. If the token is empty or `TokenInvalid`, do not start.

If `OpenGateway` fails with an authentication error (disgo returns a close code 4004), set `TokenInvalid = true` on the custom bot via the store and log at warn.

`CustomBotManager` gains a `pool *clientPool` and `SyncCustomBots` becomes reconciliation:

1. Load all custom bots from the store.
2. For each: if not running and token valid, start. If running and token differs, stop then start. 
3. For each running app id not in the store, stop.

The ticker in `Run` is commented out. Uncomment it, interval 5 minutes, and call `SyncCustomBots` once at startup too. In B7 the reconciliation gets the shard range filter.

Interaction listener: reuse the `EventHandler` in `entry/server/handler.go` but the `rest` used to respond must be the custom bot's. Simplest: make the listener a closure per bot that wraps `handler.GatewayInteraction` with that bot's rest client. Look at `onComponentInteractionCreate` for the shape.

`api/handlers/custom_bots/handler.go`: replace

- `h.gateway.UpsertApp(...)` after create and after update with `h.customBotManager.Start(ctx, customBot)`.
- `h.gateway.DeleteApp(...)` with `h.customBotManager.Stop(customBot.ApplicationID)`.
- `h.gateway.GetApp(...)` in the get handler with `h.customBotManager.Status(customBot.ApplicationID)`. Fill `Disabled` with `!connected`, `DisabledCode` with `"gateway_disconnected"` or `""`, `DisabledMessage` empty.

`api/handlers/custom_bots/interaction.go`: the `RestInteraction` has `Rest: h.rest` with a TODO. Pass `rest.NewRestClient(customBot.Token)`, which is already built two lines below for the handler call. Build it once and use it for both.

Remove the `gateway` field from `CustomBotsHandler` and `CustomBotManager`. Delete `manager/custom_bot/gateway.go`. Stateway still runs its own copy of the custom bots at this point; that's fine, two connections for a week is harmless. Actually no: two gateway connections with the same token from different apps both work, Discord allows it, presence is whichever connected last. Acceptable for the transition.

Done when: create a custom bot in the dashboard, it shows online in Discord with the configured presence; change the token, it reconnects; delete it, it goes offline; a slash command on the custom bot invokes an action.

### B7. The switch

Purpose: embedg-service owns the gateway. Stateway is gone. Multi-instance by shard range works.

**Config** `config/model.go`:

- Delete `BrokerConfig`, `NATSConfig`, and `RootConfig.Broker`.
- `DiscordConfig` gains `ShardCount int \`toml:"shard_count" validate:"required"\`` and `ShardIDs []int \`toml:"shard_ids"\``. Shard count is required and explicit so every instance agrees on it; at 250k guilds it's around 250. Empty `ShardIDs` means "all shards of this count", which is the single-instance deployment.
- `default.toml`: delete `[broker]` and `[broker.nats]`.

Add a helper:

```go
func (c DiscordConfig) IsLeader() bool  // ShardIDs empty (single instance) or contains 0
func (c DiscordConfig) OwnsGuild(guildID common.ID) bool // (guildID >> 22) % ShardCount in ShardIDs; true if ShardIDs empty
```

**Gateway** `embedg/embedg.go`. Replace the constructor body:

```go
opts := []bot.ConfigOpt{
    bot.WithDefaultShardManager(),
    bot.WithGatewayConfigOpts(gateway.WithIntents(
        gateway.IntentGuilds | gateway.IntentGuildMessages | gateway.IntentGuildWebhooks,
    )),
    // No guild/channel/role cache: 250k guilds would be ~9 GB. See B5.
    bot.WithCacheConfigOpts(cache.WithCaches(0)),
    bot.WithEventManagerConfigOpts(bot.WithAsyncEventsEnabled()),
    bot.WithRest(rest.NewRestClient(config.Token)),
}
shardIDs := config.ShardIDs
if len(shardIDs) == 0 {
    for i := 0; i < config.ShardCount; i++ { shardIDs = append(shardIDs, i) }
}
opts = append(opts, bot.WithShardManagerConfigOpts(
    sharding.WithShardCount(config.ShardCount),
    sharding.WithShardIDs(shardIDs...),
))
client, err := disgo.New(config.Token, opts...)
```

If the message content intent is needed for restore-by-id, add `gateway.IntentMessageContent`; check `api/handlers/send_message/restore.go` first, it may use REST which doesn't need the intent.

Delete fields `cache`, `gateway`, `compatCaches`, `broker` and their accessors. `Caches()` returns `g.client.Caches`. Delete `EmbedGeneratorConfig.BrokerURL` and `GatewayCount`. Add `ShardCount`, `ShardIDs`. Add:

```go
func (g *EmbedGenerator) ShardManager() sharding.ShardManager { return g.client.ShardManager }
```

**Wiring** `entry/server/server.go` and `api/api.go`: remove `Gateway` from `api.Env` and the `embedg.Gateway()` argument. Pass `cfg.Discord` (for `IsLeader`/`OwnsGuild`) to the scheduled message manager, custom bot manager, premium manager, and command handler.

**Shard range filters.**

- `manager/scheduled_message/manager.go` `Run`: after `GetDueScheduledMessages`, skip messages where `!cfg.OwnsGuild(msg.GuildID)`. Do the filter in Go, not SQL, so the query stays simple. Under 100k rows this is fine; if it ever isn't, add `WHERE (guild_id >> 22) % $2 = ANY($3)`.
- `manager/custom_bot/manager.go` `SyncCustomBots`: only start bots where `cfg.OwnsGuild(cb.GuildID)`; stop any running bot whose guild is no longer owned.

**Leader gate.** Only when `cfg.IsLeader()`:

- `command.SyncCommands` at startup (find the call in `entry/server/server.go`).
- `premiumManager.SyncEntitlements` at startup. The entitlement events listener can stay registered everywhere, Discord only delivers them to shard 0 anyway.
- DB backup cron if one runs inside the server process (check `entry/database/backup.go` and where it's invoked).

**Health** `api/handlers/health/handler.go`: `New(shardManager sharding.ShardManager)`. Add:

```go
// GET /api/health/shard-list
func (h *HealthHandler) HandleShardList(c *fiber.Ctx) error
// returns [{"id": 0, "status": "Ready", "latency_ms": 42}, ...] from shardManager.Shards()
```

`gateway.Gateway` has `ShardID()`, `Status()`, `Latency()`. Register the route in `api/routes.go` next to the existing health route. `HandleHealth` should return 503 if any owned shard is not `StatusReady`.

**Stateway removal.** `go get github.com/merlinfuchs/stateway/stateway-lib@none && go mod tidy`. `grep -r stateway embedg-service` must be empty. Update `embedg-service/README.md` to drop the Stateway sentence. Delete `cmd/root.go` references to `stateway-gateway` (the CLI app name is wrong there anyway, make it `embedg`).

**Event invalidation.** The `GuildTracker` from B2 (or a sibling listener) calls `guildstate.Provider.Invalidate(guildID)` on `GuildChannelCreate`, `GuildChannelUpdate`, `GuildChannelDelete`, `GuildRoleCreate`, `GuildRoleUpdate`, `GuildRoleDelete`, `GuildUpdate`. All covered by the Guilds intent.

**Deploy.** Big bang, single instance, `shard_count` set, no `shard_ids`. Expect boot to take one to two minutes for all shards to identify. Rollback is the previous image; no migration in this step.

**Manual verification checklist** (run all, on prod after deploy):

1. Log in fresh. Guild picker lists correct guilds.
2. Open a guild. Channels and roles lists populate.
3. Send a message via bot to a channel. Send via webhook URL.
4. Edit a sent message. Restore a message by id.
5. Save a message, load it, share it, open the share link.
6. Create an embed link and open it.
7. Upload an image.
8. Create a scheduled message for 2 minutes ahead, confirm it sends. Create a cron one, confirm `next_at` advances.
9. Custom bot: create, verify online with presence, run a custom command, click an action button, change token, delete.
10. Action button on a normal bot message responds.
11. Trigger an entitlement (test SKU) and confirm premium status updates.
12. `/api/health/shard-list` shows all shards Ready.
13. Memory after 1 hour compared to the Stateway deployment. Should be flat and well under 1 GB; if it grows with time, something is caching guild payloads.
14. Boot: time from start until `/api/health` returns 200, and Postgres statement rate during that window.

### B8. Build and docs

- `Dockerfile`: replace `cd embedg-server && go build --tags "embedapp embedsite"` with the same in `embedg-service`. Check `embedg-service` has the `embed.go`/`noembed.go` build-tag files like `embedg-app` and `embedg-site` do; if the service imports the app/site packages unconditionally, no tags are needed. `COPY --from=builder /root/embedg-service/embedg-service .` and `CMD ./embedg-service migrate up; ./embedg-service server` (check the exact subcommand names in `cmd/`). Drop `build-essential` from the runtime stage, it's not needed to run a static Go binary.
- `.github/workflows/release.yaml`: `workdir: embedg-service`. Move `.goreleaser.yaml` from `embedg-server` to `embedg-service` and fix the binary name.
- `.github/workflows/docker-push.yaml`: check it builds from the root Dockerfile; usually no change.
- `go.work`: remove `./embedg-server`.
- `tygo.yaml`: `path: "github.com/merlinfuchs/embed-generator/embedg-service/api/wire"`. Run `tygo generate` and confirm `embedg-app/src/api/wire.ts` diff is empty or trivial.
- `README.md` self-hosting section: replace the YAML config block with the TOML equivalent (copy `default.toml` and add the required `discord.*` and `database.*` keys). Add a short "Migrating from embedg-server" note: config is now TOML at `config.toml`, env vars are `EMBEDG_SECTION__KEY`, the database schema is unchanged, run the migrate command once.
- `docker-compose.yaml`: env var names to the new format.

Done when: `docker build .` succeeds and the container serves the app on 8080 against the compose Postgres.

### B9. Removal

- `git rm -r embedg-server`.
- Delete remote branches: `disgo`, `stateway`, `stability`, `componentsv2`, `next`, `oauth-member-scope`, `refactor-access`, `scheduled-messages`, `image-cdn`, `scripting`, `component-emojis`, `custom-commands`, `custom-bot`, `navigation-rework`, `old-main`, `docs`, `features/actions-frontend`, `saving-messages`.
- `grep -r embedg-server .` outside `.git` must return only the README migration note.

### B10. Merge to main

Squash or merge `merlin/consolidate` into `main`. Tag a release. Release note: link the README migration section.

### Later: scale out

Not part of this plan, listed so the design constraints make sense.

1. Deploy a REST rate limit proxy (NIRN or twilight-http-proxy). Set `discord.rest_url` on every instance.
2. Run N instances with the same `discord.shard_count` and disjoint `discord.shard_ids`. Exactly one has `0`.
3. Caddy or Nginx round robin in front of `/api`. No stickiness needed.

---

## Part F: frontend

Separate branch `merlin/flat-editor` from the same base. Independent of Part B.

Current state: `embedg-app/src/state/message.ts` is a 2166 line zustand store holding the raw Discord `Message` shape with 131 hand-written setters. Components pass 20 to 40 callbacks down through `EditorComponentBase*` props. Validation is zod on the whole message with path strings like `embeds.0.fields.2.value` looked up via `useValidationErrorStore.getIssueByPath`.

Target: a normalized store. UI components subscribe to one node by id. The Discord `Message` shape is produced on demand.

### F1. Biome and CI

Add `biome.json` to `embedg-app` with the recommended ruleset, formatter enabled, 2 space indent, double quotes (matches the existing code). Run `biome check --write .` in one commit titled "format with biome". Add `biome ci .` to the app job in `.github/workflows/ci.yaml`. No rule fixes beyond formatting in this PR; disable rules that produce more than a handful of errors and note them.

### F2. Document store

New file `src/state/document.ts`. Nothing imports it in this PR.

Node types (discriminated union on `type`):

```ts
type NodeId = string;

interface BaseNode { id: NodeId; parentId: NodeId | null; }

type MessageNode = BaseNode & { type: "message"; content: string; username?: string; avatar_url?: string;
  tts: boolean; thread_name?: string; flags: number; allowed_mentions?: AllowedMentions;
  embedIds: NodeId[]; componentIds: NodeId[]; }
type EmbedNode = BaseNode & { type: "embed"; title?: string; description?: string; url?: string; color?: number;
  timestamp?: string; author?: EmbedAuthor; footer?: EmbedFooter; image?: EmbedImage; thumbnail?: EmbedThumbnail;
  fieldIds: NodeId[]; }
type EmbedFieldNode = BaseNode & { type: "embedField"; name: string; value: string; inline?: boolean; }
type ActionRowNode = BaseNode & { type: "actionRow"; childIds: NodeId[]; }
type ButtonNode = BaseNode & { type: "button"; style: number; label?: string; emoji?: Emoji; url?: string;
  disabled?: boolean; actionSetId: string; }
type SelectMenuNode = BaseNode & { type: "selectMenu"; placeholder?: string; disabled?: boolean;
  optionIds: NodeId[]; actionSetId: string; }
type SelectOptionNode = BaseNode & { type: "selectOption"; label: string; description?: string; emoji?: Emoji;
  actionSetId: string; }
type ContainerNode = BaseNode & { type: "container"; accent_color?: number; spoiler?: boolean; childIds: NodeId[]; }
type SectionNode = BaseNode & { type: "section"; childIds: NodeId[]; accessoryId: NodeId | null; }
type TextDisplayNode = BaseNode & { type: "textDisplay"; content: string; }
type ThumbnailNode = BaseNode & { type: "thumbnail"; media: UnfurledMediaItem; description?: string; spoiler?: boolean; }
type MediaGalleryNode = BaseNode & { type: "mediaGallery"; itemIds: NodeId[]; }
type MediaGalleryItemNode = BaseNode & { type: "mediaGalleryItem"; media: UnfurledMediaItem; description?: string; spoiler?: boolean; }
type FileNode = BaseNode & { type: "file"; file: UnfurledMediaItem; spoiler?: boolean; }
type SeparatorNode = BaseNode & { type: "separator"; divider?: boolean; spacing?: number; }
```

Field names on nodes match the Discord JSON field names so `toMessage` is mostly spreading. Check each against the zod schemas in `src/discord/schema.ts` lines 174 to 530 and use exactly the same optionality.

Store:

```ts
interface DocumentState {
  nodes: Record<NodeId, Node>;
  rootId: NodeId;              // the single MessageNode
  actions: Record<string, MessageActionSet>;  // unchanged from today, keyed by action set id
}

interface DocumentActions {
  update<T extends Node>(id: NodeId, patch: Partial<Omit<T, "id" | "type" | "parentId">>): void;
  insert(parentId: NodeId, slot: ChildSlot, index: number | "end", node: Omit<Node, "id" | "parentId">): NodeId;
  remove(id: NodeId): void;                   // recursive
  move(id: NodeId, delta: -1 | 1): void;
  duplicate(id: NodeId): NodeId;              // deep copy with fresh ids, inserted after the original
  replaceAll(message: Message): void;         // fromMessage
  clear(): void;
  setComponentsV2(enabled: boolean): void;    // toggles flag bit 15 on the root
}
```

`ChildSlot` names which array on the parent: `"embeds" | "components" | "fields" | "children" | "options" | "items" | "accessory"`. `insert`, `remove`, `move`, `duplicate` are the only functions that touch the child arrays, so ordering logic lives in one place.

Middleware stack, same as today: `immer`, `persist` with `name: "current-message", version: 1`, `temporal` from zundo with `partialize: (s) => ({ nodes: s.nodes, rootId: s.rootId, actions: s.actions })`, `limit: 10`, debounced `handleSet` as in the existing store.

Selectors, in the same file:

```ts
export const useNode = <T extends Node>(id: NodeId) => useDocumentStore((s) => s.nodes[id] as T);
export const useChildIds = (id: NodeId, slot: ChildSlot) => useDocumentStore((s) => childIds(s.nodes[id], slot), shallow);
```

Conversion, new file `src/state/documentConvert.ts`:

```ts
export function fromMessage(message: Message): { nodes: Record<NodeId, Node>; rootId: NodeId; actions: ... }
export function toMessage(state: DocumentState): { message: Message; pathToId: Map<string, NodeId> }
```

`toMessage` walks from the root and, while building each array element, records `pathToId.set("embeds.0", embedId)`, `pathToId.set("embeds.0.fields.2", fieldId)`, `pathToId.set("components.1.components.0", buttonId)`, and so on. Memoize on `nodes` identity (a module-level `WeakMap<nodes, result>` is enough since immer produces a new object on every change).

Ids: use the existing `getUniqueId()` from `src/util` but as a string. Discord components need numeric `id` fields for V2; keep those as a separate `discordId?: number` on the node, generated in `toMessage` if missing. Don't conflate them.

Tests: add vitest (`yarn add -D vitest`) and `src/state/documentConvert.test.ts` with:

- `toMessage(fromMessage(m))` deep-equals `m` for: empty message, message with 2 embeds and fields, V1 action row with button and select with options, V2 container with section, text display, thumbnail accessory, media gallery, file, separator. Take fixture messages from `src/discord/schema.ts` tests if any exist, otherwise write them by hand from the schema.
- `pathToId` has an entry for every array element in the fixture.
- `remove` of a container removes all descendants from `nodes`.
- `duplicate` produces no shared ids with the original.

Done when: tests pass, `tsc` passes, nothing else changed.

### F3. Embeds on the new store

Files: `EditorEmbeds.tsx`, `EditorEmbed.tsx`, `EditorEmbedBody.tsx`, `EditorEmbedAuthor.tsx`, `EditorEmbedFooter.tsx`, `EditorEmbedImages.tsx`, `EditorEmbedFields.tsx`, `EditorEmbedField.tsx`.

Pattern for every component: take `id: NodeId` as the only data prop. Read with `useNode<EmbedNode>(id)`. Write with `update(id, { title })`. Structural ops with `move(id, -1)`, `remove(id)`, `duplicate(id)`, `insert(parentId, "fields", "end", { type: "embedField", name: "", value: "" })`.

`EditorEmbeds` reads `useChildIds(rootId, "embeds")` and renders `<EditorEmbed id={id} />` per entry. No index props anywhere.

Validation: components currently pass `validationPathPrefix="embeds.0"` strings. Replace `useValidationErrorStore.getIssueByPath(path)` with a new `getIssueForNode(id, field?)` that looks up `pathToId` from the memoized `toMessage` result in reverse (build `idToPath` at the same time). The validation runner in `views/editor/editor.tsx` calls `messageSchema.safeParse(toMessage(state).message)` instead of parsing the store state directly.

`EditorMessagePreview`, `MessagePreview`, JSON view (`views/editor/json.tsx`), export (`MessageExportImport.tsx`), send (`api/mutations.ts` wherever it reads `useCurrentMessageStore.getState()`), share, and the AI assistant all read the message. Switch them to `toMessage(useDocumentStore.getState()).message` or a `useMessage()` hook that memoizes. Do this in F3 since the preview must show embeds from the new store.

The old `message.ts` store must still exist for components (V1 and V2) at this point. Both stores hold state, so `replaceAll` on the document store and `replace` on the old store both need to be called by restore, import, clear, and load-saved-message paths. Find them with `grep -rn "\.replace(" src`. This dual-write is temporary until F4.

Delete every `setEmbed*`, `addEmbed`, `moveEmbed*`, `duplicateEmbed`, `deleteEmbed`, `clearEmbeds`, `*EmbedField*` action from `message.ts` and its interface.

Done when: the embed editor is fully functional against the new store, undo works, preview updates, validation errors show on the right field, saved message load and restore populate embeds.

### F4. Components on the new store

Files: everything named `EditorComponent*.tsx` (27 files) and `EditorComponentEntry.tsx`, `EditorAction*.tsx` if they read component ids.

Same pattern as F3. The `EditorComponentBase*` files exist because the same UI is used at different nesting depths with different callback sets. With id-based access there is no difference between depths, so merge each `Base` file into its non-Base counterpart:

- `EditorComponentBaseButton` + `EditorComponentActionRowButton` -> `EditorComponentButton`
- `EditorComponentBaseSelectMenu` + `EditorComponentActionRowSelectMenu` -> `EditorComponentSelectMenu`
- `EditorComponentBaseActionRow` + `EditorComponentActionRow` -> `EditorComponentActionRow`
- `EditorComponentBaseContainer` + `EditorComponentContainer` -> `EditorComponentContainer`
- likewise for Section, TextDisplay, Separator, File, MediaGallery, MediaGalleryItem, Thumbnail, SelectMenuOption.

`EditorComponentEntry` becomes a switch on `node.type` rendering the matching component with `id`. `EditorComponentAddDropdown` takes `parentId` and `slot` and calls `insert`.

Action sets: buttons and select options reference `actionSetId`. `state/actions.ts` is a separate store today with a TODO to merge; leave it alone in this PR, just keep the `actionSetId` linkage identical to what `message.ts` does now (grep `actions[` in `message.ts` to see how ids are created on add and cleaned on remove; replicate in `insert` and `remove`).

Delete the remaining component actions from `message.ts`. After this PR `message.ts` should contain only `content`, `username`, `avatar_url`, `tts`, `thread_name`, `flags`, `allowed_mentions` and their setters.

Done when: V1 action rows and V2 containers are fully editable, nested add/move/remove/duplicate work at every depth, 5 root component limit and per-container limits still enforced (limits live in the zod schema, they just need to surface through validation).

### F5. Finish

- Move the remaining root fields into the `MessageNode`. `EditorWebhookFields.tsx`, `EditorMessageContentField.tsx`, `EditorComponentsV2Toggle.tsx`, `EditorMenuBar.tsx` switch to `useNode(rootId)` and `update(rootId, ...)`.
- Delete `src/state/message.ts`. Grep for `useCurrentMessageStore` and `useCurrentMessageUndoStore` and fix every remaining import. `EditorUndoButtons.tsx` uses the temporal store; point it at `useDocumentStore.temporal`.
- Persist migration: the old key `current-message` version 0 held a raw `Message`. In the document store's `persist` config add `migrate: (persisted, version) => version === 0 ? fromMessage(persisted as Message) : persisted`. Keep `name: "current-message"` so the migration actually fires.
- Fold `src/discord/restoreSchema.ts` into `schema.ts`. `restoreSchema` is the lenient parser used when importing arbitrary Discord JSON. Replace it with `messageSchema` plus `.catch()` defaults on the fields that differ, or a `preprocess` step, and make `fromMessage` accept the output. Grep for `restoreSchema` imports and switch them. Delete the file.
- Remove `immer` from `package.json` dependencies (zustand's middleware brings its own). Remove `just-debounce-it` or `debounce`, whichever has fewer imports, and switch the callers.

Done when: `grep -rn "message.ts\|restoreSchema\|useCurrentMessageStore" src` is empty, a draft saved under the old store version loads after deploy, all F2 tests pass, `tsc` and biome are clean.

---

## Things deliberately not in this plan

- Merging `state/actions.ts` into the document store. Separate later PR.
- Dependency bumps (react-query v3 to tanstack v5, vite 4 to 7, tailwind 3 to 4). Separate later PRs, one each.
- Any change to `embedg-site`.
- Any change to the sqlc handler layer beyond what the steps above require.
- Splitting `actions/template/func.go` (1202 lines). Works, leave it.
