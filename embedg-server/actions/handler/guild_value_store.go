package handler

import (
	"context"
	"database/sql"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
)

type GuildValueStore struct {
	guildID string
	pg      *postgres.PostgresStore
}

func NewGuildValueStore(guildID string, pg *postgres.PostgresStore) *GuildValueStore {
	return &GuildValueStore{
		guildID: guildID,
		pg:      pg,
	}
}

func (s *GuildValueStore) Get(key string) ([]byte, error) {
	res, err := s.pg.Q.GetGuildValue(context.Background(), postgres.GetGuildValueParams{
		GuildID: s.guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res.Value, nil
}

func (s *GuildValueStore) Set(key string, value []byte) error {
	_, err := s.pg.Q.SetGuildValue(context.Background(), postgres.SetGuildValueParams{
		GuildID: s.guildID,
		Key:     key,
		Value:   value,
	})
	return err
}

func (s *GuildValueStore) Delete(key string) ([]byte, error) {
	res, err := s.pg.Q.DeleteGuildValue(context.Background(), postgres.DeleteGuildValueParams{
		GuildID: s.guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res.Value, nil
}

func (s *GuildValueStore) List() (map[string][]byte, error) {
	rows, err := s.pg.Q.GetGuildValues(context.Background(), s.guildID)
	if err != nil {
		return nil, err
	}

	res := map[string][]byte{}
	for _, row := range rows {
		res[row.Key] = row.Value
	}

	return res, nil
}
