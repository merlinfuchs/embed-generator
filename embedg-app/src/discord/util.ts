export const discordWebhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api(\/v[0-9]+)?\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;

export const messageUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/;

export const guildedWebhookUrlRegex =
  /https?:\/\/media\.guilded\.gg\/webhooks\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;

interface WebhookInfo {
  type: "discord" | "guilded";
  id: string;
  token: string;
}

export function parseWebhookUrl(webhookUrl: string): WebhookInfo | null {
  let match = webhookUrl.match(discordWebhookUrlRegex);
  if (match) {
    return {
      type: "discord",
      id: match[2],
      token: match[3],
    };
  }

  match = webhookUrl.match(guildedWebhookUrlRegex);
  if (match) {
    return {
      type: "guilded",
      id: match[1],
      token: match[2],
    };
  }

  return null;
}

export function isComponentV2Enabled(flags: number): boolean {
  return (flags & (1 << 15)) === 1;
}

export function enableComponentV2(flags: number): number {
  return flags | (1 << 15);
}

export function disableComponentV2(flags: number): number {
  return flags & ~(1 << 15);
}
