export const discordWebhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api(\/v[0-9]+)?\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;

// Fluxer shows api.fluxer.app URLs, web.fluxer.app/api is the same API.
// https://docs.fluxer.app/http-api/webhooks/
export const fluxerWebhookUrlRegex =
  /https?:\/\/(?:api\.fluxer\.app|web\.fluxer\.app\/api)(\/v[0-9]+)?\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;

export const messageUrlRegex =
  /https?:\/\/(?:(?:canary\.|ptb\.)?discord(?:app)?\.com|web\.fluxer\.app)\/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/;

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

/** Where a webhook lives. Fluxer takes Discord's messages, minus components and threads. */
export type WebhookPlatform = "discord" | "fluxer";

interface WebhookInfo {
  platform: WebhookPlatform;
  id: string;
  token: string;
}

export function parseWebhookUrl(webhookUrl: string): WebhookInfo | null {
  const discord = webhookUrl.match(discordWebhookUrlRegex);
  if (discord)
    return { platform: "discord", id: discord[2], token: discord[3] };

  const fluxer = webhookUrl.match(fluxerWebhookUrlRegex);
  if (fluxer) return { platform: "fluxer", id: fluxer[2], token: fluxer[3] };

  return null;
}
