import debounce from "just-debounce-it";
import { TemporalState, temporal } from "zundo";
import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  EmbedField,
  Message,
  MessageAction,
  MessageComponent,
  MessageComponentActionRow,
  MessageComponentButton,
  MessageComponentContainer,
  MessageComponentContainerSubComponent,
  MessageComponentFile,
  MessageComponentMediaGallery,
  MessageComponentMediaGalleryItem,
  MessageComponentSection,
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
  MessageComponentSeparator,
  MessageComponentTextDisplay,
  MessageEmbed,
} from "../discord/schema";
import { getUniqueId } from "../util";

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
  duplicateComponent: (i: number) => void;
  updateComponent: (i: number, data: Partial<MessageComponent>) => void;
  getActionRow: (i: number) => MessageComponentActionRow | null;
  addActionRowComponent: (
    i: number,
    component: MessageComponentButton | MessageComponentSelectMenu
  ) => void;
  moveActionRowComponentDown: (i: number, j: number) => void;
  moveActionRowComponentUp: (i: number, j: number) => void;
  deleteActionRowComponent: (i: number, j: number) => void;
  clearActionRowComponents: (i: number) => void;
  duplicateActionRowComponent: (i: number, j: number) => void;
  updateActionRowComponent: (
    i: number,
    j: number,
    data: Partial<MessageComponentButton | MessageComponentSelectMenu>
  ) => void;

  getActionRowButton: (i: number, j: number) => MessageComponentButton | null;

  getActionRowSelectMenu: (
    i: number,
    j: number
  ) => MessageComponentSelectMenu | null;
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
  updateSection: (i: number, data: Partial<MessageComponentSection>) => void;
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
  updateSectionComponent: (
    i: number,
    j: number,
    data: Partial<MessageComponentTextDisplay>
  ) => void;
  duplicateSectionComponent: (i: number, j: number) => void;

  getGallery: (i: number) => MessageComponentMediaGallery | null;
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
  getFile: (i: number) => MessageComponentFile | null;
  getSeparator: (i: number) => MessageComponentSeparator | null;

  getContainer: (i: number) => MessageComponentContainer | null;
  updateContainer: (
    i: number,
    data: Partial<MessageComponentContainer>
  ) => void;
  addContainerComponent: (
    i: number,
    component: MessageComponentContainerSubComponent
  ) => void;
  clearContainerComponents: (i: number) => void;
  moveContainerComponentDown: (i: number, j: number) => void;
  moveContainerComponentUp: (i: number, j: number) => void;
  deleteContainerComponent: (i: number, j: number) => void;
  updateContainerComponent: (
    i: number,
    j: number,
    data: Partial<MessageComponentContainerSubComponent>
  ) => void;
  duplicateContainerComponent: (i: number, j: number) => void;

  addContainerActionRowComponent: (
    c: number,
    a: number,
    component: MessageComponentButton | MessageComponentSelectMenu
  ) => void;
  clearContainerRowActionComponents: (c: number, a: number) => void;
  moveContainerActionRowComponentUp: (c: number, a: number, k: number) => void;
  moveContainerActionRowComponentDown: (
    c: number,
    a: number,
    k: number
  ) => void;
  deleteContainerActionRowComponent: (c: number, a: number, k: number) => void;
  duplicateContainerActionRowComponent: (
    c: number,
    a: number,
    k: number
  ) => void;
  updateContainerActionRowComponent: (
    c: number,
    a: number,
    k: number,
    data: Partial<MessageComponentButton | MessageComponentSelectMenu>
  ) => void;
  addContainerActionRowSelectMenuOption: (
    c: number,
    a: number,
    k: number
  ) => void;
  updateContainerActionRowSelectMenuOption: (
    c: number,
    a: number,
    k: number,
    o: number,
    data: Partial<MessageComponentSelectMenuOption>
  ) => void;
  duplicateContainerActionRowSelectMenuOption: (
    c: number,
    a: number,
    k: number,
    o: number
  ) => void;
  moveContainerActionRowSelectMenuOptionUp: (
    c: number,
    a: number,
    k: number,
    o: number
  ) => void;
  moveContainerActionRowSelectMenuOptionDown: (
    c: number,
    a: number,
    k: number,
    o: number
  ) => void;
  removeContainerActionRowSelectMenuOption: (
    c: number,
    a: number,
    k: number,
    o: number
  ) => void;
  clearContainerActionRowSelectMenuOptions: (
    c: number,
    a: number,
    k: number
  ) => void;

  addContainerSectionComponent: (
    i: number,
    j: number,
    component: MessageComponentTextDisplay
  ) => void;
  clearContainerSectionComponents: (i: number, j: number) => void;
  moveContainerSectionComponentUp: (i: number, j: number, k: number) => void;
  moveContainerSectionComponentDown: (i: number, j: number, k: number) => void;
  deleteContainerSectionComponent: (i: number, j: number, k: number) => void;
  updateContainerSectionComponent: (
    i: number,
    j: number,
    k: number,
    data: Partial<MessageComponentContainerSubComponent>
  ) => void;
  duplicateContainerSectionComponent: (i: number, j: number, k: number) => void;

  addContainerMediaGalleryItem: (
    i: number,
    j: number,
    component: MessageComponentMediaGalleryItem
  ) => void;
  clearContainerMediaGalleryItems: (i: number, j: number) => void;
  moveContainerMediaGalleryItemUp: (i: number, j: number, k: number) => void;
  moveContainerMediaGalleryItemDown: (i: number, j: number, k: number) => void;
  deleteContainerMediaGalleryItem: (i: number, j: number, k: number) => void;
  updateContainerMediaGalleryItem: (
    i: number,
    j: number,
    k: number,
    data: Partial<MessageComponentMediaGalleryItem>
  ) => void;
  duplicateContainerMediaGalleryItem: (i: number, j: number, k: number) => void;

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
                  // TODO: Handle other container types
                  if (row.type === 1) {
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
                  // TODO: Handle other container types
                  if (row.type === 1) {
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
                }
              }),
            duplicateComponent: (i: number) =>
              set((state) => {
                const component = state.components[i];
                if (!component) {
                  return;
                }

                let newComponent: MessageComponent;

                if (component.type === 1) {
                  newComponent = {
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
                } else if (component.type === 9) {
                  const accessory = { ...component.accessory };
                  if (accessory.type === 2) {
                    const actionId = getUniqueId().toString();
                    state.actions[actionId] = { actions: [] };
                    accessory.action_set_id = actionId;
                  }

                  newComponent = {
                    ...component,
                    id: getUniqueId(),
                    accessory: accessory,
                  };
                } else {
                  newComponent = {
                    ...component,
                    id: getUniqueId(),
                  };
                }

                state.components.splice(i + 1, 0, newComponent);
              }),
            updateComponent: (i: number, data: Partial<MessageComponent>) =>
              set((state) => {
                const component = state.components[i];
                if (!component) {
                  return;
                }
                Object.assign(component, data);
              }),

            getActionRow: (i: number) => {
              const state = get();
              const row = state.components && state.components[i];
              if (!row || row.type !== 1) {
                return null;
              }
              return row;
            },
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
                const removed = row.components.splice(j, 1);
                for (const comp of removed) {
                  if (comp.type === 2) {
                    delete state.actions[comp.action_set_id];
                  } else if (comp.type === 3) {
                    for (const option of comp.options) {
                      delete state.actions[option.action_set_id];
                    }
                  }
                }
              }),
            clearActionRowComponents: (i: number) =>
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                for (const comp of row.components) {
                  if (comp.type === 2) {
                    delete state.actions[comp.action_set_id];
                  }
                }
                row.components = [];
              }),
            duplicateActionRowComponent: (i: number, j: number) =>
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
            updateActionRowComponent: (
              i: number,
              j: number,
              data: Partial<MessageComponentButton | MessageComponentSelectMenu>
            ) => {
              set((state) => {
                const row = state.components && state.components[i];
                if (!row || row.type !== 1) {
                  return;
                }
                const component = row.components[j];
                if (!component) {
                  return;
                }
                Object.assign(component, data);
              });
            },

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
            updateSection: (
              i: number,
              data: Partial<MessageComponentSection>
            ) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                Object.assign(section, data);
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
            updateSectionComponent: (
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
                if (!component) {
                  return;
                }
                Object.assign(component, data);
              }),
            duplicateSectionComponent: (i: number, j: number) =>
              set((state) => {
                const section = state.components && state.components[i];
                if (!section || section.type !== 9) {
                  return;
                }
                const component = section.components && section.components[j];
                if (!component) {
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

            getFile: (i: number) => {
              const state = get();
              const file = state.components && state.components[i];
              if (!file || file.type !== 13) {
                return null;
              }
              return file;
            },

            getSeparator: (i: number) => {
              const state = get();
              const separator = state.components && state.components[i];
              if (!separator || separator.type !== 14) {
                return null;
              }
              return separator;
            },

            getContainer: (i: number) => {
              const state = get();
              const container = state.components && state.components[i];
              if (!container || container.type !== 17) {
                return null;
              }
              return container;
            },

            updateContainer: (
              i: number,
              data: Partial<MessageComponentContainer>
            ) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (!container || container.type !== 17) {
                  return;
                }
                Object.assign(container, data);
              }),
            addContainerComponent: (
              i: number,
              component: MessageComponentContainerSubComponent
            ) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (!container || container.type !== 17) {
                  return;
                }
                if (!container.components) {
                  container.components = [component];
                } else {
                  container.components.push(component);
                }
              }),
            clearContainerComponents: (i: number) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (!container || container.type !== 17) {
                  return;
                }
                container.components = [];
              }),
            moveContainerComponentDown: (i: number, j: number) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (
                  !container ||
                  container.type !== 17 ||
                  !container.components
                ) {
                  return;
                }
                const component = container.components[j];
                if (!component) {
                  return;
                }
                container.components.splice(j, 1);
                container.components.splice(j + 1, 0, component);
              }),
            moveContainerComponentUp: (i: number, j: number) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (
                  !container ||
                  container.type !== 17 ||
                  !container.components
                ) {
                  return;
                }
                const component = container.components[j];
                if (!component) {
                  return;
                }
                container.components.splice(j, 1);
                container.components.splice(j - 1, 0, component);
              }),
            deleteContainerComponent: (i: number, j: number) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (
                  !container ||
                  container.type !== 17 ||
                  !container.components
                ) {
                  return;
                }
                container.components.splice(j, 1);
              }),
            updateContainerComponent: (
              i: number,
              j: number,
              data: Partial<MessageComponentContainerSubComponent>
            ) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (
                  !container ||
                  container.type !== 17 ||
                  !container.components
                ) {
                  return;
                }
                const component = container.components[j];
                if (!component) {
                  return;
                }
                Object.assign(component, data);
              }),
            duplicateContainerComponent: (i: number, j: number) =>
              set((state) => {
                const container = state.components && state.components[i];
                if (
                  !container ||
                  container.type !== 17 ||
                  !container.components
                ) {
                  return;
                }
                // TODO: update action set ids
                const component = container.components[j];
                if (!component) {
                  return;
                }
                const newComponent = { ...component, id: getUniqueId() };
                container.components.splice(j + 1, 0, newComponent);
              }),

            addContainerActionRowComponent: (c, a, component) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    actionRow.components.push(component);
                  }
                }
              }),

            clearContainerRowActionComponents: (c, a) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    actionRow.components = [];
                  }
                }
              }),

            moveContainerActionRowComponentUp: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1 && k > 0) {
                    const component = actionRow.components[k];
                    actionRow.components[k] = actionRow.components[k - 1];
                    actionRow.components[k - 1] = component;
                  }
                }
              }),

            moveContainerActionRowComponentDown: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (
                    actionRow?.type === 1 &&
                    k < actionRow.components.length - 1
                  ) {
                    const component = actionRow.components[k];
                    actionRow.components[k] = actionRow.components[k + 1];
                    actionRow.components[k + 1] = component;
                  }
                }
              }),

            deleteContainerActionRowComponent: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    actionRow.components.splice(k, 1);
                  }
                }
              }),

            duplicateContainerActionRowComponent: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const component = actionRow.components[k];
                    // TODO: handle select menus
                    if (component.type === 2) {
                      actionRow.components.splice(k + 1, 0, {
                        ...component,
                        id: getUniqueId(),
                        action_set_id: getUniqueId().toString(),
                      });
                    }
                  }
                }
              }),

            updateContainerActionRowComponent: (c, a, k, data) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    Object.assign(actionRow.components[k], data);
                  }
                }
              }),

            addContainerActionRowSelectMenuOption: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3) {
                      selectMenu.options.push({
                        id: getUniqueId(),
                        label: "",
                        action_set_id: getUniqueId().toString(),
                      });
                    }
                  }
                }
              }),

            updateContainerActionRowSelectMenuOption: (c, a, k, o, data) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3) {
                      selectMenu.options[o] = {
                        ...selectMenu.options[o],
                        ...data,
                      };
                    }
                  }
                }
              }),

            duplicateContainerActionRowSelectMenuOption: (c, a, k, o) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3) {
                      const option = selectMenu.options[o];
                      selectMenu.options.splice(o + 1, 0, {
                        ...option,
                        id: getUniqueId(),
                        action_set_id: getUniqueId().toString(),
                      });
                    }
                  }
                }
              }),

            moveContainerActionRowSelectMenuOptionUp: (c, a, k, o) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3 && o > 0) {
                      const option = selectMenu.options[o];
                      selectMenu.options[o] = selectMenu.options[o - 1];
                      selectMenu.options[o - 1] = option;
                    }
                  }
                }
              }),

            moveContainerActionRowSelectMenuOptionDown: (c, a, k, o) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (
                      selectMenu?.type === 3 &&
                      o < selectMenu.options.length - 1
                    ) {
                      const option = selectMenu.options[o];
                      selectMenu.options[o] = selectMenu.options[o + 1];
                      selectMenu.options[o + 1] = option;
                    }
                  }
                }
              }),

            removeContainerActionRowSelectMenuOption: (c, a, k, o) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3) {
                      selectMenu.options.splice(o, 1);
                    }
                  }
                }
              }),

            clearContainerActionRowSelectMenuOptions: (c, a, k) =>
              set((state) => {
                const container = state.components[c];
                if (container?.type === 17) {
                  const actionRow = container.components[a];
                  if (actionRow?.type === 1) {
                    const selectMenu = actionRow.components[k];
                    if (selectMenu?.type === 3) {
                      selectMenu.options = [];
                    }
                  }
                }
              }),

            addContainerSectionComponent: (i, j, component) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9) {
                    section.components.push(component);
                  }
                }
              }),

            clearContainerSectionComponents: (i, j) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9) {
                    section.components = [];
                  }
                }
              }),

            moveContainerSectionComponentUp: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9 && k > 0) {
                    const component = section.components[k];
                    section.components[k] = section.components[k - 1];
                    section.components[k - 1] = component;
                  }
                }
              }),

            moveContainerSectionComponentDown: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (
                    section?.type === 9 &&
                    k < section.components.length - 1
                  ) {
                    const component = section.components[k];
                    section.components[k] = section.components[k + 1];
                    section.components[k + 1] = component;
                  }
                }
              }),

            deleteContainerSectionComponent: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9) {
                    section.components.splice(k, 1);
                  }
                }
              }),

            updateContainerSectionComponent: (i, j, k, data) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9) {
                    const component = section.components[k];
                    if (component) {
                      Object.assign(component, data);
                    }
                  }
                }
              }),

            duplicateContainerSectionComponent: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const section = container.components[j];
                  if (section?.type === 9) {
                    const component = section.components[k];
                    if (component) {
                      const newComponent = { ...component, id: getUniqueId() };
                      section.components.splice(k + 1, 0, newComponent);
                    }
                  }
                }
              }),

            addContainerMediaGalleryItem: (i, j, component) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12) {
                    gallery.items.push(component);
                  }
                }
              }),

            clearContainerMediaGalleryItems: (i, j) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12) {
                    gallery.items = [];
                  }
                }
              }),

            moveContainerMediaGalleryItemUp: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12 && k > 0) {
                    const item = gallery.items[k];
                    gallery.items[k] = gallery.items[k - 1];
                    gallery.items[k - 1] = item;
                  }
                }
              }),

            moveContainerMediaGalleryItemDown: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12 && k < gallery.items.length - 1) {
                    const item = gallery.items[k];
                    gallery.items[k] = gallery.items[k + 1];
                    gallery.items[k + 1] = item;
                  }
                }
              }),

            deleteContainerMediaGalleryItem: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12) {
                    gallery.items.splice(k, 1);
                  }
                }
              }),

            updateContainerMediaGalleryItem: (i, j, k, data) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12) {
                    const item = gallery.items[k];
                    if (item) {
                      Object.assign(item, data);
                    }
                  }
                }
              }),

            duplicateContainerMediaGalleryItem: (i, j, k) =>
              set((state) => {
                const container = state.components[i];
                if (container?.type === 17) {
                  const gallery = container.components[j];
                  if (gallery?.type === 12) {
                    const item = gallery.items[k];
                    if (item) {
                      const newItem = { ...item, id: getUniqueId() };
                      gallery.items.splice(k + 1, 0, newItem);
                    }
                  }
                }
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
