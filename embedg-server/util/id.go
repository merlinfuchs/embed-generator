package util

import (
	"encoding/json"

	"github.com/disgoorg/snowflake/v2"
	gonanoid "github.com/matoous/go-nanoid"
)

func UniqueID() string {
	id, _ := gonanoid.Generate("abcdefghijklmnopqrstuvwxyzAPCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 8)
	return id
}

type ID = snowflake.ID

type NullID struct {
	Valid bool
	ID    ID
}

func (n NullID) String() string {
	if !n.Valid {
		return "null"
	}
	return n.ID.String()
}

func (n NullID) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.ID)
}

func (n *NullID) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		n.Valid = false
		return nil
	}
	return json.Unmarshal(data, &n.ID)
}

func ToID(val string) snowflake.ID {
	id, _ := snowflake.Parse(val)
	return id
}

func ParseID(val string) (snowflake.ID, error) {
	return snowflake.Parse(val)
}

func NullIDFromPtr(ptr *snowflake.ID) NullID {
	if ptr == nil {
		return NullID{Valid: false}
	}
	return NullID{ID: *ptr, Valid: true}
}
