package assistant

import (
	"encoding/json"
	"fmt"
	"maps"
	"slices"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

// The message is checked loosely here. The editor's schema has the exact rules, like text
// lengths, and shows the user what's left. This only fixes what has one obvious fix, and finds
// what the editor can't: what the plan doesn't include and IDs the guild doesn't have.

// inspect cleans up the message and adds what check finds to issues. A message that isn't an
// object is dropped, with an issue to repair it.
func inspect(messageJSON string, issues []string, guild Guild) (string, []string) {
	if messageJSON == "" {
		return "", issues
	}
	var msg map[string]any
	if err := json.Unmarshal([]byte(messageJSON), &msg); err != nil || msg == nil {
		return "", append(issues, "new_message isn't a JSON object.")
	}

	cleanUp(msg)
	issues = append(issues, check(msg, guild)...)

	cleaned, err := json.Marshal(msg)
	if err != nil {
		return messageJSON, issues
	}
	return string(cleaned), issues
}

// cleanUp fixes mistakes that have one obvious fix, so they don't need a repair.
func cleanUp(msg map[string]any) {
	dropEmptyURLs(msg)

	if components, ok := msg["components"].([]any); ok {
		msg["components"] = unwrapSections(components)
	}

	// Buttons and options that share an action set get a copy of it, as their IDs have to be
	// unique in the message.
	sets, _ := msg["actions"].(map[string]any)
	taken := map[string]bool{}
	for id := range sets {
		taken[id] = true
	}
	var owners []map[string]any
	walkComponents(msg, func(c map[string]any, _ string) {
		for _, owner := range actionSetOwners(c) {
			id, _ := owner["action_set_id"].(string)
			taken[id] = true
			owners = append(owners, owner)
		}
	})
	seen := map[string]bool{}
	for _, owner := range owners {
		id, _ := owner["action_set_id"].(string)
		if id == "" {
			continue
		}
		if seen[id] {
			newID := uniqueID(id, taken)
			taken[newID] = true
			owner["action_set_id"] = newID
			if set, ok := sets[id]; ok {
				sets[newID] = deepCopy(set)
			}
		}
		seen[id] = true
	}
}

// dropEmptyURLs removes the empty URLs the model writes when it has no image, the images left
// without one, and authors without a name.
func dropEmptyURLs(v any) {
	switch v := v.(type) {
	case map[string]any:
		for key, value := range v {
			if (key == "url" || strings.HasSuffix(key, "_url")) && value == "" {
				delete(v, key)
				continue
			}
			dropEmptyURLs(value)
			object, ok := value.(map[string]any)
			if !ok {
				continue
			}
			switch key {
			case "image", "thumbnail":
				if len(object) == 0 {
					delete(v, key)
				}
			case "author", "provider":
				if name, _ := object["name"].(string); name == "" {
					delete(v, key)
				}
			}
		}
	case []any:
		for _, value := range v {
			dropEmptyURLs(value)
		}
	}
}

// unwrapSections replaces sections without an accessory with a text display of their text. The
// model leaves the accessory out when it has nothing to show next to the text, but it's required.
func unwrapSections(components []any) []any {
	for i, v := range components {
		c, ok := v.(map[string]any)
		if !ok {
			continue
		}
		children, _ := c["components"].([]any)
		if children != nil {
			c["components"] = unwrapSections(children)
		}
		if typeOf(c) != discord.ComponentTypeSection || hasAccessory(c) {
			continue
		}
		// One text display, so the parent doesn't get more components than it may have.
		texts := make([]string, 0, len(children))
		for _, child := range children {
			if display, ok := child.(map[string]any); ok {
				if content, ok := display["content"].(string); ok {
					texts = append(texts, content)
				}
			}
		}
		components[i] = map[string]any{"type": float64(discord.ComponentTypeTextDisplay), "content": strings.Join(texts, "\n")}
	}
	return components
}

func hasAccessory(section map[string]any) bool {
	accessory, ok := section["accessory"].(map[string]any)
	if !ok {
		return false
	}
	if typeOf(accessory) == discord.ComponentTypeThumbnail {
		media, _ := accessory["media"].(map[string]any)
		url, _ := media["url"].(string)
		return url != ""
	}
	return true
}

// check reports what the plan doesn't include, components where they can't be, and the roles and
// saved messages the actions use that the guild doesn't have.
func check(msg map[string]any, guild Guild) []string {
	var issues []string
	f := guild.Features

	issues = append(issues, checkPlacement(msg)...)

	raw, _ := json.Marshal(msg["actions"])
	var sets map[string]actions.ActionSet
	if err := json.Unmarshal(raw, &sets); err != nil {
		// The editor reports what's wrong with them.
		return issues
	}
	for _, id := range slices.Sorted(maps.Keys(sets)) {
		if n := len(sets[id].Actions); n > f.MaxActionsPerComponent {
			issues = append(issues, fmt.Sprintf(
				"actions.%s: The plan allows %d actions per button or option, not %d.",
				id, f.MaxActionsPerComponent, n,
			))
		}
	}
	return append(issues, checkIDs(sets, guild)...)
}

// childTypes is what components can hold, which the editor can't read otherwise.
var childTypes = map[discord.ComponentType][]discord.ComponentType{
	discord.ComponentTypeActionRow: {discord.ComponentTypeButton, discord.ComponentTypeStringSelectMenu},
	discord.ComponentTypeSection:   {discord.ComponentTypeTextDisplay},
	discord.ComponentTypeContainer: {
		discord.ComponentTypeActionRow, discord.ComponentTypeSection, discord.ComponentTypeTextDisplay,
		discord.ComponentTypeMediaGallery, discord.ComponentTypeSeparator, discord.ComponentTypeFile,
	},
}

// checkPlacement reports components where they can't be, like a text display in an action row.
func checkPlacement(msg map[string]any) []string {
	top := []discord.ComponentType{discord.ComponentTypeActionRow}
	if flags, _ := msg["flags"].(float64); discord.MessageFlags(flags).Has(discord.MessageFlagIsComponentsV2) {
		top = append(slices.Clone(childTypes[discord.ComponentTypeContainer]), discord.ComponentTypeContainer)
	}

	var issues []string
	var walk func(components []any, path string, allowed []discord.ComponentType, in string)
	walk = func(components []any, path string, allowed []discord.ComponentType, in string) {
		for i, v := range components {
			c, ok := v.(map[string]any)
			if !ok {
				continue
			}
			at := fmt.Sprintf("%s.%d", path, i)
			t := typeOf(c)
			if !slices.Contains(allowed, t) {
				issues = append(issues, fmt.Sprintf("%s: A component of type %d can't be %s.", at, t, in))
				continue
			}
			if accessory, ok := c["accessory"].(map[string]any); ok && t == discord.ComponentTypeSection {
				if a := typeOf(accessory); a != discord.ComponentTypeButton && a != discord.ComponentTypeThumbnail {
					issues = append(issues, fmt.Sprintf("%s.accessory: A component of type %d can't be the accessory of a section.", at, a))
				}
			}
			if children, ok := c["components"].([]any); ok {
				walk(children, at+".components", childTypes[t], fmt.Sprintf("in a component of type %d", t))
			}
		}
	}
	components, _ := msg["components"].([]any)
	walk(components, "components", top, "at the top of this message")
	return issues
}

// checkIDs reports roles and saved messages the actions use that the guild doesn't have, which the
// model sometimes makes up.
func checkIDs(sets map[string]actions.ActionSet, guild Guild) []string {
	if !guild.HasBot {
		return nil
	}

	// Managed roles can only be checked.
	roles := make(map[string]bool, len(guild.Roles))
	assignable := make(map[string]bool, len(guild.Roles))
	for _, role := range guild.Roles {
		roles[role.ID.String()] = true
		assignable[role.ID.String()] = !role.Managed
	}
	saved := make(map[string]bool, len(guild.SavedMessages))
	for _, m := range guild.SavedMessages {
		saved[m.ID] = true
	}

	var issues []string
	for _, setID := range slices.Sorted(maps.Keys(sets)) {
		for i, action := range sets[setID].Actions {
			var unknown []string
			switch action.Type {
			case actions.ActionTypeToggleRole, actions.ActionTypeAddRole, actions.ActionTypeRemoveRole:
				if !roles[action.TargetID] {
					unknown = append(unknown, "role "+action.TargetID)
				} else if !assignable[action.TargetID] {
					issues = append(issues, fmt.Sprintf(
						"Action %d of action set %q gives or takes the managed role %s, which isn't possible. Use another role or remove the action.",
						i+1, setID, action.TargetID,
					))
				}
			case actions.ActionTypeSavedMessageResponse, actions.ActionTypeSavedMessageDM, actions.ActionTypeSavedMessageEdit, actions.ActionTypeSavedMessageChannel:
				// A response that carries its own message names no saved message.
				if action.Message == nil && !saved[action.TargetID] {
					unknown = append(unknown, "saved message "+action.TargetID)
				}
			case actions.ActionTypePermissionCheck:
				for _, id := range action.RoleIDs {
					if !roles[id] {
						unknown = append(unknown, "role "+id)
					}
				}
			}
			for _, u := range unknown {
				issues = append(issues, fmt.Sprintf(
					"Action %d of action set %q uses %s, which the server doesn't have. Use one from the list, or remove the action and ask the user.",
					i+1, setID, u,
				))
			}
		}
	}
	return issues
}

// walkComponents calls visit for every component of the message, with its path like
// "components.0.components.1", including section accessories.
func walkComponents(msg map[string]any, visit func(c map[string]any, path string)) {
	var walk func(components []any, path string)
	walk = func(components []any, path string) {
		for i, v := range components {
			c, ok := v.(map[string]any)
			if !ok {
				continue
			}
			at := fmt.Sprintf("%s.%d", path, i)
			visit(c, at)
			if accessory, ok := c["accessory"].(map[string]any); ok {
				visit(accessory, at+".accessory")
			}
			if children, ok := c["components"].([]any); ok {
				walk(children, at+".components")
			}
		}
	}
	components, _ := msg["components"].([]any)
	walk(components, "components")
}

// actionSetOwners returns what has an action set in the component: the component itself for
// buttons that aren't links, and the options of select menus.
func actionSetOwners(c map[string]any) []map[string]any {
	switch typeOf(c) {
	case discord.ComponentTypeButton:
		if style, _ := c["style"].(float64); discord.ButtonStyle(style) != discord.ButtonStyleLink {
			return []map[string]any{c}
		}
	case discord.ComponentTypeStringSelectMenu:
		options, _ := c["options"].([]any)
		var owners []map[string]any
		for _, v := range options {
			if option, ok := v.(map[string]any); ok {
				owners = append(owners, option)
			}
		}
		return owners
	}
	return nil
}

func typeOf(c map[string]any) discord.ComponentType {
	t, _ := c["type"].(float64)
	return discord.ComponentType(t)
}

func uniqueID(id string, taken map[string]bool) string {
	for n := 2; ; n++ {
		candidate := fmt.Sprintf("%s_%d", id, n)
		if !taken[candidate] {
			return candidate
		}
	}
}

func deepCopy(v any) any {
	raw, _ := json.Marshal(v)
	var res any
	json.Unmarshal(raw, &res)
	return res
}
