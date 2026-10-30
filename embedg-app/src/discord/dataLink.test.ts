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

test("a message link opens the message with its actions", () => {
  const { message, messageCount } = parseDataLink(
    encode({
      content: "Pick a role",
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 1, label: "Gamer", action_set_id: "roles" },
          ],
        },
      ],
      actions: {
        roles: { actions: [{ type: 2, target_id: "123" }] },
      },
    }),
  );

  expect(message.content).toBe("Pick a role");
  expect(message.actions.roles.actions).toMatchObject([
    { type: 2, target_id: "123" },
  ]);
  expect(messageCount).toBe(1);
});

test("links that aren't a message fail", () => {
  expect(() => parseDataLink(encode({ messages: [] }))).toThrow();
  expect(() => parseDataLink(encode([{ content: "Hi" }]))).toThrow();
  expect(() => parseDataLink(encode("Hi"))).toThrow();
  expect(() => parseDataLink("not base64!")).toThrow();
});
