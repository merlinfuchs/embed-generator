import { ChannelWire, GuildWire, UserWire } from "./wire";

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: { code: string };
    };

export default class APIClient {
  token: string;
  setToken: (newToken: string | null) => void;

  constructor(token: string, setToken: (newToken: string | null) => void) {
    this.token = token;
    this.setToken = setToken;
  }

  async apiRequest<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const resp = await fetch(`/api${path}`, {
      method,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
      },
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
}
