package model

import "time"

type SharedMessage struct {
	ID        string
	CreatedAt time.Time
	ExpiresAt time.Time
	Data      []byte
}
