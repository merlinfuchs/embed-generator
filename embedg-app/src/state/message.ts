import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { EmbedField, Message, MessageEmbed } from "../discord/schema";
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
  setEmbedAuthorName: (i: number, name: string | undefined) => void;
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
}

const defaultMessage: Message = {
  username: undefined,
  avatar_url: undefined,
  content: "Hello World",
  tts: false,
  embeds: [
    {
      id: getUniqueId(),
      description: "This is an embed!",
      fields: [],
    },
  ],
  components: [],
};

export const emptyMessage: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [],
};

export const useCurrentMessageStore = create<MessageStore>()(
  immer(
    persist(
      (set) => ({
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
        setEmbedAuthorName: (i: number, name: string | undefined) =>
          set((state) => {
            const embed = state.embeds && state.embeds[i];
            if (!embed) {
              return;
            }
            if (!name) {
              if (!embed.author) {
                return;
              }
              embed.author.name = undefined;

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
                embed.author = { url };
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
                embed.author = { icon_url };
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
      }),
      { name: "current-message" }
    )
  )
);
