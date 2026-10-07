package wire

import (
	"testing"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

func TestScheduledMessageEditCantCreateThread(t *testing.T) {
	req := ScheduledMessageCreateRequestWire{
		ChannelID:      1,
		SavedMessageID: "saved",
		Name:           "edit",
		MessageID:      common.NullID{ID: 2, Valid: true},
		ScheduledMessageScheduleWire: ScheduledMessageScheduleWire{
			RunTimes: []time.Time{time.Now()},
		},
	}
	if err := req.Validate(); err != nil {
		t.Fatalf("want an edit without a thread name to be valid, got %v", err)
	}

	req.ThreadName = null.StringFrom("thread")
	if err := req.Validate(); err == nil {
		t.Fatal("want an edit with a thread name to be rejected")
	}
}

func TestScheduledMessageTimezone(t *testing.T) {
	for tz, valid := range map[string]bool{
		"":              true,
		"UTC":           true,
		"Europe/Berlin": true,
		"Etc/Unknown":   false,
		"Local":         false,
	} {
		req := ScheduledMessageUpdateRequestWire{
			ChannelID:      1,
			SavedMessageID: "saved",
			Name:           "tz",
			ScheduledMessageScheduleWire: ScheduledMessageScheduleWire{
				RunTimes:     []time.Time{time.Now()},
				CronTimezone: null.NewString(tz, tz != ""),
			},
		}
		if err := req.Validate(); (err == nil) != valid {
			t.Errorf("timezone %q: want valid=%v, got %v", tz, valid, err)
		}
	}
}

func TestScheduledMessageCronInterval(t *testing.T) {
	req := ScheduledMessageCreateRequestWire{
		ChannelID:      1,
		SavedMessageID: "saved",
		Name:           "every 14 days",
		ScheduledMessageScheduleWire: ScheduledMessageScheduleWire{
			CronExpression: null.StringFrom("50 5 * * *"),
			StartAt:        time.Now(),
		},
	}

	for _, c := range []struct {
		interval int
		valid    bool
	}{{-1, false}, {0, true}, {1, true}, {14, true}, {1000, true}, {1001, false}} {
		req.CronInterval = c.interval
		if err := req.Validate(); (err == nil) != c.valid {
			t.Errorf("interval %d: got %v, want valid %v", c.interval, err, c.valid)
		}
	}

}

func TestScheduledMessageRunTimes(t *testing.T) {
	dates := []time.Time{time.Now(), time.Now().Add(time.Hour)}
	tooMany := make([]time.Time, MaxRunTimes+1)
	for i := range tooMany {
		tooMany[i] = time.Now().Add(time.Duration(i) * time.Hour)
	}

	for _, c := range []struct {
		name     string
		schedule ScheduledMessageScheduleWire
		valid    bool
	}{
		{"dates", ScheduledMessageScheduleWire{RunTimes: dates}, true},
		{"cron", ScheduledMessageScheduleWire{CronExpression: null.StringFrom("0 12 * * *"), StartAt: time.Now()}, true},
		{"neither", ScheduledMessageScheduleWire{StartAt: time.Now()}, false},
		{"both", ScheduledMessageScheduleWire{RunTimes: dates, CronExpression: null.StringFrom("0 12 * * *")}, false},
		{"dates with an end", ScheduledMessageScheduleWire{RunTimes: dates, EndAt: null.TimeFrom(time.Now())}, false},
		{"too many dates", ScheduledMessageScheduleWire{RunTimes: tooMany}, false},
	} {
		if err := c.schedule.Validate(); (err == nil) != c.valid {
			t.Errorf("%s: got %v, want valid %v", c.name, err, c.valid)
		}
	}
}
