package handler

import (
	"slices"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/snowflake/v2"
)

// entitySelection is what was picked in a user, role, mentionable or channel select, as mentions
// and IDs separated by spaces.
type entitySelection struct {
	mentions string
	ids      string
}

// pickedSelection is nil when nothing was picked.
func pickedSelection(data discord.ComponentInteractionData) *entitySelection {
	var mentions, ids []string
	add := func(values []snowflake.ID, mention func(snowflake.ID) string) {
		for _, id := range values {
			mentions = append(mentions, mention(id))
			ids = append(ids, id.String())
		}
	}

	switch d := data.(type) {
	case discord.UserSelectMenuInteractionData:
		add(d.Values, discord.UserMention)
	case discord.RoleSelectMenuInteractionData:
		add(d.Values, discord.RoleMention)
	case discord.ChannelSelectMenuInteractionData:
		add(d.Values, discord.ChannelMention)
	case discord.MentionableSelectMenuInteractionData:
		// Users and roles are only told apart in the resolved data.
		add(d.Values, func(id snowflake.ID) string {
			if _, ok := d.Resolved.Roles[id]; ok {
				return discord.RoleMention(id)
			}
			return discord.UserMention(id)
		})
	}

	if len(ids) == 0 {
		return nil
	}
	return &entitySelection{
		mentions: strings.Join(mentions, " "),
		ids:      strings.Join(ids, " "),
	}
}

// renameSelect is a copy of the components where the user, role, mentionable or channel select with
// the custom ID has a new one. Those can be in action rows, also inside containers.
func renameSelect(components []discord.LayoutComponent, customID string, newCustomID string) []discord.LayoutComponent {
	res := slices.Clone(components)
	for i, component := range res {
		switch c := component.(type) {
		case discord.ActionRowComponent:
			res[i] = renameSelectInRow(c, customID, newCustomID)
		case discord.ContainerComponent:
			c.Components = slices.Clone(c.Components)
			for j, sub := range c.Components {
				if row, ok := sub.(discord.ActionRowComponent); ok {
					c.Components[j] = renameSelectInRow(row, customID, newCustomID)
				}
			}
			res[i] = c
		}
	}
	return res
}

func renameSelectInRow(row discord.ActionRowComponent, customID string, newCustomID string) discord.ActionRowComponent {
	row.Components = slices.Clone(row.Components)
	for i, component := range row.Components {
		switch c := component.(type) {
		case discord.UserSelectMenuComponent:
			if c.CustomID == customID {
				c.CustomID = newCustomID
				row.Components[i] = c
			}
		case discord.RoleSelectMenuComponent:
			if c.CustomID == customID {
				c.CustomID = newCustomID
				row.Components[i] = c
			}
		case discord.MentionableSelectMenuComponent:
			if c.CustomID == customID {
				c.CustomID = newCustomID
				row.Components[i] = c
			}
		case discord.ChannelSelectMenuComponent:
			if c.CustomID == customID {
				c.CustomID = newCustomID
				row.Components[i] = c
			}
		}
	}
	return row
}
