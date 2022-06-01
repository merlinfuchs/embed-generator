export interface Message {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds: ({ id: number } & Embed)[];
  components: ({ id: number } & ComponentActionRow)[];
  files: ({ id: number } & File)[];
}

export interface File {}

export interface ComponentActionRow {
  type: 1;
  components: Component[];
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
  fields: ({ id: number } & EmbedField)[];
}

export interface EmbedFooter {}

export interface EmbedImage {}

export interface EmbedThumbnail {}

export interface EmbedAuthor {}

export interface EmbedField {}
