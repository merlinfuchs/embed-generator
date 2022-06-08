import { Embed, Message } from "./types";

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

type JsontoMessageResult =
  | { success: true; message: Message }
  | { success: false; errors: string[] };

export function jsonToMessage(json: any): JsontoMessageResult {
  const errors: string[] = [];
  const message: Message = { embeds: [], components: [] };

  if (typeof json.content === "string") {
    message.content = json.content;
  }

  if (Array.isArray(json.embeds)) {
    for (const embedJson of json.embeds) {
      if (typeof embedJson !== "object") {
        errors.push("");
        break;
      }

      const embed: Embed & { id: number } = { id: 0, fields: [] };

      if (typeof embedJson.title === "string") {
        embed.title = embedJson.title;
      }

      message.embeds.push(embed);
    }
  } else {
    errors.push("");
  }

  if (errors.length !== 0) {
    return { success: false, errors };
  } else {
    return {
      success: true,
      message,
    };
  }
}
