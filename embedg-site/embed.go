//go:build embedsite
// +build embedsite

package embedgsite

import "embed"

//go:embed dist/*
var DistFS embed.FS
