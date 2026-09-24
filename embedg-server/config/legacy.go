package config

import (
	"fmt"
	"log/slog"
	"path/filepath"
	"strings"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

// LegacyConfigFile is what releases up to v0.6 read their config from.
const LegacyConfigFile = "config.yaml"

var legacyKeys = map[string]string{
	"postgres.dbname":  "database.postgres.db_name",
	"premium.guild_id": "premium.beneficial_guild_id",
	"premium.role_id":  "premium.beneficial_role_id",
	"debug":            "logging.debug",
}

var legacyPrefixes = []string{"postgres.", "s3."}

// renameLegacyKey maps a key from the v0.6 config layout to where it lives now, and returns
// other keys unchanged.
func renameLegacyKey(key string) string {
	if newKey, ok := legacyKeys[key]; ok {
		return newKey
	}
	for _, prefix := range legacyPrefixes {
		if strings.HasPrefix(key, prefix) {
			return "database." + key
		}
	}
	return key
}

func isLegacyConfigPath(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	return ext == ".yaml" || ext == ".yml"
}

func loadLegacyFile(k *koanf.Koanf, path string) error {
	slog.Warn(
		"Loading the deprecated YAML config, convert it to embedg.toml: https://github.com/merlinfuchs/embed-generator/blob/main/MIGRATION.md",
		slog.String("path", path),
	)

	legacy := koanf.New(".")
	if err := legacy.Load(file.Provider(path), yaml.Parser()); err != nil {
		return err
	}

	for key, value := range legacy.All() {
		if err := k.Set(renameLegacyKey(key), value); err != nil {
			return fmt.Errorf("failed to set %s: %w", key, err)
		}
	}
	return nil
}
