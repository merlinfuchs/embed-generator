package template

import (
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
)

var standardDataMap = map[string]interface{}{}

type InteractionData struct {
	state *discordgo.State
	i     *discordgo.Interaction
}

func NewInteractionData(state *discordgo.State, i *discordgo.Interaction) *InteractionData {
	return &InteractionData{
		state: state,
		i:     i,
	}
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

func (d *UserData) AvatarURL() string {
	return d.u.AvatarURL("512")
}

func (d *UserData) BannerURL() string {
	return d.u.BannerURL("1024")
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

func (d *MemberData) AvatarURL() string {
	if d.m.Avatar != "" {
		return d.m.AvatarURL("512")
	}

	return d.UserData.AvatarURL()
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

func (d *CommandData) Options() map[string]interface{} {
	res := make(map[string]interface{})
	for _, opt := range d.c.Options {
		res[opt.Name] = NewCommandOptionData(d.state, d.guildID, d.c, opt)
	}

	return res
}

func (d *CommandData) Args() map[string]interface{} {
	return d.Options()
}

func NewCommandOptionData(state *discordgo.State, guildID string, c *discordgo.ApplicationCommandInteractionData, o *discordgo.ApplicationCommandInteractionDataOption) interface{} {
	switch o.Type {
	case discordgo.ApplicationCommandOptionString:
		return o.StringValue()
	case discordgo.ApplicationCommandOptionInteger:
		return o.IntValue()
	case discordgo.ApplicationCommandOptionBoolean:
		return o.BoolValue()
	case discordgo.ApplicationCommandOptionUser:
		user := o.UserValue(nil)
		resolved := c.Resolved.Users[user.ID]
		if resolved != nil {
			return UserData{resolved}
		}
		return UserData{user}
	case discordgo.ApplicationCommandOptionChannel:
		channel := o.ChannelValue(nil)
		resolved := c.Resolved.Channels[channel.ID]
		if resolved != nil {
			return NewChannelData(state, channel.ID, resolved)
		}
		return NewChannelData(state, channel.ID, nil)
	case discordgo.ApplicationCommandOptionRole:
		role := o.RoleValue(nil, "")
		resolved := c.Resolved.Roles[role.ID]
		if resolved != nil {
			return NewRoleData(state, guildID, role.ID, resolved)
		}
		return NewRoleData(state, guildID, role.ID, nil)
	case discordgo.ApplicationCommandOptionNumber:
		return fmt.Sprintf("%f", o.FloatValue())
	case discordgo.ApplicationCommandOptionAttachment:
		attachment := c.Resolved.Attachments[o.Value.(string)]
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

func (d *GuildData) IconURL() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.IconURL("512"), nil
}

func (d *GuildData) Banner() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.Banner, nil
}

func (d *GuildData) BannerURL() (string, error) {
	if err := d.ensureGuild(); err != nil {
		return "", err
	}

	return d.guild.BannerURL("1024"), nil
}

func (d *GuildData) MemberCount() (int, error) {
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
