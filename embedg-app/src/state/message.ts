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
  MessageComponent,
  MessageComponentTextDisplay,
  MessageComponentSection,
  MessageComponentSeparator,
  MessageComponentFile,
  MessageComponentMediaGallery,
  MessageComponentMediaGalleryItem,
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

  addComponent: (component: MessageComponent) => void;
  moveComponentDown: (i: number) => void;
  moveComponentUp: (i: number) => void;
  deleteComponent: (i: number) => void;
  clearComponents: () => void;

  getActionRow: (i: number) => MessageComponentActionRow | null;
  duplicateActionRow: (i: number) => void;
  addActionRowComponent: (
    i: number,
    component: MessageComponentButton | MessageComponentSelectMenu
  ) => void;
  moveActionRowComponentDown: (i: number, j: number) => void;
  moveActionRowComponentUp: (i: number, j: number) => void;
  deleteActionRowComponent: (i: number, j: number) => void;
  clearActionRowComponents: (i: number) => void;

  getActionRowButton: (i: number, j: number) => MessageComponentButton | null;
  updateActionRowButton: (
    i: number,
    j: number,
    button: Partial<MessageComponentButton>
  ) => void;
  duplicateActionRowButton: (i: number, j: number) => void;

  getActionRowSelectMenu: (
    i: number,
    j: number
  ) => MessageComponentSelectMenu | null;
  updateActionRowSelectMenu: (
    i: number,
    j: number,
    menu: Partial<MessageComponentSelectMenu>
  ) => void;
  addActionRowSelectMenuOption: (
    i: number,
    j: number,
    option: MessageComponentSelectMenuOption
  ) => void;
  clearActionRowSelectMenuOptions: (i: number, j: number) => void;
  moveActionRowSelectMenuOptionDown: (i: number, j: number, k: number) => void;
  moveActionRowSelectMenuOptionUp: (i: number, j: number, k: number) => void;
  duplicateActionRowSelectMenuOption: (i: number, j: number, k: number) => void;
  deleteActionRowSelectMenuOption: (i: number, j: number, k: number) => void;
  updateActionRowSelectMenuOption: (
    i: number,
    j: number,
    k: number,
    option: Partial<MessageComponentSelectMenuOption>
  ) => void;

  getSection: (i: number) => MessageComponentSection | null;
  duplicateSection: (i: number) => void;
  addSectionComponent: (
    i: number,
    component: MessageComponentTextDisplay
  ) => void;
  clearSectionComponents: (i: number) => void;
  moveSectionComponentDown: (i: number, j: number) => void;
  moveSectionComponentUp: (i: number, j: number) => void;
  deleteSectionComponent: (i: number, j: number) => void;

  getSectionTextDisplay: (
    i: number,
    j: number
  ) => MessageComponentTextDisplay | null;
  updateSectionTextDisplay: (
    i: number,
    j: number,
    data: Partial<MessageComponentTextDisplay>
  ) => void;
  duplicateSectionTextDisplay: (i: number, j: number) => void;

  getGallery: (i: number) => MessageComponentMediaGallery | null;
  duplicateGallery: (i: number) => void;
  addGalleryItem: (i: number, item: MessageComponentMediaGalleryItem) => void;
  clearGalleryItems: (i: number) => void;
  moveGalleryItemDown: (i: number, j: number) => void;
  moveGalleryItemUp: (i: number, j: number) => void;
  deleteGalleryItem: (i: number, j: number) => void;

  getGalleryItem: (
    i: number,
    j: number
  ) => MessageComponentMediaGalleryItem | null;
  updateGalleryItem: (
    i: number,
    j: number,
    data: Partial<MessageComponentMediaGalleryItem>
  ) => void;
  duplicateGalleryItem: (i: number, j: number) => void;

  getTextDisplay: (i: number) => MessageComponentTextDisplay | null;
  updateTextDisplay: (
    i: number,
    data: Partial<MessageComponentTextDisplay>
  ) => void;
  duplicateTextDisplay: (i: number) => void;

  getFile: (i: number) => MessageComponentFile | null;
  updateFile: (i: number, data: Partial<MessageComponentFile>) => void;
  duplicateFile: (i: number) => void;

  getSeparator: (i: number) => MessageComponentSeparator | null;
  updateSeparator: (
    i: number,
    data: Partial<MessageComponentSeparator>
  ) => void;
  duplicateSeparator: (i: number) => void;

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

            addComponent: (component: MessageComponent) =>
              set((state) => {
                state.components.push(component);
              }),
            clearComponents: () =>
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
                state.actions = {};
              }),
            moveComponentUp: (i: number) =>
              set((state) => {
                const component = state.components && state.components[i];
                if (!component) {
                  return;
                }
                state.components.splice(i, 1);
                state.components.splice(i - 1, 0, component);
              }),
            moveComponentDown: (i: number) =>
              set((state) => {
                const component = state.components && state.components[i];
                if (!component) {
                  return;
                }
                state.components.splice(i, 1);
                state.components.splice(i + 1, 0, component);
              }),
            deleteComponent: (i: number) =>
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

            getActionRow: (i: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || row.type !== 1) {
                return null;
              }
              return row;
            },
            duplicateActionRow: (i: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }

                const newRow: MessageComponentActionRow = {
                  id: getUniqueId(),
                  type: 1,
                  components: row.components.map((comp) => {
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

                state.components.splice(i + 1, 0, newRow);
              }),
            addActionRowComponent: (
              i: number,
              component: MessageComponentButton | MessageComponentSelectMenu
            ) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                if (row.components) {
                  row.components.push(component);
                } else {
                  row.components = [component];
                }
              }),
            moveActionRowComponentDown: (i: number, j: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const component = row.components && row.components[j];
                if (!component) {
                  return;
                }
                row.components.splice(j, 1);
                row.components.splice(j + 1, 0, component);
              }),
            moveActionRowComponentUp: (i: number, j: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const component = row.components && row.components[j];
                if (!component) {
                  return;
                }
                row.components.splice(j, 1);
                row.components.splice(j - 1, 0, component);
              }),
            deleteActionRowComponent: (i: number, j: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                row.components.splice(j, 1);
              }),
            clearActionRowComponents: (i: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                row.components = [];
              }),

            getActionRowButton: (i: number, j: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || row.type !== 1) {
                return null;
              }
              const button = row.components && row.components[j];
              if (!button || button.type !== 2) {
                return null;
              }
              return button;
            },
            updateActionRowButton: (
              i: number,
              j: number,
              data: Partial<MessageComponentButton>
            ) => {
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const button = row.components && row.components[j];
                if (button && button.type === 2) {
                  Object.assign(button, data);
                }
              });
            },
            addActionRowButton: (i: number, button: MessageComponentButton) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                if (row.components) {
                  row.components.push(button);
                } else {
                  row.components = [button];
                }
              }),
            duplicateActionRowButton: (i: number, j: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const button = row.components && row.components[j];
                if (!button || button.type !== 2) {
                  return;
                }

                const actionId = getUniqueId().toString();
                state.actions[actionId] = state.actions[button.action_set_id];

                row.components.splice(j + 1, 0, {
                  ...button,
                  id: getUniqueId(),
                  action_set_id: actionId,
                });
              }),

            getActionRowSelectMenu: (i: number, j: number) => {
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
            updateActionRowSelectMenu: (
              i: number,
              j: number,
              data: Partial<MessageComponentSelectMenu>
            ) => {
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const selectMenu = row.components && row.components[j];
                if (selectMenu && selectMenu.type === 3) {
                  Object.assign(selectMenu, data);
                }
              });
            },
            addActionRowSelectMenuOption: (
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
            clearActionRowSelectMenuOptions: (i: number, j: number) =>
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
            moveActionRowSelectMenuOptionDown: (
              i: number,
              j: number,
              k: number
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
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }
                selectMenu.options.splice(k, 1);
                selectMenu.options.splice(k + 1, 0, option);
              }),
            moveActionRowSelectMenuOptionUp: (
              i: number,
              j: number,
              k: number
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
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }
                selectMenu.options.splice(k, 1);
                selectMenu.options.splice(k - 1, 0, option);
              }),
            duplicateActionRowSelectMenuOption: (
              i: number,
              j: number,
              k: number
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

            deleteActionRowSelectMenuOption: (
              i: number,
              j: number,
              k: number
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

                const removed = selectMenu.options.splice(k, 1);
                for (const option of removed) {
                  delete state.actions[option.action_set_id];
                }
              }),
            updateActionRowSelectMenuOption: (
              i: number,
              j: number,
              k: number,
              data: Partial<MessageComponentSelectMenuOption>
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
                const option = selectMenu.options[k];
                if (!option) {
                  return;
                }

                Object.assign(option, data);
              }),

            getSection: (i: number) => {
              const state = get();
              const section = state.components && state.components[i];
              if (!section || section.type !== 9) {
                return null;
              }
              return section;
            },
            duplicateSection: (i: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const newSection = { ...section, id: getUniqueId() };
                state.components.splice(i + 1, 0, newSection);
              }),
            addSectionComponent: (
              i: number,
              component: MessageComponentTextDisplay
            ) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                if (!section.components) {
                  section.components = [component];
                } else {
                  section.components.push(component);
                }
              }),
            clearSectionComponents: (i: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                section.components = [];
              }),
            moveSectionComponentDown: (i: number, j: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const component = section.components[j];
                if (!component) {
                  return;
                }
                section.components.splice(j, 1);
                section.components.splice(j + 1, 0, component);
              }),
            moveSectionComponentUp: (i: number, j: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const component = section.components[j];
                if (!component) {
                  return;
                }
                section.components.splice(j, 1);
                section.components.splice(j - 1, 0, component);
              }),
            deleteSectionComponent: (i: number, j: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                section.components.splice(j, 1);
              }),

            getSectionTextDisplay: (i: number, j: number) => {
              const state = get();
              const section = state.components && state.components[i];
              if (!section || section.type !== 9) {
                return null;
              }
              const component = section.components && section.components[j];
              if (!component || component.type !== 10) {
                return null;
              }
              return component;
            },
            updateSectionTextDisplay: (
              i: number,
              j: number,
              data: Partial<MessageComponentTextDisplay>
            ) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const component = section.components && section.components[j];
                if (!component || component.type !== 10) {
                  return;
                }
                Object.assign(component, data);
              }),
            duplicateSectionTextDisplay: (i: number, j: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const component = section.components && section.components[j];
                if (!component || component.type !== 10) {
                  return;
                }
                const newComponent = { ...component, id: getUniqueId() };
                section.components.splice(j + 1, 0, newComponent);
              }),

            getGallery: (i: number) => {
              const state = get();
              const gallery = state.components && state.components[i];
              if (!gallery || gallery.type !== 12) {
                return null;
              }
              return gallery;
            },
            duplicateGallery: (i: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 11) {
                  return;
                }
                const newGallery = { ...gallery, id: getUniqueId() };
                state.components.splice(i + 1, 0, newGallery);
              }),
            addGalleryItem: (
              i: number,
              item: MessageComponentMediaGalleryItem
            ) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12) {
                  return;
                }
                if (!gallery.items) {
                  gallery.items = [];
                }
                gallery.items.push({ ...item, id: getUniqueId() });
              }),
            clearGalleryItems: (i: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12) {
                  return;
                }
                gallery.items = [];
              }),
            moveGalleryItemDown: (i: number, j: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12 || !gallery.items) {
                  return;
                }
                if (j >= gallery.items.length - 1) {
                  return;
                }
                const temp = gallery.items[j];
                gallery.items[j] = gallery.items[j + 1];
                gallery.items[j + 1] = temp;
              }),
            moveGalleryItemUp: (i: number, j: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12 || !gallery.items) {
                  return;
                }
                if (j <= 0) {
                  return;
                }
                const temp = gallery.items[j];
                gallery.items[j] = gallery.items[j - 1];
                gallery.items[j - 1] = temp;
              }),
            deleteGalleryItem: (i: number, j: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12 || !gallery.items) {
                  return;
                }
                gallery.items.splice(j, 1);
              }),
            getGalleryItem: (i: number, j: number) => {
              const state = get();
              const gallery = state.components && state.components[i];
              if (!gallery || gallery.type !== 12 || !gallery.items) {
                return null;
              }
              return gallery.items[j] || null;
            },
            updateGalleryItem: (
              i: number,
              j: number,
              data: Partial<MessageComponentMediaGalleryItem>
            ) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12 || !gallery.items) {
                  return;
                }
                const item = gallery.items[j];
                if (!item) {
                  return;
                }
                Object.assign(item, data);
              }),
            duplicateGalleryItem: (i: number, j: number) =>
              set((state) => {
                const gallery = state.components && state.components[i];
                if (!gallery || gallery.type !== 12 || !gallery.items) {
                  return;
                }
                const item = gallery.items[j];
                if (!item) {
                  return;
                }
                const newItem = { ...item, id: getUniqueId() };
                gallery.items.splice(j + 1, 0, newItem);
              }),

            getTextDisplay: (i: number) => {
              const state = get();
              const display = state.components && state.components[i];
              if (!display || display.type !== 10) {
                return null;
              }
              return display;
            },
            updateTextDisplay: (
              i: number,
              data: Partial<MessageComponentTextDisplay>
            ) =>
              set((state) => {
                const display = state.components && state.components[i];
                if (!display || display.type !== 10) {
                  return;
                }
                Object.assign(display, data);
              }),
            duplicateTextDisplay: (i: number) =>
              set((state) => {
                const display = state.components && state.components[i];
                if (!display || display.type !== 10) {
                  return;
                }
                const newDisplay = { ...display, id: getUniqueId() };
                state.components.splice(i + 1, 0, newDisplay);
              }),

            getFile: (i: number) => {
              const state = get();
              const file = state.components && state.components[i];
              if (!file || file.type !== 13) {
                return null;
              }
              return file;
            },
            updateFile: (i: number, data: Partial<MessageComponentFile>) =>
              set((state) => {
                const file = state.components && state.components[i];
                if (!file || file.type !== 13) {
                  return;
                }
                Object.assign(file, data);
              }),
            duplicateFile: (i: number) =>
              set((state) => {
                const file = state.components && state.components[i];
                if (!file || file.type !== 13) {
                  return;
                }
                const newFile = { ...file, id: getUniqueId() };
                state.components.splice(i + 1, 0, newFile);
              }),

            getSeparator: (i: number) => {
              const state = get();
              const separator = state.components && state.components[i];
              if (!separator || separator.type !== 14) {
                return null;
              }
              return separator;
            },
            updateSeparator: (
              i: number,
              data: Partial<MessageComponentSeparator>
            ) =>
              set((state) => {
                const separator = state.components && state.components[i];
                if (!separator || separator.type !== 14) {
                  return;
                }
                Object.assign(separator, data);
              }),
            duplicateSeparator: (i: number) =>
              set((state) => {
                const separator = state.components && state.components[i];
                if (!separator || separator.type !== 14) {
                  return;
                }
                const newSeparator = { ...separator, id: getUniqueId() };
                state.components.splice(i + 1, 0, newSeparator);
              }),

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
