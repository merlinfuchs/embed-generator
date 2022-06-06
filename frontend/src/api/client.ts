import {
  HistoryMessageWire,
  ChannelWire,
  GuildWire,
  MessageSendRequestWire,
  MessageSendResponseWire,
  MessageWire,
  UserWire,
} from "./wire";

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: { code: string; details: string | null };
    };

export default class APIClient {
  token: string | null;
  setToken: (newToken: string | null) => void;

  constructor(
    token: string | null,
    setToken: (newToken: string | null) => void
  ) {
    this.token = token;
    this.setToken = setToken;
  }

  async apiRequest<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const headers: any = {};
    if (this.token) {
      headers["Authorization"] = this.token;
    }
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    const resp = await fetch(`/api${path}`, {
      method,
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
    if (resp.status === 401) {
      this.setToken(null);
    }
    return await resp.json();
  }

  exchangeToken(code: string): Promise<ApiResponse<{ token: string }>> {
    return this.apiRequest("POST", "/auth/exchange", { code });
  }

  getUser(): Promise<ApiResponse<UserWire>> {
    return this.apiRequest("GET", "/users/@me");
  }

  getGuilds(): Promise<ApiResponse<GuildWire[]>> {
    return this.apiRequest("GET", "/guilds");
  }

  getGuildChannels(guildId: string): Promise<ApiResponse<ChannelWire[]>> {
    return this.apiRequest("GET", `/guilds/${guildId}/channels`);
  }

  getMessages(): Promise<ApiResponse<MessageWire[]>> {
    return this.apiRequest("GET", "/messages");
  }

  sendMessage(
    req: MessageSendRequestWire
  ): Promise<ApiResponse<MessageSendResponseWire>> {
    return this.apiRequest("POST", "/messages/send", req);
  }

  getChannelHistory(
    channelId: string
  ): Promise<ApiResponse<HistoryMessageWire[]>> {
    return this.apiRequest("GET", `/channels/${channelId}/history`);
  }
}
