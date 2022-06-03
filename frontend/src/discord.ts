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
  components: ({ id: number | undefined } & Component)[];
}

export type Component =
  | {
      type: 2;
      style: 1 | 2 | 3 | 4;
      label?: string;
      emoji?: {
        name: string;
        id?: string;
        animated?: boolean;
      };
      custom_id: string;
    }
  | {
      type: 2;
      style: 5;
      label?: string;
      emoji?: {
        name: string;
        id?: string;
        animated?: boolean;
      };
      url: string;
    }
  | {
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
    };

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

export function removeIdsFromMessage(msg: Message): Message {
  return msg;
}

export function fillIdsForMessage(msg: Message): Message {
  return msg;
}
