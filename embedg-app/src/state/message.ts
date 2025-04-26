import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  MessageComponentButtonStyle,
  EmbedField,
  Message,
  MessageComponentActionRow,
  MessageComponentButton,
  MessageEmbed,
  MessageComponentSelectMenuOption,
  MessageComponentSelectMenu,
  MessageAction,
  Emoji,
  Component,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { TemporalState, temporal } from "zundo";
import debounce from "just-debounce-it";

export interface MessageStore extends Message {
  clear(): void;
  replace(message: Message): void;
  setContent: (content: string) => void;
  setUsername: (username: string | undefined) => void;
  setAvatarUrl: (avatar_url: string | undefined) => void;
  setThreadName: (thread_name: string | undefined) => void;
  addEmbed: (embed: MessageEmbed) => void;
  clearEmbeds: () => void;
  moveEmbedDown: (i: number) => void;
  moveEmbedUp: (i: number) => void;
  duplicateEmbed: (i: number) => void;
  deleteEmbed: (i: number) => void;
  setEmbedDescription: (i: number, description: string | undefined) => void;
  setEmbedTitle: (i: number, title: string | undefined) => void;
  setEmbedUrl: (i: number, url: string | undefined) => void;
  setEmbedAuthorName: (i: number, name: string) => void;
  setEmbedAuthorUrl: (i: number, url: string | undefined) => void;
  setEmbedAuthorIconUrl: (i: number, icon_url: string | undefined) => void;
  setEmbedThumbnailUrl: (i: number, url: string | undefined) => void;
  setEmbedImageUrl: (i: number, url: string | undefined) => void;
  setEmbedFooterText: (i: number, text: string | undefined) => void;
  setEmbedFooterIconUrl: (i: number, icon_url: string | undefined) => void;
  setEmbedColor: (i: number, color: number | undefined) => void;
  setEmbedTimestamp: (i: number, timestamp: string | undefined) => void;
  addEmbedField: (i: number, field: EmbedField) => void;
  setEmbedFieldName: (i: number, j: number, name: string) => void;
  setEmbedFieldValue: (i: number, j: number, value: string) => void;
  setEmbedFieldInline: (
    i: number,
    j: number,
    inline: boolean | undefined
  ) => void;
  moveEmbedFieldDown: (i: number, j: number) => void;
  moveEmbedFieldUp: (i: number, j: number) => void;
  deleteEmbedField: (i: number, j: number) => void;
  duplicateEmbedField: (i: number, j: number) => void;
  clearEmbedFields: (i: number) => void;
  addRootComponent: (component: Component) => void;
  clearRootComponents: () => void;
  moveRootComponentUp: (i: number) => void;
  moveRootComponentDown: (i: number) => void;
  duplicateRootComponent: (i: number) => void;
  deleteRootComponent: (i: number) => void;
  setRootComponentContent: (i: number, content: string) => void;
  addSubComponent: (i: number, component: Component) => void;
  clearSubComponents: (i: number) => void;
  moveSubComponentDown: (i: number, j: number) => void;
  moveSubComponentUp: (i: number, j: number) => void;
  duplicateSubComponent: (i: number, j: number) => void;
  deleteSubComponent: (i: number, j: number) => void;
  setSubComponentStyle: (
    i: number,
    j: number,
    style: MessageComponentButtonStyle
  ) => void;
  setSubComponentLabel: (i: number, j: number, label: string) => void;
  setSubComponentEmoji: (
    i: number,
    j: number,
    emoji: Emoji | undefined
  ) => void;
  setSubComponentUrl: (i: number, j: number, url: string) => void;
  setSubComponentDisabled: (
    i: number,
    j: number,
    disabled: boolean | undefined
  ) => void;
  setSubComponentPlaceholder: (
    i: number,
    j: number,
    placeholder: string | undefined
  ) => void;
  addSubComponentOption: (
    i: number,
    j: number,
    option: MessageComponentSelectMenuOption
  ) => void;
  clearSubComponentOptions: (i: number, j: number) => void;
  moveSubComponentOptionDown: (i: number, j: number, k: number) => void;
  moveSubComponentOptionUp: (i: number, j: number, k: number) => void;
  duplicateSubComponentOption: (i: number, j: number, k: number) => void;
  deleteSubComponentOption: (i: number, j: number, k: number) => void;
  setSubComponentOptionLabel: (
    i: number,
    j: number,
    k: number,
    label: string
  ) => void;
  setSubComponentOptionDescription: (
    i: number,
    j: number,
    k: number,
    description: string | undefined
  ) => void;
  setSubComponentOptionEmoji: (
    i: number,
    j: number,
    k: number,
    emoji: Emoji | undefined
  ) => void;
  setSubComponentContent: (i: number, j: number, content: string) => void;
  addAction: (id: string, action: MessageAction) => void;
  clearActions: (id: string) => void;
  deleteAction: (id: string, i: number) => void;
  moveActionUp: (id: string, i: number) => void;
  moveActionDown: (id: string, i: number) => void;
  duplicateAction: (id: string, i: number) => void;
  setActionType: (id: string, i: number, type: number) => void;
  setActionText: (id: string, i: number, text: string) => void;
  setActionTargetId: (id: string, i: number, target: string) => void;
  setActionPublic: (id: string, i: number, val: boolean) => void;
  setActionDisableDefaultResponse: (
    id: string,
    i: number,
    val: boolean
  ) => void;
  setActionPermissions: (id: string, i: number, val: string) => void;
  setActionRoleIds: (id: string, i: number, val: string[]) => void;

  getSelectMenu: (i: number, j: number) => MessageComponentSelectMenu | null;
  getSubComponents: (i: number) => Component[];
  getSubComponent: (i: number, j: number) => Component | null;
  getButton: (i: number, j: number) => MessageComponentButton | null;

  getComponentsV2Enabled: () => boolean;
  setComponentsV2Enabled: (enabled: boolean) => void;
}

export const defaultMessage: Message = {
  content:
    'Welcome to **Embed Generator**! 🎉 Create stunning embed messages for your Discord server with ease!\n\nIf you\'re ready to start, simply click on the "Clear" button at the top of the editor and create your own message.\n\nShould you need any assistance or have questions, feel free to join our [support server](/discord) where you can connect with our helpful community members and get the support you need.\n\nWe also have a [complementary bot](/invite) that enhances the experience with Embed Generator. Check out our [Discord bot](/invite) which offers features like formatting for mentions, channels, and emoji, creating reaction roles, interactive components, and more.\n\nLet your creativity shine and make your server stand out with Embed Generator! ✨',
  tts: false,
  embeds: [
    {
      id: 652627557,
      title: "About Embed Generator",
      description:
        "Embed Generator is a powerful tool that enables you to create visually appealing and interactive embed messages for your Discord server. With the use of webhooks, Embed Generator allows you to customize the appearance of your messages and make them more engaging.\n\nTo get started, all you need is a webhook URL, which can be obtained from the 'Integrations' tab in your server's settings. If you encounter any issues while setting up a webhook, our bot can assist you in creating one.\n\nInstead of using webhooks you can also select a server and channel directly here on the website. The bot will automatically create a webhook for you and use it to send the message.",
      color: 2326507,
      fields: [],
    },
    {
      id: 10674342,
      title: "Discord Bot Integration",
      description:
        "Embed Generator offers a Discord bot integration that can further enhance your the functionality. While it is not mandatory for sending messages, having the bot on your server gives you access to a lot more features!\n\nHere are some key features of our bot:",
      color: 2326507,
      fields: [
        {
          id: 472281785,
          name: "Interactive Components",
          value:
            "With our bot on your server you can add interactive components like buttons and select menus to your messages. Just invite the bot to your server, select the right server here on the website and you are ready to go!",
        },
        {
          id: 608893643,
          name: "Special Formatting for Mentions, Channels, and Emoji",
          value:
            "With the /format command, our bot provides special formatting options for mentions, channel tags, and ready-to-use emoji. No more manual formatting errors! Simply copy and paste the formatted text into the editor.",
        },
        {
          id: 724530251,
          name: "Recover Embed Generator Messages",
          value:
            "If you ever need to retrieve a previously sent message created with Embed Generator, our bot can assist you. Right-click or long-press any message in your server, navigate to the apps menu, and select Restore to Embed Generator. You'll receive a link that leads to the editor page with the selected message.",
        },
        {
          id: 927221233,
          name: "Additional Features",
          value:
            "Our bot also supports fetching images from profile pictures or emojis, webhook management, and more. Invite the bot to your server and use the /help command to explore all the available features!",
        },
      ],
    },
  ],
  components: [],
  actions: {},
  flags: 0,
};

export const emptyMessage: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
};

export const createMessageStore = (key: string) =>
  create<MessageStore>()(
    immer(
      persist(
        temporal(
          (set, get) => ({
            ...defaultMessage,

            clear: () => set(defaultMessage),
            replace: (message: Message) => set(message),
            setContent: (content: string) => set({ content }),
            setUsername: (username: string | undefined) => set({ username }),
            setAvatarUrl: (avatar_url: string | undefined) =>
              set({ avatar_url }),
            setThreadName: (thread_name: string | undefined) =>
              set({ thread_name }),
            addEmbed: (embed: MessageEmbed) =>
              set((state) => {
                if (!state.embeds) {
                  state.embeds = [embed];
                } else {
                  state.embeds.push(embed);
                }
              }),
            clearEmbeds: () => set({ embeds: [] }),
            moveEmbedDown: (i: number) => {
              set((state) => {
                if (!state.embeds) {
                  return;
                }
                const embed = state.embeds[i];
                if (!embed) {
                  return;
                }
                state.embeds.splice(i, 1);
                state.embeds.splice(i + 1, 0, embed);
              });
            },
            moveEmbedUp: (i: number) => {
              set((state) => {
                if (!state.embeds) {
                  return;
                }
                const embed = state.embeds[i];
                if (!embed) {
                  return;
                }
                state.embeds.splice(i, 1);
                state.embeds.splice(i - 1, 0, embed);
              });
            },
            duplicateEmbed: (i: number) => {
              set((state) => {
                if (!state.embeds) {
                  return;
                }
                const embed = state.embeds[i];
                if (!embed) {
                  return;
                }
                state.embeds.splice(i + 1, 0, { ...embed, id: getUniqueId() });
              });
            },
            deleteEmbed: (i: number) => {
              set((state) => {
                if (!state.embeds) {
                  return;
                }
                state.embeds.splice(i, 1);
              });
            },
            setEmbedDescription: (
              i: number,
              description: string | undefined
            ) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].description = description;
                }
              });
            },
            setEmbedTitle: (i: number, title: string | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].title = title;
                }
              });
            },
            setEmbedUrl: (i: number, url: string | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].url = url;
                }
              });
            },
            setEmbedAuthorName: (i: number, name: string) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!name) {
                  if (!embed.author) {
                    return;
                  }

                  embed.author.name = name;
                  if (!embed.author.icon_url && !embed.author.url) {
                    embed.author = undefined;
                  }
                } else {
                  if (!embed.author) {
                    embed.author = { name };
                  } else {
                    embed.author.name = name;
                  }
                }
              }),
            setEmbedAuthorUrl: (i: number, url: string | undefined) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!url) {
                  if (!embed.author) {
                    return;
                  }
                  embed.author.url = undefined;

                  if (!embed.author.name && !embed.author.icon_url) {
                    embed.author = undefined;
                  }
                } else {
                  if (!embed.author) {
                    embed.author = { url, name: "" };
                  } else {
                    embed.author.url = url;
                  }
                }
              }),
            setEmbedAuthorIconUrl: (i: number, icon_url: string | undefined) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!icon_url) {
                  if (!embed.author) {
                    return;
                  }
                  embed.author.icon_url = undefined;

                  if (!embed.author.name && !embed.author.url) {
                    embed.author = undefined;
                  }
                } else {
                  if (!embed.author) {
                    embed.author = { icon_url, name: "" };
                  } else {
                    embed.author.icon_url = icon_url;
                  }
                }
              }),
            setEmbedThumbnailUrl: (i: number, url: string | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].thumbnail = url ? { url } : undefined;
                }
              });
            },
            setEmbedImageUrl: (i: number, url: string | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].image = url ? { url } : undefined;
                }
              });
            },
            setEmbedFooterText: (i: number, text: string | undefined) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!text) {
                  if (!embed.footer) {
                    return;
                  }
                  embed.footer.text = undefined;

                  if (!embed.footer.icon_url) {
                    embed.footer = undefined;
                  }
                } else {
                  if (!embed.footer) {
                    embed.footer = { text };
                  } else {
                    embed.footer.text = text;
                  }
                }
              });
            },
            setEmbedFooterIconUrl: (
              i: number,
              icon_url: string | undefined
            ) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!icon_url) {
                  if (!embed.footer) {
                    return;
                  }
                  embed.footer.icon_url = undefined;

                  if (!embed.footer.text) {
                    embed.footer = undefined;
                  }
                } else {
                  if (!embed.footer) {
                    embed.footer = { icon_url };
                  } else {
                    embed.footer.icon_url = icon_url;
                  }
                }
              });
            },
            setEmbedColor: (i: number, color: number | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].color = color;
                }
              });
            },
            setEmbedTimestamp: (i: number, timestamp: string | undefined) => {
              set((state) => {
                if (state.embeds && state.embeds[i]) {
                  state.embeds[i].timestamp = timestamp;
                }
              });
            },
            addEmbedField: (i: number, field: EmbedField) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                if (!embed.fields) {
                  embed.fields = [field];
                } else {
                  embed.fields.push(field);
                }
              }),
            setEmbedFieldName: (i: number, j: number, name: string) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                field.name = name;
              }),
            setEmbedFieldValue: (i: number, j: number, value: string) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                field.value = value;
              }),
            setEmbedFieldInline: (
              i: number,
              j: number,
              inline: boolean | undefined
            ) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                field.inline = inline;
              }),
            deleteEmbedField: (i: number, j: number) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                embed.fields && embed.fields.splice(j, 1);
              });
            },
            moveEmbedFieldDown: (i: number, j: number) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                embed.fields && embed.fields.splice(j, 1);
                embed.fields && embed.fields.splice(j + 1, 0, field);
              });
            },
            moveEmbedFieldUp: (i: number, j: number) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                embed.fields && embed.fields.splice(j, 1);
                embed.fields && embed.fields.splice(j - 1, 0, field);
              });
            },
            duplicateEmbedField: (i: number, j: number) => {
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                const field = embed.fields && embed.fields[j];
                if (!field) {
                  return;
                }
                embed.fields &&
                  embed.fields.splice(j + 1, 0, {
                    ...field,
                    id: getUniqueId(),
                  });
              });
            },
            clearEmbedFields: (i: number) =>
              set((state) => {
                const embed = state.embeds && state.embeds[i];
                if (!embed) {
                  return;
                }
                embed.fields = [];
              }),
            addRootComponent: (component: Component) =>
              set((state) => {
                if (!state.components) {
                  state.components = [component];
                } else {
                  state.components.push(component);
                }
              }),
            clearRootComponents: () =>
              set((state) => {
                for (const row of state.components) {
                  if (row.type !== 1) {
                    continue;
                  }

                  for (const comp of row.components) {
                    if (comp.type === 2) {
                      delete state.actions[comp.action_set_id];
                    } else if (comp.type === 3) {
                      for (const option of comp.options) {
                        delete state.actions[option.action_set_id];
                      }
                    }
                  }
                }

                state.components = [];
              }),
            moveRootComponentUp: (i: number) =>
              set((state) => {
                const component = state.components && state.components[i];
                if (!component) {
                  return;
                }
                state.components.splice(i, 1);
                state.components.splice(i - 1, 0, component);
              }),
            moveRootComponentDown: (i: number) =>
              set((state) => {
                const component = state.components && state.components[i];
                if (!component) {
                  return;
                }
                state.components.splice(i, 1);
                state.components.splice(i + 1, 0, component);
              }),
            duplicateRootComponent: (i: number) =>
              set((state) => {
                const component = state.components && state.components[i];
                if (!component) {
                  return;
                }

                if (component.type === 1) {
                  // This is a bit complex because we can't allow duplicated action set ids
                  const newRow: MessageComponentActionRow = {
                    id: getUniqueId(),
                    type: 1,
                    components: component.components.map((comp) => {
                      if (comp.type === 2) {
                        const actionId = getUniqueId().toString();
                        state.actions[actionId] = { actions: [] };
                        return { ...comp, action_set_id: actionId };
                      } else {
                        return {
                          ...comp,
                          options: comp.options.map((option) => {
                            const actionId = getUniqueId().toString();
                            state.actions[actionId] = { actions: [] };
                            return {
                              ...option,
                              action_set_id: actionId,
                            };
                          }),
                        };
                      }
                    }),
                  };

                  // TODO: change action set ids
                  state.components.splice(i + 1, 0, newRow);
                } else {
                  // TODO: Handle children for grid, etc.
                  state.components.splice(i + 1, 0, component);
                }
              }),
            deleteRootComponent: (i: number) =>
              set((state) => {
                const removed = state.components.splice(i, 1);

                for (const row of removed) {
                  if (row.type !== 1) {
                    continue;
                  }

                  for (const comp of row.components) {
                    if (comp.type === 2) {
                      delete state.actions[comp.action_set_id];
                    } else if (comp.type === 3) {
                      for (const option of comp.options) {
                        delete state.actions[option.action_set_id];
                      }
                    }
                  }
                }
              }),
            setRootComponentContent: (i: number, content: string) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root) {
                  return;
                }

                if (root.type === 10) {
                  root.content = content;
                }
              }),
            addSubComponent: (i: number, component: Component) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root) {
                  return;
                }

                if (component.type === 2 && root.type === 1) {
                  state.actions[component.action_set_id] = { actions: [] };

                  if (!root.components) {
                    root.components = [component];
                  } else {
                    root.components.push(component);
                  }
                }

                if (component.type === 10 && root.type === 9) {
                  if (!root.components) {
                    root.components = [component];
                  } else {
                    root.components.push(component);
                  }
                }
              }),
            clearSubComponents: (i: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }

                for (const child of root.components) {
                  if (child.type === 2) {
                    delete state.actions[child.action_set_id];
                  }
                }

                root.components = [];
              }),
            deleteSubComponent: (i: number, j: number) =>
              set((state) => {
                const root = state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }

                const removed = root.components.splice(j, 1);
                for (const child of removed) {
                  if (child.type === 2) {
                    delete state.actions[child.action_set_id];
                  }
                }
              }),
            moveSubComponentUp: (i: number, j: number) =>
              set((state) => {
                const root = state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const child = root.components[j];
                if (!child) {
                  return;
                }
                root.components.splice(j, 1);
                root.components.splice(j - 1, 0, child);
              }),
            moveSubComponentDown: (i: number, j: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const child = root.components[j];
                if (!child) {
                  return;
                }
                root.components.splice(j, 1);
                root.components.splice(j + 1, 0, child);
              }),
            duplicateSubComponent: (i: number, j: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const child = root.components && root.components[j];
                if (!child) {
                  return;
                }

                const actionId = getUniqueId().toString();
                state.actions[actionId] = state.actions[child.action_set_id];

                root.components.splice(j + 1, 0, {
                  ...child,
                  id: getUniqueId(),
                  action_set_id: actionId,
                });
              }),
            setSubComponentStyle: (
              i: number,
              j: number,
              style: MessageComponentButtonStyle
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const button = root.components && root.components[j];
                if (!button || button.type !== 2) {
                  return;
                }

                button.style = style;
                if (button.style === 5) {
                  button.url = "";
                  state.actions[button.action_set_id] = { actions: [] };
                }
              }),
            setSubComponentLabel: (i: number, j: number, label: string) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const button = root.components && root.components[j];
                if (!button || button.type !== 2) {
                  return;
                }
                button.label = label;
              }),
            setSubComponentEmoji: (
              i: number,
              j: number,
              emoji: Emoji | undefined
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const button = root.components && root.components[j];
                if (!button || button.type !== 2) {
                  return;
                }
                button.emoji = emoji;
              }),
            setSubComponentUrl: (i: number, j: number, url: string) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const button = root.components && root.components[j];
                if (!button || button.type !== 2 || button.style !== 5) {
                  return;
                }
                button.url = url;
              }),
            setSubComponentDisabled: (
              i: number,
              j: number,
              disabled: boolean | undefined
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const child = root.components && root.components[j];
                if (!child || (child.type !== 2 && child.type !== 3)) {
                  return;
                }
                child.disabled = disabled;
              }),
            setSubComponentPlaceholder: (
              i: number,
              j: number,
              placeholder: string | undefined
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                selectMenu.placeholder = placeholder;
              }),
            addSubComponentOption: (
              i: number,
              j: number,
              option: MessageComponentSelectMenuOption
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }

                state.actions[option.action_set_id] = { actions: [] };

                if (!selectMenu.options) {
                  selectMenu.options = [option];
                } else {
                  selectMenu.options.push(option);
                }
              }),
            clearSubComponentOptions: (i: number, j: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }

                for (const option of selectMenu.options) {
                  delete state.actions[option.action_set_id];
                }

                selectMenu.options = [];
              }),
            moveSubComponentOptionDown: (i: number, j: number, k: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }
                selectMenu.options.splice(k, 1);
                selectMenu.options.splice(k + 1, 0, option);
              }),
            moveSubComponentOptionUp: (i: number, j: number, k: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }
                selectMenu.options.splice(k, 1);
                selectMenu.options.splice(k - 1, 0, option);
              }),
            duplicateSubComponentOption: (i: number, j: number, k: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }

                const actionId = getUniqueId().toString();
                state.actions[actionId] = state.actions[option.action_set_id];

                selectMenu.options.splice(k + 1, 0, {
                  ...option,
                  id: getUniqueId(),
                  action_set_id: actionId,
                });
              }),
            deleteSubComponentOption: (i: number, j: number, k: number) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }

                const removed = selectMenu.options.splice(k, 1);
                for (const option of removed) {
                  delete state.actions[option.action_set_id];
                }
              }),
            setSubComponentOptionLabel: (
              i: number,
              j: number,
              k: number,
              label: string
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options && selectMenu.options[k];
                if (!option) {
                  return;
                }
                option.label = label;
              }),
            setSubComponentOptionDescription: (
              i: number,
              j: number,
              k: number,
              description: string | undefined
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options && selectMenu.options[k];
                if (!option) {
                  return;
                }
                option.description = description;
              }),
            setSubComponentOptionEmoji: (
              i: number,
              j: number,
              k: number,
              emoji: Emoji | undefined
            ) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const selectMenu = root.components && root.components[j];
                if (!selectMenu || selectMenu.type !== 3) {
                  return;
                }
                const option = selectMenu.options && selectMenu.options[k];
                if (!option) {
                  return;
                }
                option.emoji = emoji;
              }),
            setSubComponentContent: (i: number, j: number, content: string) =>
              set((state) => {
                const root = state.components && state.components[i];
                if (!root || (root.type !== 9 && root.type !== 1)) {
                  return;
                }
                const child = root.components && root.components[j];
                if (!child) {
                  return;
                }
                if (child.type !== 10) {
                  return;
                }
                child.content = content;
              }),
            addAction: (id: string, action: MessageAction) =>
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  actionSet.actions.push(action);
                } else {
                  state.actions[id] = { actions: [action] };
                }
              }),
            clearActions: (id: string) =>
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  actionSet.actions = [];
                }
              }),
            deleteAction: (id: string, i: number) =>
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  actionSet.actions.splice(i, 1);
                }
              }),
            moveActionUp: (id: string, i: number) =>
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  const action = actionSet.actions[i];
                  if (action) {
                    actionSet.actions.splice(i, 1);
                    actionSet.actions.splice(i - 1, 0, action);
                  }
                }
              }),
            moveActionDown: (id: string, i: number) => {
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  const action = actionSet.actions[i];
                  if (action) {
                    actionSet.actions.splice(i, 1);
                    actionSet.actions.splice(i + 1, 0, action);
                  }
                }
              });
            },
            duplicateAction: (id: string, i: number) => {
              set((state) => {
                const actionSet = state.actions[id];
                if (actionSet) {
                  const action = actionSet.actions[i];
                  if (action) {
                    actionSet.actions.splice(i + 1, 0, {
                      ...action,
                      id: getUniqueId(),
                    });
                  }
                }
              });
            },
            setActionType: (id: string, i: number, type: number) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];

                if (type === 1 || type === 6 || type === 8) {
                  actionSet.actions[i] = {
                    type,
                    id: action.id,
                    text: "",
                    public: false,
                  };
                } else if (type === 5 || type === 7 || type === 9) {
                  actionSet.actions[i] = {
                    type,
                    id: action.id,
                    target_id: "",
                    public: false,
                  };
                } else if (type === 2 || type === 3 || type === 4) {
                  actionSet.actions[i] = {
                    type,
                    id: action.id,
                    target_id: "",
                    public: false,
                    disable_default_response: false,
                  };
                } else if (type === 10) {
                  actionSet.actions[i] = {
                    type,
                    id: action.id,
                    permissions: "0",
                    role_ids: [],
                    disable_default_response: false,
                  };
                }
              }),
            setActionText: (id: string, i: number, text: string) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (
                  action.type === 1 ||
                  action.type === 6 ||
                  action.type === 8
                ) {
                  action.text = text;
                } else if (
                  action.type === 10 &&
                  action.disable_default_response
                ) {
                  action.text = text;
                }
              }),
            setActionTargetId: (id: string, i: number, target: string) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (
                  action.type === 2 ||
                  action.type === 3 ||
                  action.type === 4 ||
                  action.type === 5 ||
                  action.type === 7 ||
                  action.type === 9
                ) {
                  action.target_id = target;
                }
              }),
            setActionPublic: (id: string, i: number, val: boolean) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (action.type !== 10) {
                  action.public = val;
                }
              }),
            setActionDisableDefaultResponse: (
              id: string,
              i: number,
              val: boolean
            ) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (
                  action.type === 2 ||
                  action.type === 3 ||
                  action.type === 4 ||
                  action.type === 10
                ) {
                  action.disable_default_response = val;
                }
              }),
            setActionPermissions: (id: string, i: number, val: string) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (action.type === 10) {
                  action.permissions = val;
                }
              }),
            setActionRoleIds: (id: string, i: number, val: string[]) =>
              set((state) => {
                const actionSet = state.actions[id];
                const action = actionSet.actions[i];
                if (action.type === 10) {
                  action.role_ids = val;
                }
              }),

            getSelectMenu: (i: number, j: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || row.type !== 1) {
                return null;
              }

              const selectMenu = row.components && row.components[j];
              if (selectMenu && selectMenu.type === 3) {
                return selectMenu;
              }
              return null;
            },

            getSubComponents: (i: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || (row.type !== 1 && row.type !== 9)) {
                return [];
              }
              return row.components || [];
            },

            getSubComponent: (i: number, j: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || (row.type !== 1 && row.type !== 9)) {
                return null;
              }
              return row.components && row.components[j];
            },

            getButton: (i: number, j: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || row.type !== 1) {
                return null;
              }

              const button = row.components && row.components[j];
              if (button && button.type === 2) {
                return button;
              }
              return null;
            },

            getComponentsV2Enabled: () => {
              const state = get();
              const flags = state.flags ?? 0;
              return (flags & (1 << 15)) !== 0;
            },
            setComponentsV2Enabled: (enabled: boolean) => {
              if (enabled) {
                set({
                  content: "",
                  embeds: [],
                  actions: {},
                  components: [],
                  flags: 1 << 15,
                });
              } else {
                set(defaultMessage);
              }
            },
          }),
          {
            limit: 10,
            handleSet: (handleSet) => debounce(handleSet, 1000, true),
          }
        ),
        { name: key, version: 0 }
      )
    )
  );

export const useCurrentMessageStore = createMessageStore("current-message");

export const useCurrentMessageUndoStore = <T>(
  selector: (state: TemporalState<MessageStore>) => T
) => useStore(useCurrentMessageStore.temporal, selector);
