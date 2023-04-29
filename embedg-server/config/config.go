package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

var CfgFile string

func InitConfig() {
	if CfgFile != "" {
		// Use config file from the flag.
		fmt.Println("Using config file from flag:", CfgFile)
		viper.SetConfigFile(CfgFile)
	} else {
		viper.AddConfigPath("./")
		viper.SetConfigName("config")
	}

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "__"))
	viper.SetEnvPrefix("embedg")
	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	err := viper.ReadInConfig()
	if err != nil {
		fmt.Println("WARN could not find config file", err)
	} else {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	}

	setupDefaults()
}
