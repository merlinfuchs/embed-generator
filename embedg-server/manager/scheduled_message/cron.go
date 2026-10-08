package scheduled_messages

import (
	"fmt"
	"time"

	"github.com/adhocore/gronx"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// nextTick returns the first tick after ref, or at ref when inclusive, of the expression on the
// wall clock of the timezone. The result is in UTC.
//
// gronx runs on the wall clock written as UTC, where no DST change gets in the way, and each match
// is mapped back into the timezone. Around a DST change a match can map onto or before ref, then
// the search goes on after that wall clock, so the result is always later than ref.
func nextTick(cronExpression string, ref time.Time, timezone string, inclusive bool) (time.Time, error) {
	loc, err := common.LoadTimezone(timezone)
	if err != nil {
		return time.Time{}, err
	}

	return searchTicks(cronExpression, asWall(ref.In(loc)), loc, ref, inclusive)
}

// searchTicks steps through the wall clock matches of the expression from wall on and returns the
// first one that maps to after ref, or to ref when inclusive.
func searchTicks(cronExpression string, wall time.Time, loc *time.Location, ref time.Time, inclusive bool) (time.Time, error) {
	wallInclusive := true
	if wall.Equal(asWall(ref.In(loc))) {
		wallInclusive = inclusive
	}
	// A repeated hour of minute ticks is the most it has to step over.
	for range 240 {
		next, err := gronx.NextTickAfter(cronExpression, wall, wallInclusive)
		if err != nil {
			return time.Time{}, err
		}
		if t := wallToInstant(next, loc); t.After(ref) || (inclusive && t.Equal(ref)) {
			return t, nil
		}
		wall, wallInclusive = next, false
	}
	return time.Time{}, fmt.Errorf("no tick of %q after %s", cronExpression, ref)
}

// asWall is the wall clock of t, written as UTC.
func asWall(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), time.UTC)
}

// The offsets a day and a bit before and after a wall clock tell whether a DST change is near it.
const offsetProbe = 30 * time.Hour

// wallToInstant is when loc's clock shows the wall clock, written as UTC. One a DST change skips
// moves forward by the change, 2:30 to 3:30, and one it shows twice is the first time. The result
// is in UTC.
func wallToInstant(wall time.Time, loc *time.Location) time.Time {
	var res time.Time
	for _, probe := range []time.Duration{-offsetProbe, offsetProbe} {
		_, offset := wall.Add(probe).In(loc).Zone()
		t := wall.Add(-time.Duration(offset) * time.Second)
		if asWall(t.In(loc)).Equal(wall) && (res.IsZero() || t.Before(res)) {
			res = t
		}
	}
	if !res.IsZero() {
		return res.UTC()
	}

	// Skipped: read it with the offset from before the change, which lands after it.
	_, before := wall.Add(-offsetProbe).In(loc).Zone()
	return wall.Add(-time.Duration(before) * time.Second).UTC()
}
