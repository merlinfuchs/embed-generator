import { ZodError } from "zod";
import { getUniqueId } from "../util";
import {
  ComponentActionRow,
  ComponentButton,
  ComponentSelectMenu,
  Embed,
  Message,
  messageValidator,
} from "./types";

export function userAvatarUrl({
  id,
  avatar,
  discriminator,
}: {
  id: string;
  avatar: string | null;
  discriminator: string;
}) {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp?size=128`;
  } else {
    return `https://cdn.discordapp.com/embed/avatars/${
      parseInt(discriminator) % 5
    }.png?size=128`;
  }
}

export function guildIconUrl({
  id,
  icon,
}: {
  id: string;
  icon: string | null;
}) {
  return `https://cdn.discordapp.com/icons/${id}/${icon}.webp`;
}

export function messageToJson(msg: Message): any {
  const result: Message = JSON.parse(JSON.stringify(msg));

  for (const embed of result.embeds) {
    embed.id = undefined;
    for (const field of embed.fields) {
      field.id = undefined;
    }
  }

  for (const component of result.components) {
    component.id = undefined;
    for (const button of component.components) {
      button.id = undefined;
    }
  }

  return result;
}

export function jsonToMessage(json: any): Message {
  const message: Message = { embeds: [], components: [] };

  if (typeof json !== "object" || json === null) {
    return message;
  }

  if (typeof json.username === "string" || json.username === undefined) {
    message.username = json.username;
  }

  if (typeof json.avatar_url === "string" || json.avatar_url === undefined) {
    message.avatar_url = json.avatar_url;
  }

  if (typeof json.content === "string" || json.content === undefined) {
    message.content = json.content;
  }

  if (Array.isArray(json.embeds)) {
    for (const embedJson of json.embeds) {
      if (typeof embedJson !== "object" || embedJson === null) {
        continue;
      }

      const embed: Embed & { id: number } = { id: getUniqueId(), fields: [] };

      /* 
        fields: ({ id: number | undefined } & EmbedField)[];
      */

      if (
        typeof embedJson.title === "string" ||
        embedJson.title === undefined
      ) {
        embed.title = embedJson.title;
      }

      if (
        typeof embedJson.description === "string" ||
        embedJson.description === undefined
      ) {
        embed.description = embedJson.description;
      }

      if (typeof embedJson.url === "string" || embedJson.url === undefined) {
        embed.url = embedJson.url;
      }

      if (
        typeof embedJson.timestamp === "string" ||
        embedJson.timestamp === undefined
      ) {
        embed.timestamp = embedJson.timestamp;
      }

      if (
        typeof embedJson.color === "number" ||
        embedJson.color === undefined
      ) {
        embed.color = embedJson.color;
      }

      if (typeof embedJson.footer === "object" && embedJson.footer !== null) {
        if (typeof embedJson.footer.text === "string") {
          embed.footer = {
            text: embedJson.footer.text,
            icon_url: embed.footer?.icon_url,
          };
        }

        if (
          typeof embedJson.footer.icon_url === "string" ||
          embedJson.footer.icon_url === undefined
        ) {
          embed.footer = {
            text: embed.footer?.text || "",
            icon_url: embedJson.icon_url,
          };
        }
      }

      if (typeof embedJson.image === "object" && embedJson.image !== null) {
        if (typeof embedJson.image.url === "string") {
          embed.image = { url: embedJson.image.url };
        }
      }

      if (
        typeof embedJson.thumbnail === "object" &&
        embedJson.thumbnail !== null
      ) {
        if (typeof embedJson.thumbnail.url === "string") {
          embed.thumbnail = { url: embedJson.thumbnail.url };
        }
      }

      if (typeof embedJson.author === "object" && embedJson.author !== null) {
        if (typeof embedJson.author.name === "string") {
          embed.author = { ...embed.author, name: embedJson.author.name };
        }
        if (typeof embedJson.author.url === "string") {
          embed.author = {
            ...embed.author,
            name: embed.author?.name || "",
            url: embedJson.author.url,
          };
        }
        if (typeof embedJson.author.icon_url === "string") {
          embed.author = {
            ...embed.author,
            name: embed.author?.name || "",
            icon_url: embedJson.author.icon_url,
          };
        }
      }

      if (Array.isArray(embedJson.fields)) {
        for (const fieldJson of embedJson.fields) {
          if (typeof fieldJson !== "object" || fieldJson === null) continue;
          embed.fields.push({
            id: getUniqueId(),
            name: typeof fieldJson.name === "string" ? fieldJson.name : "",
            value: typeof fieldJson.value === "string" ? fieldJson.value : "",
            inline: !!fieldJson.inline,
          });
        }
      }

      message.embeds.push(embed);
    }
  }

  if (Array.isArray(json.components)) {
    for (const rowJson of json.components) {
      if (typeof rowJson !== "object" || rowJson === null) {
        continue;
      }

      if (Array.isArray(rowJson.components)) {
        const row: ComponentActionRow & { id: number } = {
          id: getUniqueId(),
          type: 1,
          components: [],
        };

        for (const compJson of rowJson.components) {
          if (typeof compJson !== "object" || compJson === null) {
            continue;
          }

          if (compJson.type === 2) {
            if (compJson.style === 5) {
              const component: ComponentButton & { id: number } = {
                id: getUniqueId(),
                type: 2,
                style: 5,
                label: typeof compJson.label === "string" ? compJson.label : "",
                url: typeof compJson.url === "string" ? compJson.url : "",
              };
              row.components.push(component);
            } else if ([1, 2, 3, 4].includes(compJson.style)) {
              const component: ComponentButton = {
                type: 2,
                style: compJson.style,
                label: typeof compJson.label === "string" ? compJson.label : "",
                custom_id:
                  typeof compJson.custom_id === "string"
                    ? compJson.custom_id
                    : "",
              };
              row.components.push(component);
            }
          } else if (compJson.type === 3) {
            const component: ComponentSelectMenu & { id: number } = {
              id: getUniqueId(),
              type: 3,
              custom_id:
                typeof compJson.custom_id === "string"
                  ? compJson.custom_id
                  : "",
              placeholder:
                typeof compJson.placeholder === "string"
                  ? compJson.placeholder
                  : undefined,
              options: [],
            };
            if (Array.isArray(compJson.options)) {
              for (const optionJson of compJson.options) {
                if (typeof optionJson !== "object" || optionJson === null)
                  continue;

                component.options.push({
                  id: getUniqueId(),
                  label:
                    typeof optionJson.label === "string"
                      ? optionJson.label
                      : "",
                  value:
                    typeof optionJson.value === "string"
                      ? optionJson.value
                      : "",
                });
              }
            }
            row.components.push(component);
          }
        }

        message.components.push(row);
      }
    }
  }

  return message;
}

export function jsonToMessageStrict(
  json: any
): { success: true; message: Message } | { success: false; error: ZodError } {
  const result = messageValidator.safeParse(json);
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const message = result.data;
  for (const embed of message.embeds) {
    embed.id = getUniqueId();

    for (const field of embed.fields) {
      field.id = getUniqueId();
    }
  }

  for (const row of message.components) {
    row.id = getUniqueId();

    for (const component of row.components) {
      component.id = getUniqueId();

      if (component.type === 3) {
        for (const option of component.options) {
          option.id = getUniqueId();
        }
      }
    }
  }

  return {
    success: true,
    message,
  };
}
