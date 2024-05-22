package model

import (
	"time"

	"gopkg.in/guregu/null.v4"
)

type KVEntry struct {
	Key       string
	GuildID   string
	Value     string
	ExpiresAt null.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type KVEntryIncreaseParams struct {
	Key       string
	GuildID   string
	Delta     int
	ExpiresAt null.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}
