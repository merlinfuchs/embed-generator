package scheduled_messages

import (
	"time"

	"github.com/adhocore/gronx"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// GetNextCronTick returns the first tick strictly after last, evaluated in the given timezone. The result is in UTC.
func GetNextCronTick(cronExpression string, last time.Time, timezone string) (time.Time, error) {
	return nextTick(cronExpression, last, timezone, false)
}

// GetFirstCronTick returns the first tick at or after start, evaluated in the given timezone. The result is in UTC.
func GetFirstCronTick(cronExpression string, start time.Time, timezone string) (time.Time, error) {
	return nextTick(cronExpression, start, timezone, true)
}

func nextTick(cronExpression string, ref time.Time, timezone string, inclusive bool) (time.Time, error) {
	loc, err := common.LoadTimezone(timezone)
	if err != nil {
		return time.Time{}, err
	}

	next, err := tickInLocation(cronExpression, ref.In(loc), inclusive)
	if err != nil {
		return time.Time{}, err
	}

	if next.After(ref) || (inclusive && next.Equal(ref)) {
		return next, nil
	}

	// An offset change moved the tick onto or before ref, search again from there.
	return tickInLocation(cronExpression, next.In(loc), false)
}

// tickInLocation evaluates the expression against the wall clock of ref's location.
// gronx can't step over DST transitions (the repeated hour makes it loop), so it runs
// in a fixed offset and the resulting wall clock is mapped back into the location,
// which applies the offset that is valid on that day.
func tickInLocation(cronExpression string, ref time.Time, inclusive bool) (time.Time, error) {
	_, offset := ref.Zone()

	res, err := gronx.NextTickAfter(cronExpression, ref.In(time.FixedZone("", offset)), inclusive)
	if err != nil {
		return time.Time{}, err
	}

	return time.Date(res.Year(), res.Month(), res.Day(), res.Hour(), res.Minute(), res.Second(), 0, ref.Location()).UTC(), nil
}
