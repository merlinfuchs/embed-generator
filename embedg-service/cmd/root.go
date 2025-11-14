package cmd

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/merlinfuchs/embed-generator/embedg-service/entry/server"
	"github.com/urfave/cli/v2"
)

var CLI = cli.App{
	Name:        "stateway-gateway",
	Description: "Stateway Gateway CLI",
	Commands: []*cli.Command{
		{
			Name:  "server",
			Usage: "Start the Stateway Cache Server.",
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

				err = server.Run(ctx, env.pg, env.cfg)
				if err != nil {
					return fmt.Errorf("failed to run cache server: %w", err)
				}
				return nil
			},
		},
		&adminCMD,
	},
}

func Execute() {
	if err := CLI.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
