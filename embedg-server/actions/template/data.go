package template

import (
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
)

func standardData() map[string]interface{} {
	return map[string]interface{}{}
}

type InteractionData struct {
	state *discordgo.State
	i     *discordgo.Interaction
}

func NewInteractionData(i *discordgo.Interaction) *InteractionData {
	return &InteractionData{i: i}
}

func (d *InteractionData) User() interface{} {
	if d.i.Member != nil {
		res := NewMemberData(d.state, d.i.GuildID, d.i.Member)
		return &res
	}

	return NewUserData(d.i.User)
}

func (d *InteractionData) Member() *MemberData {
	if d.i.Member == nil {
		return nil
	}

	return NewMemberData(d.state, d.i.GuildID, d.i.Member)
}

func (d *InteractionData) Command() *CommandData {
	if d.i.Type != discordgo.InteractionApplicationCommand {
		return nil
	}

	data := d.i.ApplicationCommandData()
	return NewCommandData(d.state, d.i.GuildID, &data)
}

type UserData struct {
	u *discordgo.User
}

func NewUserData(u *discordgo.User) *UserData {
	return &UserData{u: u}
}

func (d *UserData) String() string {
	return d.Mention()
}

func (d *UserData) ID() string {
	return d.u.ID
}

func (d *UserData) Name() string {
	if d.u.GlobalName != "" {
		return d.u.GlobalName
	}

	return d.u.Username
}

func (d *UserData) Username() string {
	return d.u.Username
}

func (d *UserData) GlobalName() string {
	return d.u.GlobalName
}

func (d *UserData) Discriminator() string {
	return d.u.Discriminator
}

func (d *UserData) Avatar() string {
	return d.u.Avatar
}

func (d *UserData) Banner() string {
	return d.u.Banner
}

func (d *UserData) Mention() string {
	return d.u.Mention()
}

func (d *UserData) AvatarURL(size string) string {
	return d.u.AvatarURL(size)
}

func (d *UserData) BannerURL(size string) string {
	return d.u.BannerURL(size)
}

type MemberData struct {
	UserData
	state   *discordgo.State
	guildID string
	m       *discordgo.Member
}

func NewMemberData(state *discordgo.State, guildID string, m *discordgo.Member) *MemberData {
	return &MemberData{
		UserData: UserData{m.User},
		state:    state,
		guildID:  guildID,
		m:        m,
	}
}

func (d *MemberData) Nick() string {
	return d.m.Nick
}

func (d *MemberData) Roles() []*RoleData {
	res := make([]*RoleData, len(d.m.Roles))
	for i, roleID := range d.m.Roles {
		res[i] = NewRoleData(d.state, d.guildID, roleID, nil)
	}

	return res
}

func (d *MemberData) JoinedAt() time.Time {
	return d.m.JoinedAt
}

func (d *MemberData) Name() string {
	if d.m.Nick != "" {
		return d.m.Nick
	}

	return d.UserData.Name()
}

func (d *MemberData) Avatar() string {
	if d.m.Avatar != "" {
		return d.m.Avatar
	}

	return d.UserData.Avatar()
}

func (d *MemberData) AvatarURL(size string) string {
	if d.m.Avatar != "" {
		return d.m.AvatarURL(size)
	}

	return d.UserData.AvatarURL(size)
}

type CommandData struct {
	state   *discordgo.State
	guildID string
	c       *discordgo.ApplicationCommandInteractionData
}

func NewCommandData(state *discordgo.State, guildID string, c *discordgo.ApplicationCommandInteractionData) *CommandData {
	return &CommandData{
		state:   state,
		guildID: guildID,
		c:       c,
	}
}

func (d *CommandData) String() string {
	return d.Mention()
}

func (d *CommandData) ID() string {
	return d.c.ID
}

func (d *CommandData) Name() string {
	return d.c.Name
}

func (d *CommandData) Mention() string {
	return fmt.Sprintf("</%s:%s>", d.c.Name, d.c.ID)
}

func (d *CommandData) Options() map[string]*CommandOptionData {
	res := make(map[string]*CommandOptionData)
	for _, opt := range d.c.Options {
		res[opt.Name] = NewCommandOptionData(d.state, d.guildID, d.c, opt)
	}

	return res
}

func (d *CommandData) Args() map[string]*CommandOptionData {
	return d.Options()
}

type CommandOptionData struct {
	state   *discordgo.State
	guildID string
	c       *discordgo.ApplicationCommandInteractionData
	o       *discordgo.ApplicationCommandInteractionDataOption
}

func NewCommandOptionData(state *discordgo.State, guildID string, c *discordgo.ApplicationCommandInteractionData, o *discordgo.ApplicationCommandInteractionDataOption) *CommandOptionData {
	return &CommandOptionData{
		state:   state,
		guildID: guildID,
		c:       c,
		o:       o,
	}
}

func (d *CommandOptionData) String() string {
	return fmt.Sprintf("%v", d.Value())
}

func (d *CommandOptionData) Value() interface{} {
	switch d.o.Type {
	case discordgo.ApplicationCommandOptionString:
		return d.o.StringValue()
	case discordgo.ApplicationCommandOptionInteger:
		return fmt.Sprintf("%d", d.o.IntValue())
	case discordgo.ApplicationCommandOptionBoolean:
		return fmt.Sprintf("%t", d.o.BoolValue())
	case discordgo.ApplicationCommandOptionUser:
		user := d.o.UserValue(nil)
		resolved := d.c.Resolved.Users[user.ID]
		if resolved != nil {
			return UserData{resolved}
		}
		return UserData{user}
	case discordgo.ApplicationCommandOptionChannel:
		channel := d.o.ChannelValue(nil)
		resolved := d.c.Resolved.Channels[channel.ID]
		if resolved != nil {
			return NewChannelData(d.state, channel.ID, resolved)
		}
		return NewChannelData(d.state, channel.ID, nil)
	case discordgo.ApplicationCommandOptionRole:
		role := d.o.RoleValue(nil, "")
		resolved := d.c.Resolved.Roles[role.ID]
		if resolved != nil {
			return NewRoleData(d.state, d.guildID, role.ID, resolved)
		}
		return NewRoleData(d.state, d.guildID, role.ID, nil)
	case discordgo.ApplicationCommandOptionNumber:
		return fmt.Sprintf("%f", d.o.FloatValue())
	case discordgo.ApplicationCommandOptionAttachment:
		attachment := d.c.Resolved.Attachments[d.o.Value.(string)]
		if attachment != nil {
			return NewAttachmentData(attachment)
		}
		return nil
	}

	return nil
}

type GuildData struct {
	state   *discordgo.State
	guildID string
	guild   *discordgo.Guild
}

func NewGuildData(state *discordgo.State, guildID string, g *discordgo.Guild) *GuildData {
	return &GuildData{
		state:   state,
		guildID: guildID,
		guild:   g,
	}
}

func (d *GuildData) ensureGuild() error {
	if d.guild != nil {
		return nil
	}

	guild, err := d.state.Guild(d.guildID)
	if err != nil {
		return err
	}

	d.guild = guild
	return nil
}

func (d *GuildData) String() string {
	if err := d.ensureGuild(); err != nil {
		return d.guildID
	}
	return d.guild.Name
}

func (d *GuildData) ID() string {
	return d.guildID
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

	return d.guild.Description, nil
}

func (d *GuildData) Icon() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.Icon, nil
}

func (d *GuildData) IconURL(size string) (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.IconURL(size), nil
}

func (d *GuildData) Banner() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.Banner, nil
}

func (d *GuildData) BannerURL(size string) (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.BannerURL(size), nil
}

func (d *GuildData) MemberCount() (int, error) {
	fmt.Println("GuildData.MemberCount")
	if err := d.ensureGuild(); err != nil {
		fmt.Println(err)
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
	state     *discordgo.State
	channelID string
	channel   *discordgo.Channel
}

func NewChannelData(state *discordgo.State, channelID string, c *discordgo.Channel) *ChannelData {
	return &ChannelData{
		state:     state,
		channelID: channelID,
		channel:   c,
	}
}

func (d *ChannelData) ensureChannel() error {
	if d.channel != nil {
		return nil
	}

	channel, err := d.state.Channel(d.channelID)
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
	return d.channelID
}

func (d *ChannelData) Name() (string, error) {
	if err := d.ensureChannel(); err != nil {
		return "", err
	}

	return d.channel.Name, nil
}

func (d *ChannelData) Mention() string {
	return fmt.Sprintf("<#%s>", d.channelID)
}

func (d *ChannelData) Topic() (string, error) {
	if err := d.ensureChannel(); err != nil {
		return "", err
	}

	return d.channel.Topic, nil
}

type RoleData struct {
	state   *discordgo.State
	guildID string
	roleID  string
	role    *discordgo.Role
}

func NewRoleData(state *discordgo.State, guildID string, roleID string, role *discordgo.Role) *RoleData {
	return &RoleData{
		state:   state,
		guildID: guildID,
		roleID:  roleID,
		role:    role,
	}
}

func (d *RoleData) ensureRole() error {
	if d.role != nil {
		return nil
	}

	role, err := d.state.Role(d.guildID, d.roleID)
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
	return d.roleID
}

func (d *RoleData) Mention() string {
	return fmt.Sprintf("<@&%s>", d.roleID)
}

func (d *RoleData) Name() (string, error) {
	if err := d.ensureRole(); err != nil {
		return "", err
	}

	return d.role.Name, nil
}

type AttachmentData struct {
	a *discordgo.MessageAttachment
}

func NewAttachmentData(a *discordgo.MessageAttachment) *AttachmentData {
	return &AttachmentData{a: a}
}

func (d *AttachmentData) String() string {
	return d.URL()
}

func (d *AttachmentData) ID() string {
	return d.a.ID
}

func (d *AttachmentData) URL() string {
	return d.a.URL
}
