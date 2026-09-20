package common

import (
	"github.com/jellydator/ttlcache/v3"
	"golang.org/x/sync/singleflight"
)

// GetOrSet returns the cached value for cacheKey, otherwise runs fetchFunc and caches the result.
// Concurrent calls for the same key wait for the first one instead of fetching again.
func GetOrSet[T any](group *singleflight.Group, cacheKey string, cache *ttlcache.Cache[string, T], fetchFunc func() (T, error)) (T, error) {
	var zero T

	if item := cache.Get(cacheKey); item != nil {
		return item.Value(), nil
	}

	result, err, _ := group.Do(cacheKey, func() (any, error) {
		value, err := fetchFunc()
		if err != nil {
			return nil, err
		}

		cache.Set(cacheKey, value, 0)
		return value, nil
	})
	if err != nil {
		return zero, err
	}

	return result.(T), nil
}
