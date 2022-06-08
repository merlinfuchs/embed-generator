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
  components: ({ id?: number } & Button)[];
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
