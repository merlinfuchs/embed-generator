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

interface WebhookInfo {
  id: string;
  token: string;
}

export function parseWebhookUrl(webhookUrl: string): WebhookInfo | null {
  const match = webhookUrl.match(discordWebhookUrlRegex);
  if (!match) return null;

  return { id: match[2], token: match[3] };
}
