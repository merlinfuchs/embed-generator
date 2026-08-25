package database

import (
	"fmt"
	"log/slog"
)

type migrationSlogLogger struct {
	logger  *slog.Logger
	verbose bool
}

// Printf is like fmt.Printf
func (ml migrationSlogLogger) Printf(format string, v ...interface{}) {
	ml.logger.Info(fmt.Sprintf(format, v...))
}

// Verbose returns whether verbose logging is enabled
func (ml migrationSlogLogger) Verbose() bool {
	return ml.verbose
}
