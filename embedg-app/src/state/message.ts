import { create } from "zustand";
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
} from "../discord/schema";
import { getUniqueId } from "../util";

export interface MessageStore extends Message {
  clear(): void;
  replace(message: Message): void;
  setContent: (content: string) => void;
  setUsername: (username: string | undefined) => void;
  setAvatarUrl: (avatar_url: string | undefined) => void;
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
  addComponentRow: (row: MessageComponentActionRow) => void;
  clearComponentRows: () => void;
  moveComponentRowUp: (i: number) => void;
  moveComponentRowDown: (i: number) => void;
  duplicateComponentRow: (i: number) => void;
  deleteComponentRow: (i: number) => void;
  addButton: (i: number, button: MessageComponentButton) => void;
  clearButtons: (i: number) => void;
  moveButtonDown: (i: number, j: number) => void;
  moveButtonUp: (i: number, j: number) => void;
  duplicateButton: (i: number, j: number) => void;
  deleteButton: (i: number, j: number) => void;
  setButtonStyle: (
    i: number,
    j: number,
    style: MessageComponentButtonStyle
  ) => void;
  setButtonLabel: (i: number, j: number, label: string) => void;
  setButtonEmoji: (i: number, j: number, emoji: Emoji | undefined) => void;
  setButtonUrl: (i: number, j: number, url: string) => void;
  setSelectMenuPlaceholder: (
    i: number,
    j: number,
    placeholder: string | undefined
  ) => void;
  addSelectMenuOption: (
    i: number,
    j: number,
    option: MessageComponentSelectMenuOption
  ) => void;
  clearSelectMenuOptions: (i: number, j: number) => void;
  moveSelectMenuOptionDown: (i: number, j: number, k: number) => void;
  moveSelectMenuOptionUp: (i: number, j: number, k: number) => void;
  duplicateSelectMenuOption: (i: number, j: number, k: number) => void;
  deleteSelectMenuOption: (i: number, j: number, k: number) => void;
  setSelectMenuOptionLabel: (
    i: number,
    j: number,
    k: number,
    label: string
  ) => void;
  setSelectMenuOptionDescription: (
    i: number,
    j: number,
    k: number,
    description: string | undefined
  ) => void;
  setSelectMenuOptionEmoji: (
    i: number,
    j: number,
    k: number,
    emoji: Emoji | null
  ) => void;
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

  getSelectMenu: (i: number, j: number) => MessageComponentSelectMenu | null;
  getButton: (i: number, j: number) => MessageComponentButton | null;
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
        (set, get) => ({
          ...defaultMessage,

          clear: () => set(defaultMessage),
          replace: (message: Message) => set(message),
          setContent: (content: string) => set({ content }),
          setUsername: (username: string | undefined) => set({ username }),
          setAvatarUrl: (avatar_url: string | undefined) => set({ avatar_url }),
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
          setEmbedDescription: (i: number, description: string | undefined) => {
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
          setEmbedFooterIconUrl: (i: number, icon_url: string | undefined) => {
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
                embed.fields.splice(j + 1, 0, { ...field, id: getUniqueId() });
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
          addComponentRow: (row: MessageComponentActionRow) =>
            set((state) => {
              if (!state.components) {
                state.components = [row];
              } else {
                state.components.push(row);
              }
            }),
          clearComponentRows: () =>
            set((state) => {
              for (const row of state.components) {
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
          moveComponentRowUp: (i: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              state.components.splice(i, 1);
              state.components.splice(i - 1, 0, row);
            }),
          moveComponentRowDown: (i: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              state.components.splice(i, 1);
              state.components.splice(i + 1, 0, row);
            }),
          duplicateComponentRow: (i: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }

              // This is a bit complex because we can't allow duplicated action set ids
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

              // TODO: change action set ids
              state.components.splice(i + 1, 0, newRow);
            }),
          deleteComponentRow: (i: number) =>
            set((state) => {
              const removed = state.components.splice(i, 1);

              for (const row of removed) {
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
          addButton: (i: number, button: MessageComponentButton) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }

              state.actions[button.action_set_id] = { actions: [] };

              if (!row.components) {
                row.components = [button];
              } else {
                row.components.push(button);
              }
            }),
          clearButtons: (i: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }

              for (const button of row.components) {
                if (button.type === 2) {
                  delete state.actions[button.action_set_id];
                }
              }

              row.components = [];
            }),
          deleteButton: (i: number, j: number) =>
            set((state) => {
              const row = state.components[i];
              if (!row) {
                return;
              }

              const removed = row.components.splice(j, 1);
              for (const button of removed) {
                if (button.type === 2) {
                  delete state.actions[button.action_set_id];
                }
              }
            }),
          moveButtonUp: (i: number, j: number) =>
            set((state) => {
              const row = state.components[i];
              if (!row) {
                return;
              }
              const button = row.components[j];
              if (!button) {
                return;
              }
              row.components.splice(j, 1);
              row.components.splice(j - 1, 0, button);
            }),
          moveButtonDown: (i: number, j: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const button = row.components[j];
              if (!button) {
                return;
              }
              row.components.splice(j, 1);
              row.components.splice(j + 1, 0, button);
            }),
          duplicateButton: (i: number, j: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
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
          setButtonStyle: (
            i: number,
            j: number,
            style: MessageComponentButtonStyle
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const button = row.components && row.components[j];
              if (!button || button.type !== 2) {
                return;
              }

              button.style = style;
              if (button.style === 5) {
                button.url = "";
                state.actions[button.action_set_id] = { actions: [] };
              }
            }),
          setButtonLabel: (i: number, j: number, label: string) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const button = row.components && row.components[j];
              if (!button || button.type !== 2) {
                return;
              }
              button.label = label;
            }),
          setButtonEmoji: (i: number, j: number, emoji: Emoji | undefined) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const button = row.components && row.components[j];
              if (!button || button.type !== 2) {
                return;
              }
              button.emoji = emoji;
            }),
          setButtonUrl: (i: number, j: number, url: string) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const button = row.components && row.components[j];
              if (!button || button.type !== 2 || button.style !== 5) {
                return;
              }
              button.url = url;
            }),
          setSelectMenuPlaceholder: (
            i: number,
            j: number,
            placeholder: string | undefined
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }
              selectMenu.placeholder = placeholder;
            }),
          addSelectMenuOption: (
            i: number,
            j: number,
            option: MessageComponentSelectMenuOption
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
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
          clearSelectMenuOptions: (i: number, j: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }

              for (const option of selectMenu.options) {
                delete state.actions[option.action_set_id];
              }

              selectMenu.options = [];
            }),
          moveSelectMenuOptionDown: (i: number, j: number, k: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
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
          moveSelectMenuOptionUp: (i: number, j: number, k: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
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
          duplicateSelectMenuOption: (i: number, j: number, k: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
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
          deleteSelectMenuOption: (i: number, j: number, k: number) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }

              const removed = selectMenu.options.splice(k, 1);
              for (const option of removed) {
                delete state.actions[option.action_set_id];
              }
            }),
          setSelectMenuOptionLabel: (
            i: number,
            j: number,
            k: number,
            label: string
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }
              const option = selectMenu.options && selectMenu.options[k];
              if (!option) {
                return;
              }
              option.label = label;
            }),
          setSelectMenuOptionDescription: (
            i: number,
            j: number,
            k: number,
            description: string | undefined
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }
              const option = selectMenu.options && selectMenu.options[k];
              if (!option) {
                return;
              }
              option.description = description;
            }),
          setSelectMenuOptionEmoji: (
            i: number,
            j: number,
            k: number,
            emoji: Emoji | null
          ) =>
            set((state) => {
              const row = state.components && state.components[i];
              if (!row) {
                return;
              }
              const selectMenu = row.components && row.components[j];
              if (!selectMenu || selectMenu.type !== 3) {
                return;
              }
              const option = selectMenu.options && selectMenu.options[k];
              if (!option) {
                return;
              }
              option.emoji = emoji;
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
              } else if (
                type === 2 ||
                type === 3 ||
                type === 4 ||
                type === 5 ||
                type === 7 ||
                type === 9
              ) {
                actionSet.actions[i] = {
                  type,
                  id: action.id,
                  target_id: "",
                  public: false,
                };
              }
            }),
          setActionText: (id: string, i: number, text: string) =>
            set((state) => {
              const actionSet = state.actions[id];
              const action = actionSet.actions[i];
              if (action.type === 1 || action.type === 6 || action.type === 8) {
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
              action.public = val;
            }),

          getSelectMenu: (i: number, j: number) => {
            const state = get();
            const row = state.components && state.components[i];
            if (!row) {
              return null;
            }

            const selectMenu = row.components && row.components[j];
            if (selectMenu && selectMenu.type === 3) {
              return selectMenu;
            }
            return null;
          },
          getButton: (i: number, j: number) => {
            const state = get();
            const row = state.components && state.components[i];
            if (!row) {
              return null;
            }

            const button = row.components && row.components[j];
            if (button && button.type === 2) {
              return button;
            }
            return null;
          },
        }),
        { name: key, version: 0 }
      )
    )
  );

export const useCurrentMessageStore = createMessageStore("current-message");
