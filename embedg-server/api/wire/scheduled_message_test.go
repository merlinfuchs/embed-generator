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
		OnlyOnce:       true,
		StartAt:        time.Now(),
		MessageID:      common.NullID{ID: 2, Valid: true},
	}
	if err := req.Validate(); err != nil {
		t.Fatalf("want an edit without a thread name to be valid, got %v", err)
	}

	req.ThreadName = null.StringFrom("thread")
	if err := req.Validate(); err == nil {
		t.Fatal("want an edit with a thread name to be rejected")
	}
}
