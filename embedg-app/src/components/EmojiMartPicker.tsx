import Picker from "@emoji-mart/react";
import { Data, SearchIndex } from "emoji-mart";

// emoji-mart keeps its dataset in module level state and only honours the
// `custom` prop the first time a custom category is registered: later
// categories are pushed onto a list that gets overwritten from
// `Data.originalCategories`, which still holds the first one. That made the
// picker show the custom emojis of whichever server was selected when it was
// first opened. We swap the custom category in that list ourselves, before the
// picker mounts and initializes.
let previousEmojiIds: string[] = [];

function syncCustomCategories(custom: any[]) {
  if (!Data?.originalCategories) return;

  for (const id of previousEmojiIds) {
    delete Data.emojis[id];
  }
  previousEmojiIds = custom.flatMap((category) =>
    category.emojis.map((emoji: any) => emoji.id),
  );

  Data.originalCategories = [
    ...Data.originalCategories.filter((category: any) => !category.name),
    ...custom,
  ];
  SearchIndex.reset();
}

export default function EmojiMartPicker(props: any) {
  syncCustomCategories(props.custom ?? []);
  return <Picker {...props} />;
}
