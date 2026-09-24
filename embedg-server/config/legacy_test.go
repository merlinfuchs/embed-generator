package config

import (
	"os"
	"path/filepath"
	"testing"
)

// The config.yaml layout from the v0.6 README.
const legacyYAML = `
discord:
  client_id: "123"
  client_secret: "secret"
  public_key: "key"
  token: "token"
postgres:
  host: "db.internal"
  port: 5433
  dbname: "legacy"
  user: "embedg"
  password: "pw"
s3:
  endpoint: "s3.internal:9000"
  access_key_id: "access"
  secret_access_key: "secret"
  secure: true
api:
  public_url: "https://example.com/api"
  insecure_cookies: true
premium:
  guild_id: "456"
  role_id: "789"
  plans:
    - id: default
      default: true
      features:
        max_saved_messages: 25
        component_types: [1, 2, 3]
    - id: premium_server
      sku_id: "123"
      features:
        max_saved_messages: 100
debug: true
`

func loadLegacyTestConfig(t *testing.T) *RootConfig {
	t.Helper()

	cfg, err := LoadConfig[*RootConfig]()
	if err != nil {
		t.Fatal(err)
	}
	return cfg
}

func TestLegacyYAMLConfig(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, LegacyConfigFile), []byte(legacyYAML), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Chdir(dir)

	cfg := loadLegacyTestConfig(t)

	pg := cfg.Database.Postgres
	if pg.Host != "db.internal" || pg.Port != 5433 || pg.DBName != "legacy" || pg.User != "embedg" || pg.Password != "pw" {
		t.Errorf("postgres = %+v", pg)
	}
	s3 := cfg.Database.S3
	if s3.Endpoint != "s3.internal:9000" || s3.AccessKeyID != "access" || !s3.Secure {
		t.Errorf("s3 = %+v", s3)
	}
	if cfg.Premium.BeneficialGuildID != 456 || cfg.Premium.BeneficialRoleID != 789 {
		t.Errorf("premium ids = %d, %d", cfg.Premium.BeneficialGuildID, cfg.Premium.BeneficialRoleID)
	}
	if len(cfg.Premium.Plans) != 2 || !cfg.Premium.Plans[0].Default || cfg.Premium.Plans[1].SKUID != "123" ||
		cfg.Premium.Plans[1].Features.MaxSavedMessages != 100 || len(cfg.Premium.Plans[0].Features.ComponentTypes) != 3 {
		t.Errorf("plans = %+v", cfg.Premium.Plans)
	}
	if !cfg.Logging.Debug || !cfg.API.InsecureCookies || cfg.Discord.Token != "token" {
		t.Errorf("logging.debug = %v, api = %+v, discord.token = %q", cfg.Logging.Debug, cfg.API, cfg.Discord.Token)
	}
}

func TestTOMLConfigWinsOverLegacy(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, LegacyConfigFile), []byte(legacyYAML), 0o600); err != nil {
		t.Fatal(err)
	}
	toml := "[discord]\nclient_id = \"1\"\nclient_secret = \"1\"\npublic_key = \"1\"\ntoken = \"from-toml\"\n"
	if err := os.WriteFile(filepath.Join(dir, ConfigFile), []byte(toml), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Chdir(dir)

	cfg := loadLegacyTestConfig(t)
	if cfg.Discord.Token != "from-toml" || cfg.Database.Postgres.Host != "127.0.0.1" {
		t.Errorf("discord.token = %q, postgres.host = %q", cfg.Discord.Token, cfg.Database.Postgres.Host)
	}
}

func TestLegacyEnvVars(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("EMBEDG_DISCORD__CLIENT_ID", "1")
	t.Setenv("EMBEDG_DISCORD__CLIENT_SECRET", "1")
	t.Setenv("EMBEDG_DISCORD__PUBLIC_KEY", "1")
	t.Setenv("EMBEDG_DISCORD__TOKEN", "1")
	t.Setenv("EMBEDG_POSTGRES__HOST", "old")
	t.Setenv("EMBEDG_POSTGRES__DBNAME", "old-db")
	t.Setenv("EMBEDG_S3__ENDPOINT", "old-s3")
	t.Setenv("EMBEDG_DATABASE__S3__ENDPOINT", "new-s3")

	cfg := loadLegacyTestConfig(t)
	if cfg.Database.Postgres.Host != "old" || cfg.Database.Postgres.DBName != "old-db" {
		t.Errorf("postgres = %+v", cfg.Database.Postgres)
	}
	if cfg.Database.S3.Endpoint != "new-s3" {
		t.Errorf("s3.endpoint = %q, want the current name to win", cfg.Database.S3.Endpoint)
	}
}
