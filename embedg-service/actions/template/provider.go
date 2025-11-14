package template

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

const MaxKVValueLength = 16 * 1024
const MaxKVKeyLength = 256

type ContextProvider interface {
	ProvideFuncs(funcs map[string]interface{})
	ProvideData(data map[string]interface{})
}

type InteractionProvider struct {
	caches      cache.Caches
	interaction discord.Interaction
}

func NewInteractionProvider(caches cache.Caches, interaction discord.Interaction) *InteractionProvider {
	return &InteractionProvider{
		caches:      caches,
		interaction: interaction,
	}
}

func (p *InteractionProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *InteractionProvider) ProvideData(data map[string]interface{}) {
	data["Interaction"] = NewInteractionData(p.caches, p.interaction)

	guildID := p.interaction.GuildID()
	if guildID == nil {
		return
	}

	guildData := NewGuildData(p.caches, *guildID, nil)
	data["Guild"] = guildData
	data["Server"] = guildData

	data["Channel"] = NewChannelData(p.caches, p.interaction.Channel().ID(), nil)
}

type GuildProvider struct {
	caches  cache.Caches
	guildID common.ID
	guild   *discord.Guild
}

func NewGuildProvider(caches cache.Caches, guildID common.ID, guild *discord.Guild) *GuildProvider {
	return &GuildProvider{
		caches:  caches,
		guildID: guildID,
		guild:   guild,
	}
}

func (p *GuildProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *GuildProvider) ProvideData(data map[string]interface{}) {
	guildData := NewGuildData(p.caches, p.guildID, p.guild)
	data["Guild"] = guildData
	data["Server"] = guildData
}

type ChannelProvider struct {
	caches    cache.Caches
	channelID common.ID
	channel   discord.GuildChannel
}

func NewChannelProvider(caches cache.Caches, channelID common.ID, channel discord.GuildChannel) *ChannelProvider {
	return &ChannelProvider{
		caches:    caches,
		channelID: channelID,
		channel:   channel,
	}
}

func (p *ChannelProvider) ProvideFuncs(funcs map[string]interface{}) {}

func (p *ChannelProvider) ProvideData(data map[string]interface{}) {
	data["Channel"] = NewChannelData(p.caches, p.channelID, p.channel)
}

type KVProvider struct {
	guildID      common.ID
	kvStore      store.KVEntryStore
	maxGuildKeys int
}

func NewKVProvider(guildID common.ID, kvStore store.KVEntryStore, maxGuildKeys int) *KVProvider {
	return &KVProvider{
		guildID:      guildID,
		kvStore:      kvStore,
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
	entry, err := kv.kvStore.GetKVEntry(context.TODO(), kv.guildID, key)
	if err != nil {
		if err == store.ErrNotFound {
			return "", nil
		}
		return "", err
	}
	return entry.Value, nil
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

	err := kv.kvStore.SetKVEntry(context.TODO(), model.KVEntry{
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

	entry, err := kv.kvStore.IncreaseKVEntry(context.TODO(), store.KVEntryIncreaseParams{
		GuildID:   kv.guildID,
		Key:       key,
		Delta:     delta,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return entry.Value, nil
}

func (kv *KVProvider) deleteKey(key string) (string, error) {
	entry, err := kv.kvStore.DeleteKVEntry(context.TODO(), kv.guildID, key)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return entry.Value, nil
}

func (kv *KVProvider) searchKeys(pattern string) (map[string]string, error) {
	entries, err := kv.kvStore.SearchKVEntries(context.TODO(), kv.guildID, pattern)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string, len(entries))
	for _, entry := range entries {
		result[entry.Key] = entry.Value
	}

	return result, nil
}

func (kv *KVProvider) checkKeyCountLimit() error {
	entryCount, err := kv.kvStore.CountKVEntries(context.TODO(), kv.guildID)
	if err != nil {
		return fmt.Errorf("failed to count KV keys: %w", err)
	}

	if int(entryCount) >= kv.maxGuildKeys {
		return fmt.Errorf("maximum number of keys reached: %d", kv.maxGuildKeys)
	}

	return nil
}
