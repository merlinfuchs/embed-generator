import { expect, test } from "vitest";
import {
  type EmbedLinkFields,
  embedLinkToJson,
  parseEmbedLinkJson,
} from "./embedLinkJson";

const fields: EmbedLinkFields = {
  url: "https://discord.gg/abc",
  title: "Join us",
  description: "A server",
  color: 0x5865f2,
  image_url: "https://example.com/a.png",
  large_image: false,
  provider: { name: "Provider", url: "https://example.com" },
  author: { name: "", url: "" },
  component: { type: 17, components: [{ type: 10, content: "# Hi" }] },
};

test("the JSON parses back to the same link", () => {
  expect(parseEmbedLinkJson(embedLinkToJson(fields))).toEqual(fields);
});

test("missing fields become empty", () => {
  expect(parseEmbedLinkJson('{"url": "https://message.style"}')).toEqual({
    url: "https://message.style",
    title: "",
    description: "",
    color: undefined,
    image_url: "",
    large_image: true,
    provider: { name: "", url: "" },
    author: { name: "", url: "" },
    component: null,
  });
});

test("a hex color is read as a number", () => {
  expect(parseEmbedLinkJson('{"color": "#ff0000"}').color).toBe(0xff0000);
});

test("invalid JSON and wrong types throw", () => {
  expect(() => parseEmbedLinkJson("{")).toThrow();
  expect(() => parseEmbedLinkJson('{"title": 5}')).toThrow();
});
