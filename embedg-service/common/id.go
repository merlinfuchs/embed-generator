package common

import (
	"encoding/json"
	"time"

	"github.com/disgoorg/snowflake/v2"
)

type ID = snowflake.ID

type NullID struct {
	Valid bool
	ID    ID
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

func UniqueID() snowflake.ID {
	return snowflake.New(time.Now().UTC())
}

func ParseID(id string) (ID, error) {
	return snowflake.Parse(id)
}

func DefinitelyID(id string) ID {
	res, _ := snowflake.Parse(id)
	return res
}
