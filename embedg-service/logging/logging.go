package logging

import (
	"io"
	"os"

	"log/slog"

	"endobit.io/clog"
	"github.com/cyrusaf/ctxlog"
	"gopkg.in/natefinch/lumberjack.v2"
)

type LoggerConfig struct {
	Filename   string
	MaxSize    int
	MaxAge     int
	MaxBackups int
	Debug      bool
}

func getLogWriter(cfg LoggerConfig) io.Writer {
	logWriters := make([]io.Writer, 0)
	logWriters = append(logWriters, os.Stdout)

	if cfg.Filename != "" {
		lj := lumberjack.Logger{
			Filename:   cfg.Filename,
			MaxSize:    cfg.MaxSize,
			MaxAge:     cfg.MaxAge,
			MaxBackups: cfg.MaxBackups,
		}
		logWriters = append(logWriters, &lj)
	}
	writer := io.MultiWriter(logWriters...)
	return writer
}

func SetupLogger(cfg LoggerConfig) *slog.Logger {
	writer := getLogWriter(cfg)

	level := slog.LevelInfo
	if cfg.Debug {
		level = slog.LevelDebug
	}

	handler := ctxlog.NewHandler(clog.HandlerOptions{
		Level: level,
	}.NewHandler(writer))

	logger := slog.New(handler)
	hostname, err := os.Hostname()
	if err != nil {
		logger.With("error", err).Error("failed to get hostname")
		hostname = ""
	}
	logger = logger.With(slog.String("host", hostname))

	slog.SetDefault(logger)
	return logger
}
