package scheduled_messages

import (
	"fmt"
	"slices"
	"testing"
	"time"
)

// The engine's runs are checked against a brute force reference: every wall clock slot of the
// timezone is matched against the schedule the editor's sentence stands for, mapped to an instant
// (a wall clock a DST change skips moves forward by the change, one it shows twice is the first
// time), and then filtered to the periods the interval lands on.

// referenceInstant maps a wall clock in loc the way the reference expects, independently of the
// engine: it searches the instants around the one time.Date picks.
func referenceInstant(year int, month time.Month, day, hour, minute int, loc *time.Location) time.Time {
	want := time.Date(year, month, day, hour, minute, 0, 0, time.UTC)
	wall := func(t time.Time) time.Time { return asWallRef(t.In(loc)) }

	c := time.Date(year, month, day, hour, minute, 0, 0, loc)
	switch w := wall(c); {
	case w.Equal(want):
		// Shown twice: an earlier instant with the same wall clock is the first time.
		for _, d := range []time.Duration{2 * time.Hour, time.Hour, 30 * time.Minute} {
			if wall(c.Add(-d)).Equal(want) {
				return c.Add(-d).UTC()
			}
		}
		return c.UTC()
	case w.Before(want):
		// Skipped, and time.Date went back: move forward by what's missing.
		return c.Add(want.Sub(w)).UTC()
	default:
		// Skipped, and time.Date already moved forward.
		return c.UTC()
	}
}

func asWallRef(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), 0, 0, time.UTC)
}

type sentence struct {
	unit     periodUnit
	minute   int
	hour     int
	weekdays []time.Weekday
	monthDay int
}

func (s sentence) cron() string {
	switch s.unit {
	case unitMinute:
		return "* * * * *"
	case unitHour:
		return fmt.Sprintf("%d * * * *", s.minute)
	case unitDay:
		return fmt.Sprintf("%d %d * * *", s.minute, s.hour)
	case unitWeek:
		days := ""
		for i, d := range s.weekdays {
			if i > 0 {
				days += ","
			}
			days += fmt.Sprint(int(d))
		}
		return fmt.Sprintf("%d %d * * %s", s.minute, s.hour, days)
	default:
		return fmt.Sprintf("%d %d %d * *", s.minute, s.hour, s.monthDay)
	}
}

// referenceRuns lists the runs of the sentence in loc from the first one at or after anchor, until
// count of them are found or until is reached.
func referenceRuns(s sentence, interval int, loc *time.Location, anchor, until time.Time, count int) []time.Time {
	var ticks []time.Time
	wall := anchor.In(loc)
	// Start a day early, the anchor's own day may still have a tick after it.
	day := time.Date(wall.Year(), wall.Month(), wall.Day()-1, 0, 0, 0, 0, time.UTC)

	for len(ticks) < count*interval*40+10 && day.Before(until.AddDate(0, 0, 2)) {
		var candidates []time.Time
		switch s.unit {
		case unitMinute:
			for h := range 24 {
				for m := range 60 {
					candidates = append(candidates, referenceInstant(day.Year(), day.Month(), day.Day(), h, m, loc))
				}
			}
		case unitHour:
			for h := range 24 {
				candidates = append(candidates, referenceInstant(day.Year(), day.Month(), day.Day(), h, s.minute, loc))
			}
		case unitDay:
			candidates = append(candidates, referenceInstant(day.Year(), day.Month(), day.Day(), s.hour, s.minute, loc))
		case unitWeek:
			if slices.Contains(s.weekdays, day.Weekday()) {
				candidates = append(candidates, referenceInstant(day.Year(), day.Month(), day.Day(), s.hour, s.minute, loc))
			}
		case unitMonth:
			if day.Day() == s.monthDay {
				candidates = append(candidates, referenceInstant(day.Year(), day.Month(), day.Day(), s.hour, s.minute, loc))
			}
		}
		for _, c := range candidates {
			if !c.Before(anchor) {
				ticks = append(ticks, c.UTC())
			}
		}
		day = day.AddDate(0, 0, 1)
	}

	// Two wall clocks can map to the same instant around a DST change.
	slices.SortFunc(ticks, time.Time.Compare)
	ticks = slices.CompactFunc(ticks, time.Time.Equal)
	if len(ticks) == 0 || interval == 1 {
		return ticks[:min(count, len(ticks))]
	}

	first := s.unit.index(ticks[0].In(loc))
	var runs []time.Time
	for _, t := range ticks {
		if len(runs) == count {
			break
		}
		if (s.unit.index(t.In(loc))-first)%int64(interval) == 0 {
			runs = append(runs, t)
		}
	}
	return runs
}

func TestScheduleMatchesReference(t *testing.T) {
	zones := []string{
		"UTC",
		"America/New_York",    // US DST, March and November
		"Europe/Berlin",       // EU DST, the last Sundays of March and October
		"Asia/Kolkata",        // +5:30, no DST
		"Australia/Lord_Howe", // DST moves the clock by 30 minutes
		"Pacific/Chatham",     // +12:45 / +13:45
		"Pacific/Kiritimati",  // +14
		"America/Santiago",    // DST changes around midnight
	}
	anchors := []string{
		"2026-03-07T10:17:00Z", // before the US switches to DST
		"2026-03-28T22:00:00Z", // the night the EU switches to DST
		"2026-04-04T13:00:00Z", // Lord Howe and Santiago leave DST
		"2026-10-24T23:59:00Z", // the night the EU leaves DST
		"2026-10-31T23:10:00Z", // the night the US leaves DST
		"2027-01-31T12:00:00Z", // the end of a month
	}

	sentences := map[periodUnit][]sentence{
		unitMinute: {{unit: unitMinute}},
		unitHour:   {{unit: unitHour, minute: 0}, {unit: unitHour, minute: 30}},
		unitDay: {
			{unit: unitDay, hour: 0, minute: 0},
			{unit: unitDay, hour: 2, minute: 30}, // skipped or repeated on many DST nights
			{unit: unitDay, hour: 12, minute: 0},
			{unit: unitDay, hour: 23, minute: 45},
		},
		unitWeek: {
			{unit: unitWeek, hour: 2, minute: 30, weekdays: []time.Weekday{time.Sunday}},
			{unit: unitWeek, hour: 12, minute: 0, weekdays: []time.Weekday{time.Monday, time.Thursday}},
			{unit: unitWeek, hour: 9, minute: 0, weekdays: []time.Weekday{time.Sunday, time.Monday}},
		},
		unitMonth: {
			{unit: unitMonth, hour: 0, minute: 0, monthDay: 1},
			{unit: unitMonth, hour: 12, minute: 0, monthDay: 15},
			{unit: unitMonth, hour: 12, minute: 0, monthDay: 29},
			{unit: unitMonth, hour: 18, minute: 30, monthDay: 31},
		},
	}
	intervals := map[periodUnit][]int{
		unitMinute: {1, 7, 90},
		unitHour:   {1, 2, 5, 25},
		unitDay:    {1, 2, 3, 14, 28},
		unitWeek:   {1, 2, 3},
		unitMonth:  {1, 2, 3, 12},
	}
	const count = 12

	for _, zone := range zones {
		loc, err := time.LoadLocation(zone)
		if err != nil {
			t.Fatal(err)
		}
		for _, anchorText := range anchors {
			anchor := mustParse(t, anchorText)
			for unit, list := range sentences {
				for _, s := range list {
					for _, interval := range intervals[unit] {
						name := fmt.Sprintf("%s %s every %d from %s", zone, s.cron(), interval, anchorText)
						schedule := Schedule{Expression: s.cron(), Timezone: zone, Interval: interval, Anchor: anchor}

						until := anchor.AddDate(15, 0, 0)
						want := referenceRuns(s, interval, loc, anchor, until, count)
						if len(want) < count {
							t.Fatalf("%s: reference found only %d runs", name, len(want))
						}

						// Like the manager: each run is followed by the next after the time it went out.
						got := make([]time.Time, 0, count)
						run, err := schedule.First(anchor)
						for len(got) < count && err == nil {
							got = append(got, run)
							run, err = schedule.Next(run.Add(5 * time.Second))
						}
						if err != nil {
							t.Errorf("%s: %v", name, err)
							continue
						}
						if !slices.EqualFunc(got, want, time.Time.Equal) {
							t.Errorf("%s:\n got  %v\n want %v", name, formatRuns(got, loc), formatRuns(want, loc))
							continue
						}

						// The calendar's iterator steps through the same runs.
						next, err := schedule.Runs(got[0])
						if err != nil {
							t.Fatal(err)
						}
						for i := 1; i < count; i++ {
							r, err := next()
							if err != nil || !r.Equal(want[i]) {
								t.Errorf("%s: Runs gives %v, %v at %d, want %v", name, r, err, i, want[i])
								break
							}
						}
					}
				}
			}
		}
	}
}

func formatRuns(runs []time.Time, loc *time.Location) []string {
	res := make([]string, len(runs))
	for i, r := range runs {
		res[i] = r.In(loc).Format("2006-01-02 15:04 MST")
	}
	return res
}

func TestNextIsAfter(t *testing.T) {
	// A run at or before the last one would go out again on every pass of the manager. Around a DST
	// change a wall clock can map onto or before the time it's looked up from.
	cases := []struct{ zone, from string }{
		{"America/New_York", "2026-03-08T05:00:00Z"},
		{"America/New_York", "2026-11-01T04:00:00Z"},
		{"Europe/Berlin", "2026-03-29T00:00:00Z"},
		{"Europe/Berlin", "2026-10-25T00:00:00Z"},
		{"America/Santiago", "2026-09-06T02:00:00Z"},
		{"America/Santiago", "2026-04-05T02:00:00Z"},
		{"Australia/Lord_Howe", "2026-04-04T14:00:00Z"},
	}
	exprs := []string{"* * * * *", "0 * * * *", "30 * * * *", "30 2 * * *", "0 0 * * *", "30 1 * * 0", "*/15 * * * *"}

	for _, c := range cases {
		from := mustParse(t, c.from)
		for _, expr := range exprs {
			for _, interval := range []int{1, 2} {
				s := Schedule{Expression: expr, Timezone: c.zone, Interval: interval, Anchor: from.Add(-48 * time.Hour)}
				if _, err := intervalUnit(expr); err != nil && interval > 1 {
					continue
				}
				for ref := from; ref.Before(from.Add(4 * time.Hour)); ref = ref.Add(time.Minute) {
					got, err := s.Next(ref)
					if err != nil {
						t.Fatalf("%s %s every %d from %s: %v", c.zone, expr, interval, ref, err)
					}
					if !got.After(ref) {
						t.Fatalf("%s %s every %d: Next(%s) = %s", c.zone, expr, interval, ref, got)
					}
				}
			}
		}
	}
}
