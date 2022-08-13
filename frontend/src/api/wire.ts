export interface UserWire {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export interface GuildWire {
  id: string;
  name: string;
  discription: string | null;
  icon: string | null;
}

export interface ChannelWire {
  id: string;
  name: string | null;
  type: number;
  position: number;
  parent_id: string | null;
}

export interface MessageWire {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  payload_json: string;
  updated_at: string;
}

export interface MessageCreateRequestWire {
  name: string;
  description: string | null;
  payload_json: string;
}

export interface MessageUpdateRequestWire {
  name: string;
  description: string | null;
  payload_json: string;
}

export interface MessageSendRequestWire {
  target:
    | {
        webhook_id: string;
        webhook_token: string;
        thread_id?: string;
        message_id?: string;
      }
    | {
        guild_id: string;
        channel_id: string;
        message_id?: string;
      };
  payload_json: string;
  attachments?: AttachmentWire[];
}

export interface MessageSendResponseWire {
  message_id: string;
}

export interface HistoryMessageWire {
  id: string;
  created_at: string;
}

export interface StickerWire {
  id: string;
  name: string;
  description: string | null;
  available: boolean;
  format_type: number;
}

export interface EmojiWire {
  id: string;
  name: string;
  available: boolean;
  animated: boolean;
  managed: boolean;
}

export interface RoleWire {
  id: string;
  name: string;
  color: number;
  mentionable: boolean;
  managed: boolean;
}

export interface AttachmentWire {
  name: string;
  description: string | null;
  data_url: string;
}
