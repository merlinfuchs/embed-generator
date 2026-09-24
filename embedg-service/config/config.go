package config

import (
	_ "embed"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	gotoml "github.com/pelletier/go-toml/v2"

	"github.com/knadh/koanf/parsers/toml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/providers/rawbytes"
	"github.com/knadh/koanf/v2"
)

const ConfigFile = "embedg.toml"

// Path overrides where the config file is read from. Unlike the default, a file set here has to
// exist.
var Path string

// Debug forces logging.debug on, for the --debug flag.
var Debug bool

//go:embed default.toml
var defaultConfig []byte

type Validate interface {
	Validate() error
}

func LoadConfig[T Validate]() (T, error) {
	var res T

	k, err := loadBase(".")
	if err != nil {
		return res, fmt.Errorf("Failed to load base config: %v", err)
	}

	if err := k.UnmarshalWithConf("", &res, koanf.UnmarshalConf{Tag: "toml"}); err != nil {
		return res, fmt.Errorf("Failed to unmarshal full config: %v", err)
	}

	if err := res.Validate(); err != nil {
		return res, fmt.Errorf("Failed to validate plugin config: %v", err)
	}

	return res, nil
}

func loadBase(basePath string) (*koanf.Koanf, error) {
	k := koanf.New(".")
	parser := toml.Parser()

	if err := k.Load(rawbytes.Provider(defaultConfig), parser); err != nil {
		return nil, fmt.Errorf("Failed to load default config: %v", err)
	}

	configPath := Path
	if configPath == "" {
		configPath = filepath.Join(basePath, ConfigFile)
		legacyPath := filepath.Join(basePath, LegacyConfigFile)
		if !fileExists(configPath) && fileExists(legacyPath) {
			configPath = legacyPath
		}
	}

	var err error
	if isLegacyConfigPath(configPath) {
		err = loadLegacyFile(k, configPath)
	} else {
		err = k.Load(file.Provider(configPath), parser)
	}
	if err != nil {
		var pathError *fs.PathError
		if Path != "" || !errors.As(err, &pathError) {
			return nil, fmt.Errorf("Failed to load config file: %v", err)
		}
	}

	// Env vars named after the v0.6 layout load first so the current names win when both are set.
	usedLegacyEnv := false
	legacyEnvProvider := env.Provider("EMBEDG_", ".", func(s string) string {
		key := envKey(s)
		newKey := renameLegacyKey(key)
		if newKey == key {
			return ""
		}
		usedLegacyEnv = true
		return newKey
	})
	if err := k.Load(legacyEnvProvider, nil); err != nil {
		return nil, fmt.Errorf("Failed to load env config: %v", err)
	}
	if usedLegacyEnv {
		slog.Warn("Some EMBEDG_ environment variables use the deprecated v0.6 names, see https://github.com/merlinfuchs/embed-generator/blob/main/MIGRATION.md")
	}

	envProvider := env.Provider("EMBEDG_", ".", envKey)
	if err := k.Load(envProvider, nil); err != nil {
		return nil, fmt.Errorf("Failed to load env config: %v", err)
	}

	if Debug {
		if err := k.Set("logging.debug", true); err != nil {
			return nil, fmt.Errorf("Failed to set debug: %v", err)
		}
	}

	return k, nil
}

func envKey(s string) string {
	return strings.Replace(strings.ToLower(strings.TrimPrefix(s, "EMBEDG_")), "__", ".", -1)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func ConfigExists(basePath string) bool {
	configPath := filepath.Join(basePath, ConfigFile)
	_, err := os.Stat(configPath)
	return err == nil
}

func WriteConfig(basePath string, conf interface{}) error {
	configPath := filepath.Join(basePath, ConfigFile)

	f, err := os.Create(configPath)
	if err != nil {
		return fmt.Errorf("Failed to create config file: %v", err)
	}

	defer f.Close()

	encoder := gotoml.NewEncoder(f)
	if err := encoder.Encode(conf); err != nil {
		return fmt.Errorf("Failed to encode config: %v", err)
	}

	return nil
}
