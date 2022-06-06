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
}

export interface MessageWire {
  id: string;
  user_id: string;
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
  attachments?: {}[];
}

export interface MessageSendResponseWire {
  message_id: string;
}
