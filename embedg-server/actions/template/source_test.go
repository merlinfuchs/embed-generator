package template

import (
	"context"
	"errors"
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

// failingKVStore fails every call the way an unavailable database would.
type failingKVStore struct{ store.KVEntryStore }

var errDatabaseDown = errors.New("database down")

func (failingKVStore) GetKVEntry(context.Context, common.ID, string) (*model.KVEntry, error) {
	return nil, errDatabaseDown
}

func TestSourceErrSeparatesInternalFailures(t *testing.T) {
	// A store failure behind kvGet is ours, not the template's.
	src := NewSource(context.Background(), nil)
	c := NewContext("TEST", 0, NewKVProvider(src, 1, failingKVStore{}, 10))
	if _, err := c.ParseAndExecute(`{{ kvGet "a" }}`); err == nil {
		t.Fatal("template with failing store rendered")
	}
	if !errors.Is(src.Err(), errDatabaseDown) {
		t.Errorf("Err() = %v, want the store failure", src.Err())
	}

	// A template mistake leaves Err() empty.
	src = NewSource(context.Background(), nil)
	c = NewContext("TEST", 0, NewKVProvider(src, 1, failingKVStore{}, 10))
	if _, err := c.ParseAndExecute(`{{ len .Missing }}`); err == nil {
		t.Fatal("broken template rendered")
	}
	if src.Err() != nil {
		t.Errorf("Err() = %v after a template mistake, want nil", src.Err())
	}
}
