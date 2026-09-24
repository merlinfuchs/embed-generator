export const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

export function getRelativeUrl(path: string): string {
  return `${baseUrl}${path}`;
}

const SAFE_PROTOCOLS = ["http:", "https:"];

/**
 * Returns the URL only when a browser should be allowed to follow it. Anything that lands in the
 * preview goes through here: the lenient import schema takes any string, a shared message comes
 * from whoever made it, and React renders a `javascript:` href with nothing more than a warning.
 */
export function safeHref(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  try {
    if (SAFE_PROTOCOLS.includes(new URL(url).protocol)) return url;
  } catch {
    // Relative or unparsable, which an embed or button link is never supposed to be.
  }

  return undefined;
}
