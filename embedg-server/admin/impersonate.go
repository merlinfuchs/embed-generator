package admin

import (
	"context"
	"fmt"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func impersonateCMD() *cobra.Command {
	impersonateCMD := &cobra.Command{
		Use:   "impersonate",
		Short: "Impersonate a user by creating a session token that can be injected into the session cookie",
		Run: func(cmd *cobra.Command, args []string) {
			sessionToken, err := CreateSessionForUser(cmd.Flag("user_id").Value.String())
			if err != nil {
				log.Error().Err(err).Msg("Failed to create session token")
				return
			}

			fmt.Println("Session token:", sessionToken)
		},
	}
	impersonateCMD.Flags().String("user_id", "", "User ID to impersonate")

	return impersonateCMD
}

func CreateSessionForUser(userID string) (string, error) {
	pg := postgres.NewPostgresStore()
	sessionManager := session.New(pg)

	sessions, err := pg.Q.GetSessionsForUser(context.Background(), userID)
	if err != nil {
		return "", err
	}

	if len(sessions) == 0 {
		return "", fmt.Errorf("User has no sessions that we can derive a new session from")
	}

	session := sessions[0]
	for _, s := range sessions {
		if s.CreatedAt.After(session.CreatedAt) {
			session = s
		}
	}

	if session.ExpiresAt.Before(time.Now().UTC()) {
		return "", fmt.Errorf("Latest session has already expired")
	}

	sessionToken, err := sessionManager.CreateSession(
		context.Background(),
		userID,
		session.GuildIds,
		session.AccessToken,
		session.RefreshToken.String,
		session.ExpiresAt,
	)
	if err != nil {
		return "", err
	}

	return sessionToken, nil
}
