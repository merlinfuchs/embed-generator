import { expect, test } from "vitest";
import { parseMessageWithAction } from "./importSchema";
import { messageSchema } from "./schema";

/** A message the way Discord returns one, nulls and all. */
const discordMessage = {
  content: "Hello",
  username: null,
  avatar_url: null,
  tts: null,
  embeds: [
    {
      title: "Title",
      description: null,
      url: null,
      color: 123,
      footer: { text: "Footer", icon_url: null },
      author: null,
      fields: [{ name: "Name", value: "Value", inline: null }],
    },
  ],
};

test("nulls from Discord become absent fields", () => {
  const message = parseMessageWithAction(discordMessage);

  expect(message.username).toBeUndefined();
  expect(message.embeds[0].description).toBeUndefined();
  expect(message.embeds[0].footer?.icon_url).toBeUndefined();
  expect(message.embeds[0].fields[0].inline).toBeUndefined();
  expect(message.tts).toBe(false);
});

test("ids are filled in for anything that arrives without one", () => {
  const message = parseMessageWithAction(discordMessage);

  expect(typeof message.embeds[0].id).toBe("number");
  expect(typeof message.embeds[0].fields[0].id).toBe("number");
});

test("a value the editor would reject still imports", () => {
  const message = parseMessageWithAction({
    content: "x".repeat(3000),
    embeds: [{ description: "y", url: "not a url" }],
  });

  // Importing keeps what arrived, so the editor can show it...
  expect(message.content).toHaveLength(3000);
  expect(message.embeds[0].url).toBe("not a url");

  // ...and the strict schema is what refuses to send it.
  const result = messageSchema.safeParse(message);
  expect(result.success).toBe(false);
});

test("buttons get the action set they reference", () => {
  const message = parseMessageWithAction({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: "set-1" },
        ],
      },
    ],
  });

  expect(message.actions).toHaveProperty("set-1");
  expect(message.actions["set-1"]).toEqual({ actions: [] });
});

test("select options get their action sets too", () => {
  const message = parseMessageWithAction({
    content: "",
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            options: [
              { label: "One", action_set_id: "set-a" },
              { label: "Two", action_set_id: "set-b" },
            ],
          },
        ],
      },
    ],
  });

  expect(Object.keys(message.actions).sort()).toEqual(["set-a", "set-b"]);
});

test("existing action sets are left alone", () => {
  const message = parseMessageWithAction({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: "set-1" },
        ],
      },
    ],
    actions: {
      "set-1": {
        actions: [
          {
            type: 1,
            id: 7,
            text: "hi",
            public: false,
            allow_role_mentions: false,
          },
        ],
      },
    },
  });

  expect(message.actions["set-1"].actions).toHaveLength(1);
});

test("a components v2 message imports with its tree intact", () => {
  const message = parseMessageWithAction({
    content: "",
    flags: 1 << 15,
    components: [
      {
        type: 17,
        components: [
          { type: 10, content: "Text" },
          {
            type: 9,
            components: [{ type: 10, content: "Section" }],
            accessory: {
              type: 11,
              media: { url: "https://message.style/a.png" },
            },
          },
          { type: 14, divider: null, spacing: null },
        ],
      },
    ],
  });

  const container = message.components[0] as {
    type: number;
    components: { type: number }[];
  };
  expect(container.type).toBe(17);
  expect(container.components.map((c) => c.type)).toEqual([10, 9, 14]);
});

test("buttons nested in a container get an action set", () => {
  const message = parseMessageWithAction({
    content: "",
    flags: 1 << 15,
    components: [
      {
        type: 17,
        components: [
          {
            type: 9,
            components: [{ type: 10, content: "Section" }],
            accessory: { type: 2, style: 1, label: "Accessory" },
          },
          {
            type: 1,
            components: [
              { type: 2, style: 1, label: "Nested" },
              {
                type: 3,
                options: [{ label: "Option", value: "a" }],
              },
            ],
          },
        ],
      },
    ],
  });

  // One for the accessory, one for the button, one for the select option.
  expect(Object.keys(message.actions)).toHaveLength(3);
});

test("a container with no components imports", () => {
  const message = parseMessageWithAction({
    content: "",
    flags: 1 << 15,
    components: [{ type: 17, components: [] }],
  });

  expect(message.components).toHaveLength(1);
});
