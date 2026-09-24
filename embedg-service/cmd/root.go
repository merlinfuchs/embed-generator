package cmd

import (
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/entry/server"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:           "embedg-server",
	Short:         "The backend for Embed Generator.",
	SilenceErrors: true,
	SilenceUsage:  true,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if !cmd.Flags().Changed("config") {
			config.Path = os.Getenv("EMBEDG_CONFIG")
		}
	},
}

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the server",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx, cancel := signal.NotifyContext(cmd.Context(), syscall.SIGINT, syscall.SIGTERM)
		defer cancel()

		env, err := setupEnv(ctx)
		if err != nil {
			return fmt.Errorf("failed to setup environment: %w", err)
		}

		err = server.Run(ctx, env.pg, env.blob, env.cfg)
		if err != nil {
			return fmt.Errorf("failed to run server: %w", err)
		}
		return nil
	},
}

func init() {
	rootCmd.PersistentFlags().StringVar(&config.Path, "config", "", "Config file (default is "+config.ConfigFile+" in the working directory, or $EMBEDG_CONFIG)")
	rootCmd.PersistentFlags().BoolVarP(&config.Debug, "debug", "D", false, "Enable debug logging")

	rootCmd.AddCommand(serverCmd, migrateCmd(), backupCmd(), adminCmd())
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		slog.Error("", slog.Any("error", err))
		os.Exit(1)
	}
}
