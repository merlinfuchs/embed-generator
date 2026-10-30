/** Encodes a value the way a ?data= link carries it: URL-safe base64 of UTF-8 JSON. */
export function encodeDataLink(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
