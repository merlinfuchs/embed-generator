import { expect, test } from "vitest";
import { parseDataLink } from "./dataLink";

function encode(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test("a Discohook link opens its first message", () => {
  const { message, messageCount } = parseDataLink(
    encode({
      version: "d2",
      messages: [
        {
          _id: "abc",
          data: {
            content: "Héllo 👋",
            embeds: [{ title: "Rules", color: 5814783 }],
            components: [],
            attachments: [],
          },
        },
        { data: { content: "Second" } },
      ],
      targets: [],
    }),
  );

  expect(message.content).toBe("Héllo 👋");
  expect(message.embeds[0].title).toBe("Rules");
  expect(messageCount).toBe(2);
});

test("standard base64 survives the + becoming a space in the query", () => {
  const json = JSON.stringify({ messages: [{ data: { content: "~~~" } }] });
  const standard = btoa(json);
  expect(standard).toContain("+");

  const param = new URLSearchParams(`data=${standard}`).get("data")!;

  expect(parseDataLink(param).message.content).toBe("~~~");
});

test("links without messages fail", () => {
  expect(() => parseDataLink(encode({ messages: [] }))).toThrow();
  expect(() => parseDataLink(encode({ content: "Hi" }))).toThrow();
  expect(() => parseDataLink("not base64!")).toThrow();
});
