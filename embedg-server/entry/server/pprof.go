package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"runtime"
	"time"

	// Registers the pprof handlers on http.DefaultServeMux.
	_ "net/http/pprof"
)

const pprofShutdownTimeout = 5 * time.Second

// servePprof exposes net/http/pprof on its own listener, separate from the API so a stalled API
// can still be profiled. Bind it to localhost, the dumps contain tokens and message content.
//
// Block and mutex sampling is off by default in Go and the profiles read as empty without it,
// which is exactly the data needed to tell a lock convoy from slow work, so it is enabled here.
func servePprof(ctx context.Context, addr string) {
	runtime.SetBlockProfileRate(10_000)  // sample a blocking event roughly every 10µs blocked
	runtime.SetMutexProfileFraction(100) // sample 1 in 100 contention events

	server := &http.Server{
		Addr:    addr,
		Handler: http.DefaultServeMux,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), pprofShutdownTimeout)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			slog.Error("Failed to shut down pprof server", slog.Any("error", err))
		}
	}()

	slog.Info("Starting pprof server", slog.String("addr", addr))

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("pprof server failed", slog.Any("error", err))
	}
}
