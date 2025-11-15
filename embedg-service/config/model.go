package config

import (
	"github.com/go-playground/validator/v10"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type RootConfig struct {
	Discord  DiscordConfig  `toml:"discord"`
	Premium  PremiumConfig  `toml:"premium"`
	Logging  LoggingConfig  `toml:"logging"`
	Database DatabaseConfig `toml:"database"`
	Broker   BrokerConfig   `toml:"broker"`
	API      APIConfig      `toml:"api"`
	OpenAI   OpenAIConfig   `toml:"openai"`
}

func (cfg *RootConfig) Validate() error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	return validate.Struct(cfg)
}

type APIConfig struct {
	Host string `toml:"host" validate:"required"`
	Port int    `toml:"port" validate:"required"`
}

type DiscordConfig struct {
	Token string `toml:"token" validate:"required"`
}

type PremiumConfig struct {
	BeneficialGuildID common.ID    `toml:"beneficial_guild_id" `
	BeneficialRoleID  common.ID    `toml:"beneficial_role_id"`
	Plans             []model.Plan `toml:"plans"`
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
