// Package forward sends the answers of submitted forms to URLs that the forms' actions name, so
// they can be used in other tools.
package forward

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

const (
	// MaxPerMinute is how many submissions a server can send to URLs a minute, counted across all
	// instances.
	MaxPerMinute = 60

	userAgent = "EmbedGenerator-Forms (https://message.style)"
)

// Submission is the JSON body that's sent for a submitted form.
type Submission struct {
	Type        string            `json:"type"`
	Form        SubmissionForm    `json:"form"`
	GuildID     string            `json:"guild_id"`
	ChannelID   string            `json:"channel_id,omitempty"`
	User        SubmissionUser    `json:"user"`
	Fields      []SubmissionField `json:"fields"`
	SubmittedAt time.Time         `json:"submitted_at"`
}

type SubmissionForm struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SubmissionUser struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	GlobalName string `json:"global_name,omitempty"`
}

type SubmissionField struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Type  string `json:"type"`
	// Value is what {{.Form.key}} has in the form's actions.
	Value string `json:"value"`
	// IDs is what {{.FormIDs.key}} has, as a list. It's empty for text fields.
	IDs []string `json:"ids"`
}

// Forwarder sends submissions in the background and records on the form why one couldn't be sent.
type Forwarder struct {
	client      *http.Client
	formStore   store.FormStore
	now         func() time.Time
	validateURL func(string) error
	retryDelay  time.Duration
}

// New makes a Forwarder that sends through the egress proxy at proxyURL, or directly when it's
// empty.
func New(formStore store.FormStore, proxyURL string) (*Forwarder, error) {
	var proxy *url.URL
	if proxyURL != "" {
		var err error
		if proxy, err = url.Parse(proxyURL); err != nil {
			return nil, fmt.Errorf("invalid forms proxy URL: %w", err)
		}
	}

	return &Forwarder{
		client:      newClient(isPublicAddr, proxy),
		formStore:   formStore,
		now:         time.Now,
		validateURL: ValidateURL,
		retryDelay:  2 * time.Second,
	}, nil
}

// NewSigningSecret makes the secret that a form's submissions are signed with.
func NewSigningSecret() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Sign is the signature of a body sent at timestamp: the hex HMAC-SHA256 of the timestamp, a dot
// and the body.
func Sign(secret string, timestamp string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

// Forward sends sub to url without waiting for it.
func (f *Forwarder) Forward(form *model.Form, url string, sub Submission) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
		defer cancel()

		message := ""
		if err := f.forward(ctx, form, url, sub); err != nil {
			message = err.Error()
		} else if form.ForwardError == "" {
			return
		}

		if err := f.formStore.SetFormForwardError(ctx, form.GuildID, form.ID, message, f.now().UTC()); err != nil {
			slog.Error("Failed to record form forward error", slog.String("form_id", form.ID), slog.Any("error", err))
		}
	}()
}

// forward returns the error to show on the form when sub couldn't be sent.
func (f *Forwarder) forward(ctx context.Context, form *model.Form, url string, sub Submission) error {
	if err := f.validateURL(url); err != nil {
		return cantSendErr(err)
	}
	if form.SigningSecret == "" {
		return errors.New("The form has no signing secret yet. Save it again.")
	}

	now := f.now().UTC()
	count, err := f.formStore.IncrementFormForwardCount(ctx, form.GuildID, now.Truncate(time.Minute))
	if err != nil {
		slog.Error("Failed to count form forward", slog.String("form_id", form.ID), slog.Any("error", err))
		return errors.New("Something went wrong on our side.")
	}
	if count > MaxPerMinute {
		return fmt.Errorf("More than %d forms were submitted on this server in a minute. The ones over that weren't sent.", MaxPerMinute)
	}

	body, err := json.Marshal(sub)
	if err != nil {
		return fmt.Errorf("Failed to encode the answers: %w", err)
	}

	retry, err := f.send(ctx, form.SigningSecret, url, body)
	if retry {
		select {
		case <-ctx.Done():
		case <-time.After(f.retryDelay):
			_, err = f.send(ctx, form.SigningSecret, url, body)
		}
	}
	return err
}

// send makes one request, and returns whether it's worth trying again when it fails.
func (f *Forwarder) send(ctx context.Context, secret string, url string, body []byte) (retry bool, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return false, errors.New("The URL isn't valid.")
	}

	timestamp := strconv.FormatInt(f.now().Unix(), 10)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("X-Signature-Timestamp", timestamp)
	req.Header.Set("X-Signature-256", "sha256="+Sign(secret, timestamp, body))

	resp, err := f.client.Do(req)
	if err != nil {
		if errors.Is(err, errPrivateAddress) || strings.Contains(err.Error(), proxyDenied) {
			return false, cantSendErr(errPrivateAddress)
		}
		return true, errors.New("The URL couldn't be reached.")
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 64<<10))

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return false, nil
	}
	retry = resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500
	return retry, fmt.Errorf("The URL answered with status %d.", resp.StatusCode)
}

func cantSendErr(err error) error {
	return fmt.Errorf("Answers can't be sent to this URL: %w.", err)
}
