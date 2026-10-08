import { expect, test } from "vitest";
import { exportMessage } from "./exportMessage";
import { parseMessageWithAction } from "./importSchema";

test("embeds and fields lose the editor's ids", () => {
  const message = parseMessageWithAction({
    embeds: [{ title: "Title", fields: [{ name: "Name", value: "Value" }] }],
  });
  expect(message.embeds[0].id).toBeTypeOf("number");

  const exported = exportMessage(message);

  expect(exported.embeds).toEqual([
    { title: "Title", fields: [{ name: "Name", value: "Value" }] },
  ]);
});

test("select options and gallery items lose their ids, components keep them", () => {
  const message = parseMessageWithAction({
    flags: 1 << 15,
    components: [
      {
        type: 17,
        components: [
          {
            type: 12,
            items: [{ media: { url: "https://example.com/a.png" } }],
          },
        ],
      },
      {
        type: 1,
        components: [{ type: 3, options: [{ label: "A" }] }],
      },
    ],
  });

  const [container, row] = exportMessage(message).components as Record<
    string,
    any
  >[];

  expect(container.id).toBeTypeOf("number");
  expect(container.components[0].id).toBeTypeOf("number");
  expect(container.components[0].items[0]).not.toHaveProperty("id");
  expect(row.components[0].id).toBeTypeOf("number");
  expect(row.components[0].options[0]).not.toHaveProperty("id");
});

test("exported JSON imports again", () => {
  const message = parseMessageWithAction({
    embeds: [{ title: "Title", fields: [{ name: "Name", value: "Value" }] }],
  });

  const again = parseMessageWithAction(exportMessage(message));

  expect(again.embeds[0].title).toBe("Title");
  expect(again.embeds[0].fields[0].name).toBe("Name");
});

test("messages that actions respond with lose the editor's ids too", () => {
  const message = parseMessageWithAction({
    actions: {
      set: {
        actions: [
          {
            type: 5,
            message: { embeds: [{ title: "Thanks", fields: [{ name: "A" }] }] },
          },
        ],
      },
    },
  });

  const exported = exportMessage(message) as any;

  expect(exported.actions.set.actions[0].message.embeds).toEqual([
    { title: "Thanks", fields: [{ name: "A", value: "" }] },
  ]);
});
