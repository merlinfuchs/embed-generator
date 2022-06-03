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

export interface MessageWire {}
