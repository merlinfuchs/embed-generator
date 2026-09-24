package config

import (
	"fmt"

	"github.com/go-playground/validator/v10"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type RootConfig struct {
	API      APIConfig      `toml:"api"`
	App      AppConfig      `toml:"app"`
	CDN      CDNConfig      `toml:"cdn"`
	Discord  DiscordConfig  `toml:"discord"`
	Premium  PremiumConfig  `toml:"premium"`
	Links    LinksConfig    `toml:"links"`
	Logging  LoggingConfig  `toml:"logging"`
	Database DatabaseConfig `toml:"database"`
	OpenAI   OpenAIConfig   `toml:"openai"`
}

func (cfg *RootConfig) Validate() error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	if err := validate.Struct(cfg); err != nil {
		return err
	}

	return cfg.Discord.validateShards()
}

type APIConfig struct {
	PublicURL string `toml:"public_url" validate:"required"`
	// PprofAddr turns on net/http/pprof when set, along with block and mutex sampling. Keep it
	// on localhost, the dumps carry tokens and message content.
	PprofAddr       string `toml:"pprof_addr"`
	Host            string `toml:"host" validate:"required"`
	Port            int    `toml:"port" validate:"required"`
	InsecureCookies bool   `toml:"insecure_cookies"`
}

type CDNConfig struct {
	PublicURL string `toml:"public_url" validate:"required"`
}

type AppConfig struct {
	PublicURL string `toml:"public_url" validate:"required"`
}

type DiscordConfig struct {
	Token        string `toml:"token" validate:"required"`
	ClientID     string `toml:"client_id" validate:"required"`
	ClientSecret string `toml:"client_secret" validate:"required"`
	PublicKey    string `toml:"public_key" validate:"required"`
	// SupportGuildID is the guild users are added to when they opt into joining the support
	// server while logging in. Unset skips the join.
	SupportGuildID common.ID `toml:"support_guild_id"`
	RestURL        string    `toml:"rest_url"`
	// ActivityName is what the bot shows as "Watching <name>". Empty leaves it without a
	// presence.
	ActivityName string `toml:"activity_name"`
	// ShardCount is 0 to use the count Discord recommends for this bot, which is what a self
	// hoster wants and what keeps a growing bot from outgrowing a hardcoded number. Every
	// instance of a deployment has to agree on it, so pin it once you run more than one.
	ShardCount int `toml:"shard_count" validate:"min=0"`
	// IdentifyConcurrency is how many shards may identify per five second window. 0 uses what
	// Discord grants this bot. Lowering it spreads the guild burst at boot, which is worth doing
	// if the process can't keep up with the events while all the shards come up.
	IdentifyConcurrency int `toml:"identify_concurrency" validate:"min=0"`
	// ShardIDs is empty for a single instance that runs every shard. Prefer InstanceCount and
	// InstanceIndex below unless you need an irregular split.
	ShardIDs []int `toml:"shard_ids"`
	// InstanceCount and InstanceIndex derive the shard ids, so every instance of a deployment
	// runs the same config apart from its index. Zero or one means a single instance.
	InstanceCount int `toml:"instance_count"`
	InstanceIndex int `toml:"instance_index"`
}

func (c DiscordConfig) Shards() common.Shards {
	if c.InstanceCount > 1 {
		return common.ShardsForInstance(c.ShardCount, c.InstanceIndex, c.InstanceCount)
	}

	return common.NewShards(c.ShardCount, c.ShardIDs)
}

// validateShards catches what the shard math would otherwise absorb in silence: an id outside the
// range owns nothing, so nobody ever serves those guilds.
func (c DiscordConfig) validateShards() error {
	if c.InstanceCount < 0 || c.InstanceIndex < 0 {
		return fmt.Errorf("discord.instance_count and discord.instance_index can't be negative")
	}
	if c.InstanceCount > 0 {
		if c.InstanceIndex >= c.InstanceCount {
			return fmt.Errorf("discord.instance_index %d is outside instance_count %d", c.InstanceIndex, c.InstanceCount)
		}
		if c.ShardCount > 0 && c.InstanceCount > c.ShardCount {
			return fmt.Errorf("discord.instance_count %d is above shard_count %d, so some instances would run no shards", c.InstanceCount, c.ShardCount)
		}
		if len(c.ShardIDs) != 0 && c.InstanceCount > 1 {
			return fmt.Errorf("set either discord.shard_ids or discord.instance_count, not both")
		}
	}

	seen := make(map[int]struct{}, len(c.ShardIDs))
	for _, id := range c.ShardIDs {
		if id < 0 || id >= c.ShardCount {
			return fmt.Errorf("discord.shard_ids has %d, outside the range of shard_count %d", id, c.ShardCount)
		}
		if _, ok := seen[id]; ok {
			return fmt.Errorf("discord.shard_ids has %d twice", id)
		}
		seen[id] = struct{}{}
	}

	return nil
}

type PremiumConfig struct {
	BeneficialGuildID common.ID    `toml:"beneficial_guild_id" `
	BeneficialRoleID  common.ID    `toml:"beneficial_role_id"`
	Plans             []model.Plan `toml:"plans"`
}

type LinksConfig struct {
	Discord string `toml:"discord"`
	Source  string `toml:"source"`
}

type LoggingConfig struct {
	Filename   string `toml:"filename"`
	MaxSize    int    `toml:"max_size"`
	MaxAge     int    `toml:"max_age"`
	MaxBackups int    `toml:"max_backups"`
	Debug      bool   `toml:"debug"`
}

type DatabaseConfig struct {
	Postgres PostgresConfig `toml:"postgres"`
	S3       S3Config       `toml:"s3"`
}

type PostgresConfig struct {
	Host     string `toml:"host" validate:"required"`
	Port     int    `toml:"port" validate:"required"`
	DBName   string `toml:"db_name" validate:"required"`
	User     string `toml:"user" validate:"required"`
	Password string `toml:"password"`
}

type S3Config struct {
	Endpoint        string `toml:"endpoint" validate:"required"`
	AccessKeyID     string `toml:"access_key_id" validate:"required"`
	SecretAccessKey string `toml:"secret_access_key" validate:"required"`
	Secure          bool   `toml:"secure"`
	SSECKey         string `toml:"ssec_key"`
}

type OpenAIConfig struct {
	APIKey string `toml:"api_key"`
}
