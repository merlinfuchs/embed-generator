package config

import "github.com/spf13/viper"

func setupDefaults() {
	v := viper.GetViper()

	// Postgres defaults
	v.SetDefault("postgres.host", "localhost")
	v.SetDefault("postgres.port", 5432)
	v.SetDefault("postgres.dbname", "embedg")
	v.SetDefault("postgres.user", "postgres")
	v.SetDefault("postgres.password", "")

	v.SetDefault("app.public_url", "http://localhost:5173/app")
	v.SetDefault("app.serve_static", true)

	// API defaults
	v.SetDefault("api.host", "localhost")
	v.SetDefault("api.port", 8080)
	v.SetDefault("api.public_url", "http://localhost:5173/api")
}
