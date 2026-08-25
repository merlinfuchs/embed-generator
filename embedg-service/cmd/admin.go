package cmd

import (
	"fmt"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/entry/admin"
	"github.com/urfave/cli/v2"
)

var adminCMD = cli.Command{
	Name:  "admin",
	Usage: "Manage admin tasks.",
	Flags: []cli.Flag{
		&cli.BoolFlag{
			Name:  "debug",
			Usage: "Enable debug logging.",
		},
	},
	Subcommands: []*cli.Command{
		{
			Name:  "commands",
			Usage: "Manage commands.",
			Subcommands: []*cli.Command{
				{
					Name:  "sync",
					Usage: "Sync commands.",
					Action: func(c *cli.Context) error {
						ctx, cancel := signal.NotifyContext(c.Context, syscall.SIGINT, syscall.SIGTERM)
						defer cancel()

						env, err := setupEnv(ctx, c.Bool("debug"))
						if err != nil {
							return fmt.Errorf("failed to setup environment: %w", err)
						}

						err = admin.SyncCommands(ctx, env.pg, env.cfg)
						if err != nil {
							return fmt.Errorf("failed to delete gateway stream: %w", err)
						}
						return nil
					},
				},
			},
		},
	},
}
