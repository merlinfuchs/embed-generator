package config

import "github.com/spf13/viper"

func setupDefaults() {
	v := viper.GetViper()

	v.SetDefault("discord.activity_name", "message.style")

	// Postgres defaults
	v.SetDefault("postgres.host", "localhost")
	v.SetDefault("postgres.port", 5432)
	v.SetDefault("postgres.dbname", "embedg")
	v.SetDefault("postgres.user", "postgres")
	v.SetDefault("postgres.password", "")

	// S3 defaults
	v.SetDefault("s3.endpoint", "localhost:9000")
	v.SetDefault("s3.access_key_id", "embedg")
	v.SetDefault("s3.secret_access_key", "1234567890")

	v.SetDefault("app.public_url", "http://localhost:5173/app")

	// API defaults
	v.SetDefault("api.host", "localhost")
	v.SetDefault("api.port", 8080)
	v.SetDefault("api.public_url", "http://localhost:5173/api")

	// CDN defaults
	v.SetDefault("cdn.public_url", "http://localhost:8080/cdn")
}
