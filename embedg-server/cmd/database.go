package cmd

import (
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/entry/database"
	"github.com/spf13/cobra"
)

var databases = []string{"postgres"}

func migrateCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "migrate [store] [operation]",
		Short: "Migrate given data store",
	}

	for _, db := range databases {
		store := &cobra.Command{
			Use:   db + " [operation]",
			Short: "Migrate " + db + " with the given operation",
		}
		store.PersistentFlags().Bool("danger", false, "Pass --danger to acknowledge this is potentially dangerous.")

		migrate := func(operation string, dangerous bool, withVersion bool) func(*cobra.Command, []string) error {
			return func(cmd *cobra.Command, args []string) error {
				if dangerous {
					if danger, _ := cmd.Flags().GetBool("danger"); !danger {
						return fmt.Errorf("this command is dangerous, use --danger flag to confirm")
					}
				}

				opts := database.MigrateOpts{}
				if withVersion {
					opts.TargetVersion, _ = cmd.Flags().GetInt("version")
				}
				return database.Migrate(cmd.Context(), db, operation, opts)
			}
		}

		force := &cobra.Command{
			Use:   "force",
			Short: "Forces the migration state to the given version",
			RunE:  migrate("force", true, true),
		}
		force.Flags().Int("version", 0, "Version to set the state to")
		force.MarkFlagRequired("version")

		to := &cobra.Command{
			Use:   "to",
			Short: "Migrates to the given version (up or down)",
			RunE:  migrate("to", true, true),
		}
		to.Flags().Int("version", 0, "Version to migrate to")
		to.MarkFlagRequired("version")

		store.AddCommand(
			&cobra.Command{Use: "up", Short: "Migrates the store to the latest version", RunE: migrate("up", false, false)},
			&cobra.Command{Use: "down", Short: "Migrates the store to the earliest version", RunE: migrate("down", true, false)},
			&cobra.Command{Use: "version", Short: "Prints the current version and \"dirty\" state", RunE: migrate("version", false, false)},
			&cobra.Command{Use: "list", Short: "Lists the migrations known to the application", RunE: migrate("list", false, false)},
			force,
			to,
		)
		root.AddCommand(store)
	}

	return root
}

func backupCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "backup [store] [operation]",
		Short: "Backup given data store",
	}

	for _, db := range databases {
		store := &cobra.Command{
			Use:   db + " [operation]",
			Short: "Backup " + db + " with the given operation",
		}

		create := &cobra.Command{
			Use:   "create",
			Short: "Create a backup of the store",
			RunE: func(cmd *cobra.Command, args []string) error {
				name, _ := cmd.Flags().GetString("name")
				return database.Backup(cmd.Context(), db, database.BackupOpts{
					Operation: "create",
					Name:      name,
				})
			},
		}
		create.Flags().String("name", "", "Name of the backup")
		create.MarkFlagRequired("name")

		store.AddCommand(create)
		root.AddCommand(store)
	}

	return root
}
