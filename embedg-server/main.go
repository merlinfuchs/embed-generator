package main

import (
	"fmt"
	"io"
	"math/rand"
	"os"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/api"
	"github.com/merlinfuchs/embed-generator/embedg-server/buildinfo"
	"github.com/merlinfuchs/embed-generator/embedg-server/config"
	"github.com/merlinfuchs/embed-generator/embedg-server/migrate"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/diode"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var rootCmd = &cobra.Command{
	Use:              "embedg",
	Short:            "The Friendly Service is a binary that serves as the (non-cloudflare) backend of Friendly Captcha's offering.",
	Long:             `The Friendly Service is a binary that serves as the (non-cloudflare) backend of Friendly Captcha's offering.`,
	PersistentPreRun: bindFlags,
}

func init() {
	rootCmd.PersistentFlags().StringVar(&config.CfgFile, "config", "", "Config file (default is $HOME/.friendly.yaml)")
	rootCmd.Version = buildinfo.Version() + " " + buildinfo.Target() + " (" + buildinfo.CommitDate() + ") " + buildinfo.Commit()

	rootCmd.PersistentFlags().BoolP("development", "d", false, "Development mode (prints prettier log messages)")
	rootCmd.PersistentFlags().BoolP("debug", "D", false, "Debug mode (prints debug messages and call traces)")

	rootCmd.AddCommand(&cobra.Command{
		Use: "server",
		Run: func(cmd *cobra.Command, args []string) {
			api.Serve()
		},
	})
	rootCmd.AddCommand(migrate.Setup())
}

func bindFlags(cmd *cobra.Command, args []string) {
	viper.BindPFlag("development", cmd.Flags().Lookup("development"))
	viper.BindPFlag("debug", cmd.Flags().Lookup("debug"))
	viper.BindPFlag("cfg.local", cmd.Flags().Lookup("cfg.local"))
	viper.BindPFlag("cfg.local_file", cmd.Flags().Lookup("cfg.local_file"))
	viper.BindPFlag("cfg.remote", cmd.Flags().Lookup("cfg.remote"))
	viper.BindPFlag("cfg.remote_file", cmd.Flags().Lookup("cfg.remote_file"))
	viper.BindPFlag("cfg.watch", cmd.Flags().Lookup("cfg.watch"))
	viper.BindPFlag("cfg.watch_interval_sec", cmd.Flags().Lookup("cfg.watch_interval_sec"))
}

func setupLogger() {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs

	logContext := log.With()

	var writer io.Writer
	if viper.GetBool("development") {
		logContext = logContext.Caller()
		writer = zerolog.ConsoleWriter{Out: os.Stdout}
	} else {
		writer = diode.NewWriter(os.Stderr, 1000, 0, func(missed int) {
			fmt.Printf("Logger Dropped %d messages", missed)
		})
	}

	log.Logger = logContext.Logger().Output(writer)

	if viper.GetBool("debug") {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
}

func main() {
	config.InitConfig()
	setupLogger()

	rand.Seed(time.Now().UnixNano())
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}
