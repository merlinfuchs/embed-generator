import { init, SearchIndex } from "emoji-mart";
import { expect, test } from "vitest";
import { syncCustomCategories } from "./EmojiMartPicker";

const data = {
  categories: [{ id: "people", emojis: ["grinning"] }],
  emojis: {
    grinning: {
      id: "grinning",
      name: "Grinning Face",
      keywords: ["smile"],
      skins: [{ unified: "1f600", native: "😀" }],
      version: 1,
    },
  },
  aliases: {},
  sheet: { cols: 1, rows: 1 },
};

function server(name: string) {
  return [
    {
      id: "custom",
      name: "Custom Emojis",
      emojis: [{ id: name, name, keywords: [], skins: [{ src: name }] }],
    },
  ];
}

async function open(custom: ReturnType<typeof server>) {
  syncCustomCategories(custom);
  await init({ data, custom, categories: ["custom", "people"] });
}

async function searchIds(query: string) {
  return ((await SearchIndex.search(query)) ?? []).map((e: any) => e.id);
}

test("switching servers swaps the custom emojis, in search too", async () => {
  await open(server("firstserveremoji"));
  expect(await searchIds("firstserveremoji")).toEqual(["firstserveremoji"]);

  await open(server("secondserveremoji"));
  expect(await searchIds("secondserveremoji")).toEqual(["secondserveremoji"]);
  expect(await searchIds("firstserveremoji")).toEqual([]);
});
