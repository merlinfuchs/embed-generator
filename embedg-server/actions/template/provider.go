package template

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
)

const MaxKVValueLength = 16 * 1024
const MaxKVKeyLength = 256

type ContextProvider interface {
	ProvideFuncs(funcs map[string]interface{})
	ProvideData(data map[string]interface{})
}

type InteractionProvider struct {
	state       *discordgo.State
	interaction *discordgo.Interaction
}

func NewInteractionProvider(state *discordgo.State, interaction *discordgo.Interaction) *InteractionProvider {
	return &InteractionProvider{
		state:       state,
		interaction: interaction,
	}
}

func (p *InteractionProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *InteractionProvider) ProvideData(data map[string]interface{}) {
	data["Interaction"] = NewInteractionData(p.state, p.interaction)

	guildData := NewGuildData(p.state, p.interaction.GuildID, nil)
	data["Guild"] = guildData
	data["Server"] = guildData

	data["Channel"] = NewChannelData(p.state, p.interaction.ChannelID, nil)
}

type GuildProvider struct {
	state   *discordgo.State
	guildID string
	guild   *discordgo.Guild
}

func NewGuildProvider(state *discordgo.State, guildID string, guild *discordgo.Guild) *GuildProvider {
	return &GuildProvider{
		state:   state,
		guildID: guildID,
		guild:   guild,
	}
}

func (p *GuildProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *GuildProvider) ProvideData(data map[string]interface{}) {
	guildData := NewGuildData(p.state, p.guildID, p.guild)
	data["Guild"] = guildData
	data["Server"] = guildData
}

type ChannelProvider struct {
	state     *discordgo.State
	channelID string
	channel   *discordgo.Channel
}

func NewChannelProvider(state *discordgo.State, channelID string, channel *discordgo.Channel) *ChannelProvider {
	return &ChannelProvider{
		state:     state,
		channelID: channelID,
		channel:   channel,
	}
}

func (p *ChannelProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *ChannelProvider) ProvideData(data map[string]interface{}) {
	data["Channel"] = NewChannelData(p.state, p.channelID, p.channel)
}

type KVProvider struct {
	guildID      string
	pg           *postgres.PostgresStore
	maxGuildKeys int
}

func NewKVProvider(guildID string, pg *postgres.PostgresStore, maxGuildKeys int) *KVProvider {
	return &KVProvider{
		guildID:      guildID,
		pg:           pg,
		maxGuildKeys: maxGuildKeys,
	}
}

func (p *KVProvider) ProvideFuncs(funcs map[string]interface{}) {
	funcs["kvSet"] = p.setKey
	funcs["kvGet"] = p.getKey
	funcs["kvIncrease"] = p.increaseKey
	funcs["kvDelete"] = p.deleteKey
	funcs["kvSearch"] = p.searchKeys
}

func (p *KVProvider) ProvideData(data map[string]interface{}) {}

func (kv *KVProvider) getKey(key string) (string, error) {
	val, err := kv.pg.Q.GetKVKey(context.TODO(), postgres.GetKVKeyParams{
		GuildID: kv.guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return val.Value, nil
}

func (kv *KVProvider) setKey(key string, value string) error {
	if len(key) > MaxKVKeyLength {
		return fmt.Errorf("key exceeds maximum length of %d", MaxKVKeyLength)
	}
	if len(value) > MaxKVValueLength {
		return fmt.Errorf("value exceeds maximum length of %d", MaxKVValueLength)
	}

	if err := kv.checkKeyCountLimit(); err != nil {
		return err
	}

	err := kv.pg.Q.SetKVKey(context.TODO(), postgres.SetKVKeyParams{
		GuildID:   kv.guildID,
		Key:       key,
		Value:     value,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		return err
	}
	return nil
}

func (kv *KVProvider) increaseKey(key string, delta int) (string, error) {
	if len(key) > MaxKVKeyLength {
		return "", fmt.Errorf("key exceeds maximum length of %d", MaxKVKeyLength)
	}

	if err := kv.checkKeyCountLimit(); err != nil {
		return "", err
	}

	val, err := kv.pg.Q.IncreaseKVKey(context.TODO(), postgres.IncreaseKVKeyParams{
		GuildID:   kv.guildID,
		Key:       key,
		Value:     fmt.Sprintf("%d", delta),
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return val.Value, nil
}

func (kv *KVProvider) deleteKey(key string) (string, error) {
	val, err := kv.pg.Q.DeleteKVKey(context.TODO(), postgres.DeleteKVKeyParams{
		GuildID: kv.guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return val.Value, nil
}

func (kv *KVProvider) searchKeys(pattern string) (map[string]string, error) {
	keys, err := kv.pg.Q.SearchKVKeys(context.TODO(), postgres.SearchKVKeysParams{
		GuildID: kv.guildID,
		Key:     pattern,
	})
	if err != nil {
		return nil, err
	}

	result := make(map[string]string, len(keys))
	for _, key := range keys {
		result[key.Key] = key.Value
	}

	return result, nil
}

func (kv *KVProvider) checkKeyCountLimit() error {
	keyCount, err := kv.pg.Q.CountKVKeys(context.TODO(), kv.guildID)
	if err != nil {
		return fmt.Errorf("failed to count KV keys: %w", err)
	}

	if int(keyCount) >= kv.maxGuildKeys {
		return fmt.Errorf("maximum number of keys reached: %d", kv.maxGuildKeys)
	}

	return nil
}
