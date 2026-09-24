package template

import (
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

var standardDataMap = map[string]interface{}{}

type InteractionData struct {
	src Source
	i   discord.Interaction
}

func NewInteractionData(src Source, i discord.Interaction) *InteractionData {
	return &InteractionData{
		src: src,
		i:   i,
	}
}

func (d *InteractionData) User() interface{} {
	if d.i.Member() != nil {
		res := NewMemberData(d.src, *d.i.GuildID(), d.i.Member().Member)
		return &res
	}

	return NewUserData(d.i.User())
}

func (d *InteractionData) Member() *MemberData {
	if d.i.Member() == nil {
		return nil
	}

	return NewMemberData(d.src, *d.i.GuildID(), d.i.Member().Member)
}

func (d *InteractionData) Command() *CommandData {
	if d.i.Type() != discord.InteractionTypeApplicationCommand {
		return nil
	}

	cmdInteraction, ok := d.i.(discord.ApplicationCommandInteraction)
	if !ok {
		return nil
	}

	return NewCommandData(d.src, *d.i.GuildID(), cmdInteraction.Data)
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
	src     Source
	guildID common.ID
	m       discord.Member
}

func NewMemberData(src Source, guildID common.ID, m discord.Member) *MemberData {
	return &MemberData{
		UserData: UserData{m.User},
		src:      src,
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
		res[i] = NewRoleData(d.src, d.guildID, roleID, nil)
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
	src     Source
	guildID common.ID
	c       discord.ApplicationCommandInteractionData
}

func NewCommandData(src Source, guildID common.ID, c discord.ApplicationCommandInteractionData) *CommandData {
	return &CommandData{
		src:     src,
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
			res[opt.Name] = NewCommandOptionData(d.src, d.guildID, slashCMD, opt)
		}
	}

	return res
}

func (d *CommandData) Args() map[string]interface{} {
	return d.Options()
}

func NewCommandOptionData(src Source, guildID common.ID, c discord.SlashCommandInteractionData, o discord.SlashCommandOption) interface{} {
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
		resolved, ok := c.Resolved.Channels[channelID]
		if ok {
			return NewResolvedChannelData(src, resolved)
		}
		return NewChannelData(src, channelID, nil)
	case discord.ApplicationCommandOptionTypeRole:
		roleID := o.Snowflake()
		resolved, ok := c.Resolved.Roles[roleID]
		if ok {
			return NewRoleData(src, guildID, roleID, &resolved)
		}
		return NewRoleData(src, guildID, roleID, nil)
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
	src     Source
	guildID common.ID
	guild   *discord.Guild
}

func NewGuildData(src Source, guildID common.ID, g *discord.Guild) *GuildData {
	return &GuildData{
		src:     src,
		guildID: guildID,
		guild:   g,
	}
}

func (d *GuildData) ensureGuild() error {
	if d.guild != nil {
		return nil
	}

	guild, err := d.src.guild(d.guildID)
	if err != nil {
		return err
	}

	d.guild = guild
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
	src       Source
	channelID common.ID
	channel   discord.GuildChannel
	// resolved is what Discord sent along with the interaction. It's a partial, so a field it
	// doesn't carry still falls through to ensureChannel.
	resolved *discord.ResolvedChannel
}

func NewChannelData(src Source, channelID common.ID, c discord.GuildChannel) *ChannelData {
	return &ChannelData{
		src:       src,
		channelID: channelID,
		channel:   c,
	}
}

// NewResolvedChannelData builds channel data from the resolved data Discord sends along with an
// interaction. It isn't a full channel, so only a template that reads the topic costs a fetch.
func NewResolvedChannelData(src Source, c discord.ResolvedChannel) *ChannelData {
	return &ChannelData{
		src:       src,
		channelID: c.ID,
		resolved:  &c,
	}
}

func (d *ChannelData) ensureChannel() error {
	if d.channel != nil {
		return nil
	}

	channel, err := d.src.channel(d.channelID)
	if err != nil {
		return err
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
	if d.resolved != nil {
		return d.resolved.Name, nil
	}

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
	src     Source
	guildID common.ID
	roleID  common.ID
	role    *discord.Role
}

func NewRoleData(src Source, guildID common.ID, roleID common.ID, role *discord.Role) *RoleData {
	return &RoleData{
		src:     src,
		guildID: guildID,
		roleID:  roleID,
		role:    role,
	}
}

func (d *RoleData) ensureRole() error {
	if d.role != nil {
		return nil
	}

	role, err := d.src.role(d.guildID, d.roleID)
	if err != nil {
		return err
	}

	d.role = role
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
