package actions

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
)

type ActionManager struct {
	accessManager *access.AccessManager
	pg            *postgres.PostgresStore
	bot           *bot.Bot
}
