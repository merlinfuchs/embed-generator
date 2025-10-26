package server

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-server/api"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func Setup() *cobra.Command {
	serverRootCmd := &cobra.Command{
		Use:   "server",
		Short: "Start the server",
		Run: func(cmd *cobra.Command, args []string) {
			startServer()
		},
	}

	return serverRootCmd
}

func startServer() {
	stores := createStores()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	embedg, err := embedg.NewEmbedGenerator(
		embedg.EmbedGeneratorConfig{
			DiscordToken: viper.GetString("discord.token"),
		},
		stores.pg,
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize embedg")
	}

	go embedg.Start(ctx)

	api.Serve(embedg, &api.Stores{
		PG:   stores.pg,
		Blob: stores.blob,
	})
}
