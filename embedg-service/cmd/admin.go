package cmd

import (
	"fmt"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/entry/admin"
	"github.com/spf13/cobra"
)

func adminCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "admin",
		Short: "Admin commands used for debugging and administration",
	}

	commands := &cobra.Command{
		Use:   "commands",
		Short: "Manage commands",
	}
	commands.AddCommand(&cobra.Command{
		Use:   "sync",
		Short: "Sync commands",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, cancel := signal.NotifyContext(cmd.Context(), syscall.SIGINT, syscall.SIGTERM)
			defer cancel()

			env, err := setupEnv(ctx)
			if err != nil {
				return fmt.Errorf("failed to setup environment: %w", err)
			}

			err = admin.SyncCommands(ctx, env.pg, env.cfg)
			if err != nil {
				return fmt.Errorf("failed to sync commands: %w", err)
			}
			return nil
		},
	})

	root.AddCommand(commands)
	return root
}
