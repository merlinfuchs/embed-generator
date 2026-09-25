export const discordWebhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api(\/v[0-9]+)?\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;

export const messageUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/;

/** A message id, typed or taken from a message link, null for anything else. */
export function parseMessageId(input: string): string | null {
  const value = input.trim();
  const id = value.match(messageUrlRegex)?.[2] ?? value;
  return /^\d+$/.test(id) ? id : null;
}

/** Forum and media channels, where a message can only be sent as a new thread. */
export function isThreadOnlyChannel(type: number | undefined): boolean {
  return type === 15 || type === 16;
}

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
