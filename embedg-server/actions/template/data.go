package template

import (
	"fmt"
	"time"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

var standardDataMap = map[string]interface{}{}

type InteractionData struct {
	caches cache.Caches
	i      discord.Interaction
}

func NewInteractionData(caches cache.Caches, i discord.Interaction) *InteractionData {
	return &InteractionData{
		caches: caches,
		i:      i,
	}
}

func (d *InteractionData) User() interface{} {
	if d.i.Member() != nil {
		res := NewMemberData(d.caches, *d.i.GuildID(), d.i.Member().Member)
		return &res
	}

	return NewUserData(d.i.User())
}

func (d *InteractionData) Member() *MemberData {
	if d.i.Member() == nil {
		return nil
	}

	return NewMemberData(d.caches, *d.i.GuildID(), d.i.Member().Member)
}

func (d *InteractionData) Command() *CommandData {
	if d.i.Type() != discord.InteractionTypeApplicationCommand {
		return nil
	}

	cmdInteraction, ok := d.i.(discord.ApplicationCommandInteraction)
	if !ok {
		return nil
	}

	return NewCommandData(d.caches, *d.i.GuildID(), cmdInteraction.Data)
}

type UserData struct {
	u discord.User
}

func NewUserData(u discord.User) *UserData {
	return &UserData{u: u}
}

func (d *UserData) String() string {
	return d.Mention()
}

func (d *UserData) ID() string {
	return d.u.ID.String()
}

func (d *UserData) Name() string {
	if d.u.GlobalName != nil {
		return *d.u.GlobalName
	}

	return d.u.Username
}

func (d *UserData) Username() string {
	return d.u.Username
}

func (d *UserData) GlobalName() string {
	if d.u.GlobalName != nil {
		return *d.u.GlobalName
	}

	return ""
}

func (d *UserData) Discriminator() string {
	return d.u.Discriminator
}

func (d *UserData) Avatar() string {
	if d.u.Avatar != nil {
		return *d.u.Avatar
	}

	return ""
}

func (d *UserData) Banner() string {
	if d.u.Banner != nil {
		return *d.u.Banner
	}

	return ""
}

func (d *UserData) Mention() string {
	return d.u.Mention()
}

func (d *UserData) AvatarURL() string {
	avatarURL := d.u.AvatarURL(discord.WithSize(512))
	if avatarURL == nil {
		return ""
	}

	return *avatarURL
}

func (d *UserData) BannerURL() string {
	bannerURL := d.u.BannerURL(discord.WithSize(1024))
	if bannerURL == nil {
		return ""
	}

	return *bannerURL
}

type MemberData struct {
	UserData
	caches  cache.Caches
	guildID util.ID
	m       discord.Member
}

func NewMemberData(caches cache.Caches, guildID util.ID, m discord.Member) *MemberData {
	return &MemberData{
		UserData: UserData{m.User},
		caches:   caches,
		guildID:  guildID,
		m:        m,
	}
}

func (d *MemberData) Nick() string {
	if d.m.Nick != nil {
		return *d.m.Nick
	}

	return ""
}

func (d *MemberData) Roles() []*RoleData {
	res := make([]*RoleData, len(d.m.RoleIDs))
	for i, roleID := range d.m.RoleIDs {
		res[i] = NewRoleData(d.caches, d.guildID, roleID, nil)
	}

	return res
}

func (d *MemberData) JoinedAt() time.Time {
	if d.m.JoinedAt != nil {
		return *d.m.JoinedAt
	}

	return time.Time{}
}

func (d *MemberData) Name() string {
	if d.m.Nick != nil {
		return *d.m.Nick
	}

	return d.UserData.Name()
}

func (d *MemberData) Avatar() string {
	if d.m.Avatar != nil {
		return *d.m.Avatar
	}

	return d.UserData.Avatar()
}

func (d *MemberData) AvatarURL() string {
	return d.m.EffectiveAvatarURL(discord.WithSize(512))
}

type CommandData struct {
	caches  cache.Caches
	guildID util.ID
	c       discord.ApplicationCommandInteractionData
}

func NewCommandData(caches cache.Caches, guildID util.ID, c discord.ApplicationCommandInteractionData) *CommandData {
	return &CommandData{
		caches:  caches,
		guildID: guildID,
		c:       c,
	}
}

func (d *CommandData) String() string {
	return d.Mention()
}

func (d *CommandData) ID() string {
	return d.c.CommandID().String()
}

func (d *CommandData) Name() string {
	return d.c.CommandName()
}

func (d *CommandData) Mention() string {
	return fmt.Sprintf("</%s:%s>", d.c.CommandName(), d.c.CommandID().String())
}

func (d *CommandData) Options() map[string]interface{} {
	res := make(map[string]interface{})

	if slashCMD, ok := d.c.(discord.SlashCommandInteractionData); ok {
		for _, opt := range slashCMD.Options {
			res[opt.Name] = NewCommandOptionData(d.caches, d.guildID, slashCMD, opt)
		}
	}

	return res
}

func (d *CommandData) Args() map[string]interface{} {
	return d.Options()
}

func NewCommandOptionData(caches cache.Caches, guildID util.ID, c discord.SlashCommandInteractionData, o discord.SlashCommandOption) interface{} {
	switch o.Type {
	case discord.ApplicationCommandOptionTypeString:
		return o.String()
	case discord.ApplicationCommandOptionTypeInt:
		return o.Int()
	case discord.ApplicationCommandOptionTypeBool:
		return o.Bool()
	case discord.ApplicationCommandOptionTypeUser:
		userID := o.Snowflake()
		resolved, ok := c.Resolved.Users[userID]
		if ok {
			return UserData{resolved}
		}
		return UserData{u: discord.User{ID: userID}}
	case discord.ApplicationCommandOptionTypeChannel:
		channelID := o.Snowflake()
		return NewChannelData(caches, channelID, nil)
	case discord.ApplicationCommandOptionTypeRole:
		roleID := o.Snowflake()
		resolved, ok := c.Resolved.Roles[roleID]
		if ok {
			return NewRoleData(caches, guildID, roleID, &resolved)
		}
		return NewRoleData(caches, guildID, roleID, nil)
	case discord.ApplicationCommandOptionTypeFloat:
		return o.Float()
	case discord.ApplicationCommandOptionTypeAttachment:
		attachmentID := o.Snowflake()
		resolved, ok := c.Resolved.Attachments[attachmentID]
		if ok {
			return NewAttachmentData(resolved)
		}
		return NewAttachmentData(discord.Attachment{ID: attachmentID})
	}

	return nil
}

type GuildData struct {
	caches  cache.Caches
	guildID util.ID
	guild   *discord.Guild
}

func NewGuildData(caches cache.Caches, guildID util.ID, g *discord.Guild) *GuildData {
	return &GuildData{
		caches:  caches,
		guildID: guildID,
		guild:   g,
	}
}

func (d *GuildData) ensureGuild() error {
	if d.guild != nil {
		return nil
	}

	guild, ok := d.caches.Guild(d.guildID)
	if !ok {
		return fmt.Errorf("guild not found in cache")
	}

	d.guild = &guild
	return nil
}

func (d *GuildData) String() string {
	if err := d.ensureGuild(); err != nil {
		return d.guildID.String()
	}
	return d.guild.Name
}

func (d *GuildData) ID() string {
	return d.guildID.String()
}

func (d *GuildData) Name() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.Name, nil
}

func (d *GuildData) Description() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	if d.guild.Description != nil {
		return *d.guild.Description, nil
	}

	return "", nil
}

func (d *GuildData) Icon() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	if d.guild.Icon != nil {
		return *d.guild.Icon, nil
	}

	return "", nil
}

func (d *GuildData) IconURL() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	iconURL := d.guild.IconURL(discord.WithSize(512))
	if iconURL == nil {
		return "", nil
	}

	return *iconURL, nil
}

func (d *GuildData) Banner() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	if d.guild.Banner != nil {
		return *d.guild.Banner, nil
	}

	return "", nil
}

func (d *GuildData) BannerURL() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	bannerURL := d.guild.BannerURL(discord.WithSize(1024))
	if bannerURL == nil {
		return "", nil
	}

	return *bannerURL, nil
}

func (d *GuildData) MemberCount() (int, error) {
	if err := d.ensureGuild(); err != nil {
		return 0, err
	}

	return d.guild.MemberCount, nil
}

func (d *GuildData) BoostCount() (int, error) {
	if err := d.ensureGuild(); err != nil {
		return 0, err
	}

	return d.guild.PremiumSubscriptionCount, nil
}

func (d *GuildData) BoostLevel() (int, error) {
	if err := d.ensureGuild(); err != nil {
		return 0, err
	}

	return int(d.guild.PremiumTier), nil
}

type ChannelData struct {
	caches    cache.Caches
	channelID util.ID
	channel   discord.GuildChannel
}

func NewChannelData(caches cache.Caches, channelID util.ID, c discord.GuildChannel) *ChannelData {
	return &ChannelData{
		caches:    caches,
		channelID: channelID,
		channel:   c,
	}
}

func (d *ChannelData) ensureChannel() error {
	if d.channel != nil {
		return nil
	}

	channel, ok := d.caches.Channel(d.channelID)
	if !ok {
		return fmt.Errorf("channel not found in cache")
	}

	d.channel = channel
	return nil
}

func (d *ChannelData) String() string {
	return d.Mention()
}

func (d *ChannelData) ID() string {
	return d.channelID.String()
}

func (d *ChannelData) Name() (string, error) {
	if err := d.ensureChannel(); err != nil {
		return "", err
	}

	return d.channel.Name(), nil
}

func (d *ChannelData) Mention() string {
	return fmt.Sprintf("<#%s>", d.channelID)
}

func (d *ChannelData) Topic() (string, error) {
	if err := d.ensureChannel(); err != nil {
		return "", err
	}

	if text, ok := d.channel.(discord.GuildTextChannel); ok {
		topic := text.Topic()
		if topic != nil {
			return *topic, nil
		}
	}

	return "", nil
}

type RoleData struct {
	caches  cache.Caches
	guildID util.ID
	roleID  util.ID
	role    *discord.Role
}

func NewRoleData(caches cache.Caches, guildID util.ID, roleID util.ID, role *discord.Role) *RoleData {
	return &RoleData{
		caches:  caches,
		guildID: guildID,
		roleID:  roleID,
		role:    role,
	}
}

func (d *RoleData) ensureRole() error {
	if d.role != nil {
		return nil
	}

	role, ok := d.caches.Role(d.guildID, d.roleID)
	if !ok {
		return fmt.Errorf("role not found in cache")
	}

	d.role = &role
	return nil
}

func (d *RoleData) String() string {
	return d.Mention()
}

func (d *RoleData) ID() string {
	return d.roleID.String()
}

func (d *RoleData) Mention() string {
	return fmt.Sprintf("<@&%s>", d.roleID.String())
}

func (d *RoleData) Name() (string, error) {
	if err := d.ensureRole(); err != nil {
		return "", err
	}

	return d.role.Name, nil
}

type AttachmentData struct {
	a discord.Attachment
}

func NewAttachmentData(a discord.Attachment) *AttachmentData {
	return &AttachmentData{a: a}
}

func (d *AttachmentData) String() string {
	return d.URL()
}

func (d *AttachmentData) ID() string {
	return d.a.ID.String()
}

func (d *AttachmentData) URL() string {
	return d.a.URL
}
