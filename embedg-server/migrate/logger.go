package migrate

import (
	"github.com/rs/zerolog"
)

type migrationZeroLogger struct {
	zerologger zerolog.Logger
	verbose    bool
}

// Printf is like fmt.Printf
func (ml migrationZeroLogger) Printf(format string, v ...interface{}) {
	ml.zerologger.Info().Msgf(format, v...)
}

// Printf is like fmt.Printf
func (ml migrationZeroLogger) Verbose() bool {
	return ml.verbose
}
