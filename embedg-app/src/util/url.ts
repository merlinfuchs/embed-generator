export const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

export function getRelativeUrl(path: string): string {
  return `${baseUrl}${path}`;
}
