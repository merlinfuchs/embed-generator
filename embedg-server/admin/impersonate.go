package admin

import (
	"context"
	"encoding/json"
	"fmt"

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
		return "", fmt.Errorf("user has no sessions that we can derive a new session from")
	}

	s := sessions[0]
	for _, s := range sessions {
		if s.CreatedAt.After(s.CreatedAt) {
			s = s
		}
	}

	var guilds []session.SessionGuild
	err = json.Unmarshal(s.Guilds, &guilds)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal guilds: %w", err)
	}

	sessionToken, err := sessionManager.CreateSession(context.Background(), &session.Session{
		UserID:      userID,
		Guilds:      guilds,
		AccessToken: s.AccessToken,
	})
	if err != nil {
		return "", err
	}

	return sessionToken, nil
}
