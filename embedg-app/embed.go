//go:build embedapp
// +build embedapp

package embedgapp

import "embed"

//go:embed dist/*
var DistFS embed.FS
