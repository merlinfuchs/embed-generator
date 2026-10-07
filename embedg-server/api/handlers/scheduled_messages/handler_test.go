package scheduled_messages

import (
	"strings"
	"testing"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"gopkg.in/guregu/null.v4"
)

func recurring(cronExpression, cronTimezone string, cronInterval int, startAt time.Time) *wire.ScheduledMessageScheduleWire {
	return &wire.ScheduledMessageScheduleWire{
		CronExpression: null.StringFrom(cronExpression),
		CronTimezone:   null.StringFrom(cronTimezone),
		CronInterval:   cronInterval,
		StartAt:        startAt,
	}
}

func TestCheckRunsBeforeEnd(t *testing.T) {
	loc, err := time.LoadLocation("America/Denver")
	if err != nil {
		t.Fatal(err)
	}

	// Starts at 1:00 PM and ends at 1:30 PM, but only ticks at 12:30 PM on days 1, 15 and 29.
	startAt := time.Date(2026, 10, 6, 13, 0, 0, 0, loc).UTC()
	endAt := null.TimeFrom(time.Date(2026, 10, 6, 13, 30, 0, 0, loc).UTC())

	nextAt, err := firstRun(recurring("30 12 1/14 * *", "America/Denver", 1, startAt), startAt)
	if err != nil {
		t.Fatal(err)
	}

	err = checkRunsBeforeEnd(nextAt, endAt, "America/Denver")
	if err == nil {
		t.Fatal("expected an error for a schedule that never runs before end_at")
	}
	if !strings.Contains(err.Error(), "Oct 15, 2026 at 12:30 PM (America/Denver)") {
		t.Errorf("unexpected error: %v", err)
	}

	if err := checkRunsBeforeEnd(nextAt, null.Time{}, "America/Denver"); err != nil {
		t.Errorf("expected no error without end_at, got %v", err)
	}

	if err := checkRunsBeforeEnd(nextAt, null.TimeFrom(nextAt), "America/Denver"); err != nil {
		t.Errorf("expected no error when the next run is exactly end_at, got %v", err)
	}
}

func TestFirstRun(t *testing.T) {
	startAt := time.Date(2026, 10, 7, 0, 0, 0, 0, time.UTC)
	now := time.Date(2026, 10, 20, 10, 0, 0, 0, time.UTC)

	// Started on Wednesday Oct 7, so the weeks of Oct 5 and Oct 19 are due. Oct 19 is already
	// over by now, the first run is that week's Thursday, not a restart of the cadence.
	got, err := firstRun(recurring("0 12 * * 1,4", "UTC", 2, startAt), now)
	if err != nil {
		t.Fatal(err)
	}
	if want := time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Errorf("got %s, want %s", got, want)
	}

	// Two days a month can't be counted in intervals.
	_, err = firstRun(recurring("0 12 1,15 * *", "UTC", 2, startAt), now)
	if err == nil || !strings.Contains(err.Error(), "only works with a schedule") {
		t.Errorf("want an unsupported interval to be rejected, got %v", err)
	}

	// The first two runs are a day apart, but every day it runs twice within a second.
	_, err = firstRun(recurring("0,1 0 12 * * *", "UTC", 1, startAt), now.Add(2*time.Hour+500*time.Millisecond))
	if err == nil || !strings.Contains(err.Error(), "too tight") {
		t.Errorf("want a schedule with seconds to be rejected, got %v", err)
	}
	if _, err := firstRun(recurring("* * * * *", "UTC", 1, startAt), now); err != nil {
		t.Errorf("want every minute to be allowed, got %v", err)
	}
}

func TestEndAfterRuns(t *testing.T) {
	startAt := time.Date(2026, 10, 7, 0, 0, 0, 0, time.UTC)
	s := recurring("0 12 * * *", "UTC", 2, startAt)
	s.EndAfterRuns = 3

	if err := endAfterRuns(s, time.Date(2026, 10, 7, 12, 0, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
	// Oct 7, 9 and 11, every second day.
	if want := time.Date(2026, 10, 11, 12, 0, 0, 0, time.UTC); !s.EndAt.Valid || !s.EndAt.Time.Equal(want) {
		t.Errorf("got %v, want %s", s.EndAt, want)
	}
}

func TestFirstRunOnDates(t *testing.T) {
	now := time.Date(2026, 10, 20, 12, 0, 0, 0, time.UTC)
	day := func(d int) time.Time { return time.Date(2026, 10, d, 18, 0, 0, 0, time.UTC) }

	s := &wire.ScheduledMessageScheduleWire{RunTimes: []time.Time{day(30), day(16), day(23), day(23)}}
	if err := normalizeSchedule(s); err != nil {
		t.Fatal(err)
	}
	if len(s.RunTimes) != 3 || !s.RunTimes[0].Equal(day(16)) || !s.StartAt.Equal(day(16)) {
		t.Fatalf("want the dates sorted without duplicates, got %v", s.RunTimes)
	}

	// The 16th is over, the 23rd is next.
	got, err := firstRun(s, now)
	if err != nil || !got.Equal(day(23)) {
		t.Errorf("got %s, %v, want %s", got, err, day(23))
	}

	// Picked as now, saved a few seconds later.
	pickedNow := &wire.ScheduledMessageScheduleWire{RunTimes: []time.Time{now.Add(-5 * time.Second)}}
	if got, err := firstRun(pickedNow, now); err != nil || !got.Equal(now) {
		t.Errorf("got %s, %v, want it to go out now", got, err)
	}

	past := &wire.ScheduledMessageScheduleWire{RunTimes: []time.Time{day(16)}}
	if _, err := firstRun(past, now); err == nil || !strings.Contains(err.Error(), "in the past") {
		t.Errorf("want all dates in the past to be rejected, got %v", err)
	}
}
