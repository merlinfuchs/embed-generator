export interface Message {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds: ({ id: number | undefined } & Embed)[];
  components: ({ id: number | undefined } & ComponentActionRow)[];
  files: ({ id: number | undefined } & File)[];
}

export interface File {}

export interface ComponentActionRow {
  type: 1;
  components: ({ id: number | undefined } & Button)[];
}

export type Button = (
  | {
      type: 2;
      style: 1 | 2 | 3 | 4;
      custom_id: string;
    }
  | {
      type: 2;
      style: 5;
      url: string;
    }
) &
  (
    | {
        label: string;
        emoji?: {
          name: string;
          id?: string;
          animated?: boolean;
        };
      }
    | {
        label: undefined;
        emoji: {
          name: string;
          id?: string;
          animated?: boolean;
        };
      }
  );

export interface SelectMenu {
  type: 3;
  custom_id: string;
  placeholder?: string;
  disabled: boolean;
  options: {
    label: string;
    value: string;
    description?: string;
    emoji?: {
      name: string;
      id?: string;
      animated?: boolean;
    };
    default?: boolean;
  }[];
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  author?: EmbedAuthor;
  fields: ({ id: number | undefined } & EmbedField)[];
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
}

export interface EmbedImage {
  url: string;
}

export interface EmbedThumbnail {
  url: string;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

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
  const message: Message = { files: [], embeds: [], components: [] };

  if (typeof json.content === "string") {
    message.content = json.content;
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
