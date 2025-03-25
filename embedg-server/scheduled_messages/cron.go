package scheduled_messages

import (
	"fmt"
	"time"

	_ "time/tzdata"

	"github.com/adhocore/gronx"
)

func GetNextCronTick(cronExpression string, last time.Time, timezone string) (time.Time, error) {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return time.Time{}, fmt.Errorf("Failed to load timezone: %w", err)
	}

	offset := getTimezoneOffset(loc)

	// The last time is in UTC, so we need to convert it to the timezone of the cron expression
	last = last.Add(time.Duration(offset) * time.Second)

	res, err := gronx.NextTickAfter(cronExpression, last, false)
	if err != nil {
		return res, err
	}

	// The result is in the timezone of the cron expression, so we need to convert it back to UTC
	res = res.Add(time.Duration(-offset) * time.Second)

	return res, nil
}

func GetFirstCronTick(cronExpression string, start time.Time, timezone string) (time.Time, error) {
	res, err := gronx.NextTickAfter(cronExpression, start, true)
	if err != nil {
		return res, err
	}

	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return time.Time{}, fmt.Errorf("Failed to load timezone: %w", err)
	}

	offset := getTimezoneOffset(loc)

	// The result is in the timezone of the cron expression, so we need to convert it back to UTC
	res = res.Add(time.Duration(-offset) * time.Second)

	return res, nil
}

func getTimezoneOffset(loc *time.Location) int {
	_, offset := time.Now().In(loc).Zone()
	return offset
}
