export interface Message {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds: ({ id?: number } & Embed)[];
  components: ({ id?: number } & ComponentActionRow)[];
}

export interface File {}

export interface ComponentActionRow {
  type: 1;
  components: ({ id?: number } & (ComponentButton | ComponentSelectMenu))[];
}

export type ComponentButton =
  | {
      type: 2;
      style: 1 | 2 | 3 | 4;
      custom_id: string;
      label: string;
    }
  | {
      type: 2;
      style: 5;
      url: string;
      label: string;
    };

export interface ComponentSelectMenu {
  type: 3;
  custom_id: string;
  placeholder?: string;
  options: ({ id?: number } & ComponentSelectMenuOption)[];
}

export interface ComponentSelectMenuOption {
  label: string;
  value: string;
  description?: string;
  default?: boolean;
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
