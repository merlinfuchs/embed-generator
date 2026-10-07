package logging

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
)

// Discord's and Fluxer's HTTP clients put the request URL into network errors, and a webhook URL
// carries its token, which is all anyone needs to post to the channel. Interaction tokens use the
// same path.
var webhookToken = regexp.MustCompile(`(/webhooks/[^/\s"'?&]+/)[^/\s"'?&]+`)

func redact(s string) string {
	return webhookToken.ReplaceAllString(s, "${1}[redacted]")
}

// redactHandler masks webhook tokens in the message and attributes before they are written.
type redactHandler struct {
	slog.Handler
}

func (h redactHandler) Handle(ctx context.Context, r slog.Record) error {
	out := slog.NewRecord(r.Time, r.Level, redact(r.Message), r.PC)
	r.Attrs(func(a slog.Attr) bool {
		out.AddAttrs(redactAttr(a))
		return true
	})
	return h.Handler.Handle(ctx, out)
}

func (h redactHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	out := make([]slog.Attr, len(attrs))
	for i, a := range attrs {
		out[i] = redactAttr(a)
	}
	return redactHandler{h.Handler.WithAttrs(out)}
}

func (h redactHandler) WithGroup(name string) slog.Handler {
	return redactHandler{h.Handler.WithGroup(name)}
}

func redactAttr(a slog.Attr) slog.Attr {
	v := a.Value.Resolve()
	switch v.Kind() {
	case slog.KindString:
		return slog.String(a.Key, redact(v.String()))
	case slog.KindGroup:
		group := v.Group()
		out := make([]slog.Attr, len(group))
		for i, g := range group {
			out[i] = redactAttr(g)
		}
		return slog.Attr{Key: a.Key, Value: slog.GroupValue(out...)}
	case slog.KindAny:
		if err, ok := v.Any().(error); ok {
			// fmt recovers a panicking Error(), which disgo's rest.Error has done before.
			return slog.String(a.Key, redact(fmt.Sprint(err)))
		}
	}
	return a
}
