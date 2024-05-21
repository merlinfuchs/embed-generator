package store

import "context"

type EntitlementStore interface {
	GetEntitledUserIDs(ctx context.Context) ([]string, error)
}
