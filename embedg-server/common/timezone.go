package common

import (
	"fmt"
	"time"

	_ "time/tzdata"
)

// LoadTimezone loads an IANA timezone, where empty means UTC.
func LoadTimezone(name string) (*time.Location, error) {
	if name == "" {
		return time.UTC, nil
	}
	// "Local" would be the server's own timezone.
	if name == "Local" {
		return nil, fmt.Errorf("unknown timezone %q", name)
	}

	loc, err := time.LoadLocation(name)
	if err != nil {
		return nil, fmt.Errorf("failed to load timezone %q: %w", name, err)
	}
	return loc, nil
}
