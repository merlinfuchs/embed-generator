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
			OnlyOnce: true,
			StartAt:  time.Now(),
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
				OnlyOnce:     true,
				StartAt:      time.Now(),
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

	// Sent only once, there is nothing to repeat.
	req.OnlyOnce = true
	req.CronInterval = -1
	if err := req.Validate(); err != nil {
		t.Errorf("want the interval to be ignored when sent once, got %v", err)
	}
}
