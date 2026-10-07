package scheduled_messages

import (
	"errors"
	"testing"
)

func TestScheduleRuns(t *testing.T) {
	cases := []struct {
		name     string
		schedule Schedule
		from     string
		want     []string
	}{
		{
			// Starts Oct 31, every 28 days across the end of DST on Nov 1.
			name:     "every 28 days",
			schedule: Schedule{Expression: "50 5 * * *", Timezone: "America/Denver", Interval: 28},
			from:     "2026-10-31T06:00:00Z",
			want:     []string{"2026-10-31T11:50:00Z", "2026-11-28T12:50:00Z", "2026-12-26T12:50:00Z"},
		},
		{
			// Starts on Wednesday Oct 7, so that week counts and the next one doesn't.
			name:     "every 2 weeks on two days",
			schedule: Schedule{Expression: "0 12 * * 1,4", Timezone: "UTC", Interval: 2},
			from:     "2026-10-07T00:00:00Z",
			want:     []string{"2026-10-08T12:00:00Z", "2026-10-19T12:00:00Z", "2026-10-22T12:00:00Z", "2026-11-02T12:00:00Z"},
		},
		{
			// April has no 31st, so the run that would fall in it is skipped, not moved.
			name:     "every 3 months on the 31st",
			schedule: Schedule{Expression: "0 12 31 * *", Timezone: "UTC", Interval: 3},
			from:     "2026-01-01T00:00:00Z",
			want:     []string{"2026-01-31T12:00:00Z", "2026-07-31T12:00:00Z", "2026-10-31T12:00:00Z"},
		},
		{
			// Unlike "0 */5 * * *" it keeps the 5 hours across midnight.
			name:     "every 5 hours",
			schedule: Schedule{Expression: "0 * * * *", Timezone: "UTC", Interval: 5},
			from:     "2026-10-07T10:30:00Z",
			want:     []string{"2026-10-07T11:00:00Z", "2026-10-07T16:00:00Z", "2026-10-07T21:00:00Z", "2026-10-08T02:00:00Z"},
		},
		{
			// Started after that day's tick, so the next day is the first and counting starts there.
			name:     "starts after the tick",
			schedule: Schedule{Expression: "50 5 * * *", Timezone: "UTC", Interval: 14},
			from:     "2026-10-07T15:30:00Z",
			want:     []string{"2026-10-08T05:50:00Z", "2026-10-22T05:50:00Z"},
		},
		{
			// Created in October, the first 1st is in November.
			name:     "every 3 months on the 1st",
			schedule: Schedule{Expression: "0 12 1 * *", Timezone: "UTC", Interval: 3},
			from:     "2026-10-07T00:00:00Z",
			want:     []string{"2026-11-01T12:00:00Z", "2027-02-01T12:00:00Z"},
		},
		{
			// Denver falls back on Nov 1 at 2:00, the gap stays 5 real hours.
			name:     "every 5 hours across dst",
			schedule: Schedule{Expression: "0 * * * *", Timezone: "America/Denver", Interval: 5},
			from:     "2026-10-31T20:00:00Z",
			want:     []string{"2026-10-31T20:00:00Z", "2026-11-01T01:00:00Z", "2026-11-01T06:00:00Z", "2026-11-01T11:00:00Z"},
		},
		{
			name:     "interval 1 is plain cron",
			schedule: Schedule{Expression: "0 8 * * *", Timezone: "Europe/Berlin", Interval: 1},
			from:     "2026-10-24T07:00:00Z",
			want:     []string{"2026-10-25T07:00:00Z", "2026-10-26T07:00:00Z"},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			from := mustParse(t, c.from)
			s := c.schedule
			if s.Anchor.IsZero() {
				s.Anchor = from
			}

			got, err := s.First(from)
			for i, want := range c.want {
				if err != nil {
					t.Fatal(err)
				}
				if !got.Equal(mustParse(t, want)) {
					t.Fatalf("run %d: got %s, want %s", i, got.Format("2006-01-02T15:04:05Z07:00"), want)
				}
				got, err = s.Next(got)
			}
		})
	}
}

func TestScheduleCatchesUp(t *testing.T) {
	// After downtime the next run keeps the cadence of the start date instead of restarting.
	s := Schedule{Expression: "50 5 * * *", Timezone: "America/Denver", Interval: 28, Anchor: mustParse(t, "2026-10-31T06:00:00Z")}

	got, err := s.Next(mustParse(t, "2027-03-01T00:00:00Z"))
	if err != nil {
		t.Fatal(err)
	}
	// Oct 31 + 5 * 28 days, after DST started on Mar 14.
	if want := mustParse(t, "2027-03-20T11:50:00Z"); !got.Equal(want) {
		t.Fatalf("got %s, want %s", got, want)
	}
}

func TestIntervalUnit(t *testing.T) {
	cases := []struct {
		expr string
		want periodUnit
		ok   bool
	}{
		{"* * * * *", unitMinute, true},
		{"0 * * * *", unitHour, true},
		{"50 5 * * *", unitDay, true},
		{"0 12 * * 1,4", unitWeek, true},
		{"0 12 ? * MON", unitWeek, true},
		{"0 12 1 * *", unitMonth, true},
		{"0 12 L * ?", unitMonth, true},
		{"*/5 * * * *", 0, false},
		{"0 */2 * * *", 0, false},
		{"0 12 1 * 1", 0, false},
		{"0 12 1,15 * *", 0, false},
		{"0 12 * 6 *", 0, false},
		{"0 12 * * 1#1", 0, false},
		{"0 12 * * 5L", 0, false},
		{"@daily", unitDay, true},
		{"0 12 * * mon", unitWeek, true},
		{"30 0 12 * * *", 0, false},
	}

	for _, c := range cases {
		got, err := intervalUnit(c.expr)
		if c.ok && (err != nil || got != c.want) {
			t.Errorf("%q: got %v, %v, want %v", c.expr, got, err, c.want)
		}
		if !c.ok && !errors.Is(err, ErrUnsupportedInterval) {
			t.Errorf("%q: got %v, %v, want ErrUnsupportedInterval", c.expr, got, err)
		}
	}
}
