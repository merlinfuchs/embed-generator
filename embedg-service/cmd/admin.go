package cmd

import (
	"fmt"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
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

	impersonate := &cobra.Command{
		Use:   "impersonate",
		Short: "Impersonate a user by creating a session token that can be injected into the session cookie",
		RunE: func(cmd *cobra.Command, args []string) error {
			rawUserID, _ := cmd.Flags().GetString("user_id")
			userID, err := common.ParseID(rawUserID)
			if err != nil {
				return fmt.Errorf("invalid user id: %w", err)
			}

			env, err := setupEnv(cmd.Context())
			if err != nil {
				return fmt.Errorf("failed to setup environment: %w", err)
			}

			token, err := session.CreateImpersonationSession(cmd.Context(), env.pg, userID)
			if err != nil {
				return fmt.Errorf("failed to create session token: %w", err)
			}

			fmt.Println("Session token:", token)
			return nil
		},
	}
	impersonate.Flags().String("user_id", "", "User ID to impersonate")
	impersonate.MarkFlagRequired("user_id")

	root.AddCommand(commands, impersonate)
	return root
}
