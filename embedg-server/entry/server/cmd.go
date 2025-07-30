package server

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/api"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
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

	bot, err := bot.New(viper.GetString("discord.token"), stores.pg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize bot")
	}

	go bot.Start()

	api.Serve(&api.Stores{
		PG:   stores.pg,
		Blob: stores.blob,
		Bot:  bot,
	})
}
