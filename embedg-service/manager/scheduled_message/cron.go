package scheduled_messages

import (
	"fmt"
	"time"

	_ "time/tzdata"

	"github.com/adhocore/gronx"
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
	loc, err := loadLocation(timezone)
	if err != nil {
		return time.Time{}, err
	}

	// gronx evaluates the expression against the wall clock of ref's location, but it
	// can't step over DST transitions (the repeated hour makes it loop). So evaluate
	// in a fixed offset and map the resulting wall clock back into the real location,
	// which applies the offset that is valid on that day.
	for i := 0; i < 3; i++ {
		local := ref.In(loc)
		_, offset := local.Zone()

		res, err := gronx.NextTickAfter(cronExpression, local.In(time.FixedZone("", offset)), inclusive)
		if err != nil {
			return time.Time{}, err
		}

		next := time.Date(res.Year(), res.Month(), res.Day(), res.Hour(), res.Minute(), res.Second(), 0, loc).UTC()
		if next.After(ref) || (inclusive && next.Equal(ref)) {
			return next, nil
		}

		// Landed on or before ref due to an offset change, search again from there.
		ref, inclusive = next, false
	}

	return time.Time{}, fmt.Errorf("failed to find next tick for %q", cronExpression)
}

func loadLocation(timezone string) (*time.Location, error) {
	if timezone == "" {
		return time.UTC, nil
	}

	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return nil, fmt.Errorf("failed to load timezone %q: %w", timezone, err)
	}
	return loc, nil
}
