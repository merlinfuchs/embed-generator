package cmd

import (
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/entry/server"
	"github.com/urfave/cli/v2"
)

var CLI = cli.App{
	Name:        "embedg",
	Description: "Embed Generator CLI",
	Flags: []cli.Flag{
		&cli.StringFlag{
			Name:    "config",
			Aliases: []string{"c"},
			Usage:   "Path to the config file. Defaults to " + config.ConfigFile + " in the working directory.",
			EnvVars: []string{"EMBEDG_CONFIG"},
		},
	},
	Before: func(c *cli.Context) error {
		config.Path = c.String("config")
		return nil
	},
	Commands: []*cli.Command{
		{
			Name:  "server",
			Usage: "Start the Embed Generator server.",
			Flags: []cli.Flag{
				&cli.BoolFlag{
					Name:  "debug",
					Usage: "Enable debug logging.",
				},
			},
			Action: func(c *cli.Context) error {
				ctx, cancel := signal.NotifyContext(c.Context, syscall.SIGINT, syscall.SIGTERM)
				defer cancel()

				env, err := setupEnv(ctx, c.Bool("debug"))
				if err != nil {
					return fmt.Errorf("failed to setup environment: %w", err)
				}

				err = server.Run(ctx, env.pg, env.blob, env.cfg)
				if err != nil {
					return fmt.Errorf("failed to run cache server: %w", err)
				}
				return nil
			},
		},
		&adminCMD,
		&databaseCMD,
	},
}

func Execute() {
	if err := CLI.Run(os.Args); err != nil {
		slog.Error("", slog.Any("error", err))
		os.Exit(1)
	}
}
