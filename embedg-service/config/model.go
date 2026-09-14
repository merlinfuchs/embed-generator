package config

import (
	"github.com/go-playground/validator/v10"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
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
	Broker   BrokerConfig   `toml:"broker"`
	OpenAI   OpenAIConfig   `toml:"openai"`
}

func (cfg *RootConfig) Validate() error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	return validate.Struct(cfg)
}

type APIConfig struct {
	PublicURL       string `toml:"public_url" validate:"required"`
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
	RestURL      string `toml:"rest_url"`
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

type BrokerConfig struct {
	NATS         NATSConfig `toml:"nats"`
	GatewayCount int        `toml:"gateway_count"`
}

type NATSConfig struct {
	URL string `toml:"url" validate:"required"`
}

type OpenAIConfig struct {
	APIKey string `toml:"api_key"`
}
