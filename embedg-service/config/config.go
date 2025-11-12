package config

import (
	_ "embed"
	"errors"
	"fmt"
	"io/fs"
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

const ConfigFile = "stateway.toml"

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

	configPath := filepath.Join(basePath, ConfigFile)
	if err := k.Load(file.Provider(configPath), parser); err != nil {
		var pathError *fs.PathError
		if !errors.As(err, &pathError) {
			return nil, fmt.Errorf("Failed to load config file: %v", err)
		}
	}

	envProvider := env.Provider("XENEX_", ".", func(s string) string {
		return strings.Replace(strings.ToLower(
			strings.TrimPrefix(s, "XENEX_")), "__", ".", -1)
	})
	if err := k.Load(envProvider, nil); err != nil {
		return nil, fmt.Errorf("Failed to load env config: %v", err)
	}

	return k, nil
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
