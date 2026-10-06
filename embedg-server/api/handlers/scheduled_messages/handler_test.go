package scheduled_messages

import (
	"strings"
	"testing"
	"time"

	"gopkg.in/guregu/null.v4"
)

func TestCheckRunsBeforeEnd(t *testing.T) {
	loc, err := time.LoadLocation("America/Denver")
	if err != nil {
		t.Fatal(err)
	}

	// Starts at 1:00 PM and ends at 1:30 PM, but only ticks at 12:30 PM on days 1, 15 and 29.
	startAt := time.Date(2026, 10, 6, 13, 0, 0, 0, loc).UTC()
	endAt := null.TimeFrom(time.Date(2026, 10, 6, 13, 30, 0, 0, loc).UTC())

	nextAt, err := firstRun(false, "30 12 1/14 * *", "America/Denver", startAt)
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
