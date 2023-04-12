package embedgapp

import "embed"

//go:embed dist/*
var DistFS embed.FS
