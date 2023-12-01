package scheduled_messages

import "github.com/robfig/cron/v3"

var cronParser = cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)

func ParseCronExpression(cronExpression string) (cron.Schedule, error) {
	return cronParser.Parse(cronExpression)
}
