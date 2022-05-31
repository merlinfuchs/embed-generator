export default class APIClient {
  token: string;
  setToken: (newToken: string) => void;

  constructor(token: string, setToken: (newToken: string) => void) {
    this.token = token;
    this.setToken = setToken;
  }

  async getUser() {
    return {};
  }

  async getGuilds() {
    return [] as {}[];
  }
}
