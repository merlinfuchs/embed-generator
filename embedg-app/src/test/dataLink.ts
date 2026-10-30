/** Encodes a value the way a ?data= link carries it: URL-safe base64 of UTF-8 JSON. */
export function encodeDataLink(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  // Spreading the bytes into fromCharCode overflows the argument limit on large messages.
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
