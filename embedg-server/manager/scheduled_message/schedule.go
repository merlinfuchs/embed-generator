package scheduled_messages

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/adhocore/gronx"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

var ErrUnsupportedInterval = errors.New("an interval only works with a schedule that runs every minute, hour, day, week or month")

// ErrNeverRuns means no period the interval lands on has a tick, like the 30th every 12 months
// counted from a February.
var ErrNeverRuns = errors.New("the schedule never runs")

// Schedule is a cron expression evaluated in a timezone. With an Interval above 1 it only runs in
// every Interval-th period counted from its first tick at or after Anchor, which cron can't express:
// "every 14 days" in cron restarts on the 1st of every month. What a period is follows from the
// expression, a day for "50 5 * * *", a week for "0 12 * * 1,4", a month for "0 12 1 * *".
type Schedule struct {
	Expression string
	Timezone   string
	Interval   int
	Anchor     time.Time
}

// NextDate returns the first of the sorted dates after last. Dates missed while the bot was down
// are skipped instead of all going out at once.
func NextDate(dates []time.Time, last time.Time) (time.Time, bool) {
	for _, d := range dates {
		if d.After(last) {
			return d, true
		}
	}
	return time.Time{}, false
}

// ScheduleOf returns the schedule of a recurring scheduled message.
func ScheduleOf(msg model.ScheduledMessage) Schedule {
	return Schedule{
		Expression: msg.CronExpression.String,
		Timezone:   msg.CronTimezone.String,
		Interval:   msg.CronInterval,
		Anchor:     msg.StartAt,
	}
}

// First returns the first run at or after start, never before the anchor. The result is in UTC.
func (s Schedule) First(start time.Time) (time.Time, error) {
	if start.Before(s.Anchor) {
		start = s.Anchor
	}
	return s.next(start, true)
}

// Next returns the first run strictly after last. The result is in UTC.
func (s Schedule) Next(last time.Time) (time.Time, error) {
	return s.next(last, false)
}

func (s Schedule) next(ref time.Time, inclusive bool) (time.Time, error) {
	tick, err := nextTick(s.Expression, ref, s.Timezone, inclusive)
	if err != nil || s.Interval <= 1 {
		return tick, err
	}

	unit, err := intervalUnit(s.Expression)
	if err != nil {
		return time.Time{}, err
	}
	loc, err := common.LoadTimezone(s.Timezone)
	if err != nil {
		return time.Time{}, err
	}

	// Counted from the first tick, so starting after the day's tick doesn't skip a whole interval.
	firstTick, err := nextTick(s.Expression, s.Anchor, s.Timezone, true)
	if err != nil {
		return time.Time{}, err
	}
	anchor := unit.index(firstTick.In(loc))
	interval := int64(s.Interval)

	// Each step either finds a run or jumps to the start of the next period that's due, so it
	// only takes more than one when a due period has no tick, like day 31 in a short month.
	for range 100 {
		period := unit.index(tick.In(loc))
		if period >= anchor && (period-anchor)%interval == 0 {
			return tick, nil
		}

		due := anchor
		if period > anchor {
			due = period + interval - (period-anchor)%interval
		}
		// It's later than ref. Searching from the wall clock the period starts at still finds a
		// tick on a midnight that DST skips, which maps to after the start.
		wall, start := unit.start(due, loc)
		tick, err = searchTicks(s.Expression, wall, loc, start, true)
		if err != nil {
			return time.Time{}, err
		}
	}

	return time.Time{}, fmt.Errorf("%w: no run of %q every %d periods found", ErrNeverRuns, s.Expression, s.Interval)
}

type periodUnit int

const (
	unitMinute periodUnit = iota
	unitHour
	unitDay
	unitWeek
	unitMonth
)

// intervalUnit tells what one period of the expression is. Only expressions that run once per
// period at a fixed time (or every minute) have one, anything else is ambiguous to count.
func intervalUnit(expr string) (periodUnit, error) {
	segs, err := gronx.Segments(expr)
	if err != nil || len(segs) != 6 || segs[0] != "0" {
		return 0, ErrUnsupportedInterval
	}
	minute, hour, dom, month, dow := segs[1], segs[2], segs[3], segs[4], segs[5]

	wild := func(f string) bool { return f == "*" || f == "?" }
	number := func(f string) bool {
		_, err := strconv.Atoi(f)
		return err == nil
	}
	if !wild(month) {
		return 0, ErrUnsupportedInterval
	}

	if minute == "*" {
		if wild(hour) && wild(dom) && wild(dow) {
			return unitMinute, nil
		}
		return 0, ErrUnsupportedInterval
	}
	if !number(minute) {
		return 0, ErrUnsupportedInterval
	}

	if wild(hour) {
		if wild(dom) && wild(dow) {
			return unitHour, nil
		}
		return 0, ErrUnsupportedInterval
	}
	if !number(hour) {
		return 0, ErrUnsupportedInterval
	}

	switch {
	case wild(dom) && wild(dow):
		return unitDay, nil
	// "1#1" and "5L" pick one weekday a month, not a week.
	case wild(dom) && !strings.ContainsAny(dow, "#L"):
		return unitWeek, nil
	case wild(dow) && (number(dom) || dom == "L"):
		return unitMonth, nil
	}
	return 0, ErrUnsupportedInterval
}

// index numbers the period t falls in, so that consecutive periods differ by one. Minutes and hours
// count real time, so a DST change doesn't stretch the gap between runs. Days and longer go by the
// calendar of t's location.
func (u periodUnit) index(t time.Time) int64 {
	day := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC).Unix() / 86400
	switch u {
	case unitMinute:
		return t.Unix() / 60
	case unitHour:
		return t.Unix() / 3600
	case unitWeek:
		// 1970-01-05, day 4, is the first Monday.
		return (day - 4) / 7
	case unitMonth:
		return int64(t.Year())*12 + int64(t.Month()) - 1
	default:
		return day
	}
}

// start returns when the period with the given index begins in loc, as the wall clock written as
// UTC and as the instant. time.Date carries the overflowing field into the larger ones.
func (u periodUnit) start(index int64, loc *time.Location) (wall, instant time.Time) {
	switch u {
	case unitMinute:
		instant = time.Unix(index*60, 0)
		return asWall(instant.In(loc)), instant
	case unitHour:
		instant = time.Unix(index*3600, 0)
		return asWall(instant.In(loc)), instant
	case unitWeek:
		wall = time.Date(1970, 1, 1+int(index)*7+4, 0, 0, 0, 0, time.UTC)
	case unitMonth:
		wall = time.Date(0, time.Month(index+1), 1, 0, 0, 0, 0, time.UTC)
	default:
		wall = time.Date(1970, 1, 1+int(index), 0, 0, 0, 0, time.UTC)
	}
	return wall, wallToInstant(wall, loc)
}
