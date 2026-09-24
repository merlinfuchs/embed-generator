package scheduled_messages

import (
	"testing"
	"time"
)

func mustParse(t *testing.T, s string) time.Time {
	t.Helper()
	res, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func TestGetFirstCronTick(t *testing.T) {
	cases := []struct {
		name, tz, start, want string
	}{
		// 06:00 New York, cron 08:00 -> same day
		{"negative offset same day", "America/New_York", "2026-09-13T10:00:00Z", "2026-09-13T12:00:00Z"},
		// 08:30 Berlin, cron 08:00 -> next day, never in the past
		{"positive offset next day", "Europe/Berlin", "2026-09-13T06:30:00Z", "2026-09-14T06:00:00Z"},
		// exactly on the tick -> inclusive
		{"inclusive", "Europe/Berlin", "2026-09-13T06:00:00Z", "2026-09-13T06:00:00Z"},
		{"empty timezone is UTC", "", "2026-09-13T06:30:00Z", "2026-09-13T08:00:00Z"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := GetFirstCronTick("0 8 * * *", mustParse(t, c.start), c.tz)
			if err != nil {
				t.Fatal(err)
			}
			if !got.Equal(mustParse(t, c.want)) {
				t.Fatalf("got %s, want %s", got, c.want)
			}
		})
	}
}

func TestGetNextCronTick(t *testing.T) {
	cases := []struct {
		name, tz, last, want string
	}{
		{"strictly after", "Europe/Berlin", "2026-09-13T06:00:00Z", "2026-09-14T06:00:00Z"},
		// Berlin switches from CEST (+2) to CET (+1) on 2026-10-25
		{"across dst end", "Europe/Berlin", "2026-10-24T06:00:00Z", "2026-10-25T07:00:00Z"},
		// New York switches from EDT (-4) to EST (-5) on 2026-11-01
		{"across dst end us", "America/New_York", "2026-10-31T12:00:00Z", "2026-11-01T13:00:00Z"},
		// New York switches from EST (-5) to EDT (-4) on 2026-03-08
		{"across dst start us", "America/New_York", "2026-03-07T13:00:00Z", "2026-03-08T12:00:00Z"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := GetNextCronTick("0 8 * * *", mustParse(t, c.last), c.tz)
			if err != nil {
				t.Fatal(err)
			}
			if !got.Equal(mustParse(t, c.want)) {
				t.Fatalf("got %s, want %s", got, c.want)
			}
		})
	}
}
