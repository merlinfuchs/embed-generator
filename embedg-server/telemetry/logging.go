package telemetry

import (
	"fmt"
	"io"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/diode"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"
	"gopkg.in/natefinch/lumberjack.v2"
)

func SetupLogger() {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs

	hostname, err := os.Hostname()
	if err != nil {
		log.Error().Err(err).Msg("Failed to get hostname")
		hostname = ""
	}

	logContext := log.With().
		Str("host", hostname)

	if viper.GetBool("debug") {
		logContext = logContext.Caller()
	}

	logWriters := make([]io.Writer, 0)
	if viper.GetBool("development") {
		logWriters = append(logWriters, zerolog.ConsoleWriter{Out: os.Stdout})
	} else {
		logWriters = append(logWriters, syncWriter())
	}

	if viper.GetString("logging.filename") != "" {
		lj := lumberjack.Logger{
			Filename:   viper.GetString("logging.filename"),
			MaxSize:    viper.GetInt("logging.max_size"),
			MaxAge:     viper.GetInt("logging.max_age"),
			MaxBackups: viper.GetInt("logging.max_backups"),
		}
		logWriters = append(logWriters, &lj)
	}
	writer := io.MultiWriter(logWriters...)
	log.Logger = logContext.Logger().Output(writer)

	if viper.GetBool("debug") {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
}

// syncWriter is concurrent safe writer.
func syncWriter() io.Writer {
	return diode.NewWriter(os.Stderr, 1000, 0, func(missed int) {
		fmt.Printf("Logger Dropped %d messages", missed)
	})
}

// Returns the logger for the given fiber user context
func L(c *fiber.Ctx) *zerolog.Logger {
	return zerolog.Ctx(c.UserContext())
}
