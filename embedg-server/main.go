package main

import (
	"math/rand"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/buildinfo"
	"github.com/merlinfuchs/embed-generator/embedg-server/config"
	"github.com/merlinfuchs/embed-generator/embedg-server/entry/admin"
	"github.com/merlinfuchs/embed-generator/embedg-server/entry/database"
	"github.com/merlinfuchs/embed-generator/embedg-server/entry/server"
	"github.com/merlinfuchs/embed-generator/embedg-server/telemetry"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var rootCmd = &cobra.Command{
	Use:              "embedg",
	Short:            "The backend for Embed Generator.",
	Long:             `The backend for Embed Generator.`,
	PersistentPreRun: bindFlags,
}

func init() {
	rootCmd.PersistentFlags().StringVar(&config.CfgFile, "config", "", "Config file (default is $HOME/.embedg.yaml)")
	rootCmd.Version = buildinfo.FullVersion()

	rootCmd.PersistentFlags().BoolP("debug", "D", false, "Debug mode (prints debug messages and call traces)")

	rootCmd.AddCommand(server.Setup())
	rootCmd.AddCommand(database.SetupMigrate())
	rootCmd.AddCommand(database.SetupBackup())
	rootCmd.AddCommand(admin.Setup())
}

func bindFlags(cmd *cobra.Command, args []string) {
	viper.BindPFlag("debug", cmd.Flags().Lookup("debug"))
	viper.BindPFlag("cfg.local", cmd.Flags().Lookup("cfg.local"))
	viper.BindPFlag("cfg.local_file", cmd.Flags().Lookup("cfg.local_file"))
	viper.BindPFlag("cfg.remote", cmd.Flags().Lookup("cfg.remote"))
	viper.BindPFlag("cfg.remote_file", cmd.Flags().Lookup("cfg.remote_file"))
	viper.BindPFlag("cfg.watch", cmd.Flags().Lookup("cfg.watch"))
	viper.BindPFlag("cfg.watch_interval_sec", cmd.Flags().Lookup("cfg.watch_interval_sec"))
}

func main() {
	config.InitConfig()
	telemetry.SetupLogger()

	rand.Seed(time.Now().UnixNano())
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}
