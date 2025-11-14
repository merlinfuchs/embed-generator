package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.ScheduledMessageStore = (*Client)(nil)

func (c *Client) GetDueScheduledMessages(ctx context.Context, now time.Time) ([]model.ScheduledMessage, error) {
	rows, err := c.Q.GetDueScheduledMessages(ctx, pgtype.Timestamp{Time: now, Valid: true})
	if err != nil {
		return nil, err
	}
	return rowsToScheduledMessages(rows), nil
}

func (c *Client) GetScheduledMessages(ctx context.Context, guildID common.ID) ([]model.ScheduledMessage, error) {
	rows, err := c.Q.GetScheduledMessages(ctx, guildID.String())
	if err != nil {
		return nil, err
	}
	return rowsToScheduledMessages(rows), nil
}

func (c *Client) GetScheduledMessage(ctx context.Context, guildID common.ID, id string) (*model.ScheduledMessage, error) {
	row, err := c.Q.GetScheduledMessage(ctx, pgmodel.GetScheduledMessageParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToScheduledMessage(row), nil
}

func (c *Client) DeleteScheduledMessage(ctx context.Context, guildID common.ID, id string) error {
	err := c.Q.DeleteScheduledMessage(ctx, pgmodel.DeleteScheduledMessageParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	return err
}

func (c *Client) CreateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error {
	_, err := c.Q.InsertScheduledMessage(ctx, pgmodel.InsertScheduledMessageParams{
		ID:             msg.ID,
		CreatorID:      msg.CreatorID.String(),
		GuildID:        msg.GuildID.String(),
		ChannelID:      msg.ChannelID.String(),
		MessageID:      pgtype.Text{String: msg.MessageID.ID.String(), Valid: msg.MessageID.Valid},
		ThreadName:     pgtype.Text{String: msg.ThreadName.String, Valid: msg.ThreadName.Valid},
		SavedMessageID: msg.SavedMessageID,
		Name:           msg.Name,
		Description:    pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
		CronExpression: pgtype.Text{String: msg.CronExpression.String, Valid: msg.CronExpression.Valid},
		CronTimezone:   pgtype.Text{String: msg.CronTimezone.String, Valid: msg.CronTimezone.Valid},
		StartAt:        pgtype.Timestamp{Time: msg.StartAt, Valid: true},
		EndAt:          pgtype.Timestamp{Time: msg.EndAt.Time, Valid: msg.EndAt.Valid},
		NextAt:         pgtype.Timestamp{Time: msg.NextAt, Valid: true},
		OnlyOnce:       msg.OnlyOnce,
		Enabled:        msg.Enabled,
		CreatedAt:      pgtype.Timestamp{Time: msg.CreatedAt, Valid: true},
		UpdatedAt:      pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
	})
	return err
}

func (c *Client) UpdateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error {
	_, err := c.Q.UpdateScheduledMessage(ctx, pgmodel.UpdateScheduledMessageParams{
		ID:             msg.ID,
		GuildID:        msg.GuildID.String(),
		ChannelID:      msg.ChannelID.String(),
		MessageID:      pgtype.Text{String: msg.MessageID.ID.String(), Valid: msg.MessageID.Valid},
		ThreadName:     pgtype.Text{String: msg.ThreadName.String, Valid: msg.ThreadName.Valid},
		SavedMessageID: msg.SavedMessageID,
		Name:           msg.Name,
		Description:    pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
		CronExpression: pgtype.Text{String: msg.CronExpression.String, Valid: msg.CronExpression.Valid},
		NextAt:         pgtype.Timestamp{Time: msg.NextAt, Valid: true},
		StartAt:        pgtype.Timestamp{Time: msg.StartAt, Valid: true},
		EndAt:          pgtype.Timestamp{Time: msg.EndAt.Time, Valid: msg.EndAt.Valid},
		OnlyOnce:       msg.OnlyOnce,
		Enabled:        msg.Enabled,
		UpdatedAt:      pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
		CronTimezone:   pgtype.Text{String: msg.CronTimezone.String, Valid: msg.CronTimezone.Valid},
	})
	return err
}

func (c *Client) UpdateScheduledMessageNextAt(ctx context.Context, guildID common.ID, id string, nextAt time.Time, updatedAt time.Time) error {
	_, err := c.Q.UpdateScheduledMessageNextAt(ctx, pgmodel.UpdateScheduledMessageNextAtParams{
		ID:        id,
		GuildID:   guildID.String(),
		NextAt:    pgtype.Timestamp{Time: nextAt, Valid: true},
		UpdatedAt: pgtype.Timestamp{Time: updatedAt, Valid: true},
	})
	return err
}

func (c *Client) UpdateScheduledMessageEnabled(ctx context.Context, guildID common.ID, id string, enabled bool, updatedAt time.Time) error {
	_, err := c.Q.UpdateScheduledMessageEnabled(ctx, pgmodel.UpdateScheduledMessageEnabledParams{
		ID:        id,
		GuildID:   guildID.String(),
		Enabled:   enabled,
		UpdatedAt: pgtype.Timestamp{Time: updatedAt, Valid: true},
	})
	return err
}

func rowsToScheduledMessages(rows []pgmodel.ScheduledMessage) []model.ScheduledMessage {
	messages := make([]model.ScheduledMessage, len(rows))
	for i, row := range rows {
		messages[i] = *rowToScheduledMessage(row)
	}
	return messages
}

func rowToScheduledMessage(row pgmodel.ScheduledMessage) *model.ScheduledMessage {
	var messageID common.NullID
	if row.MessageID.Valid {
		messageID = common.NullID{
			Valid: true,
			ID:    common.DefinitelyID(row.MessageID.String),
		}
	}

	return &model.ScheduledMessage{
		ID:             row.ID,
		CreatorID:      common.DefinitelyID(row.CreatorID),
		GuildID:        common.DefinitelyID(row.GuildID),
		ChannelID:      common.DefinitelyID(row.ChannelID),
		MessageID:      messageID,
		SavedMessageID: row.SavedMessageID,
		Name:           row.Name,
		Description:    null.NewString(row.Description.String, row.Description.Valid),
		CronExpression: null.NewString(row.CronExpression.String, row.CronExpression.Valid),
		OnlyOnce:       row.OnlyOnce,
		StartAt:        row.StartAt.Time,
		EndAt:          null.NewTime(row.EndAt.Time, row.EndAt.Valid),
		NextAt:         row.NextAt.Time,
		Enabled:        row.Enabled,
		CreatedAt:      row.CreatedAt.Time,
		UpdatedAt:      row.UpdatedAt.Time,
		CronTimezone:   null.NewString(row.CronTimezone.String, row.CronTimezone.Valid),
		ThreadName:     null.NewString(row.ThreadName.String, row.ThreadName.Valid),
	}
}
