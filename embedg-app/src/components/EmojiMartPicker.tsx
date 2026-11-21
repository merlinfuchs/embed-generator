import Picker from "@emoji-mart/react";
import { Data, SearchIndex } from "emoji-mart";

// emoji-mart keeps its dataset in module level state and only honours the
// `custom` prop the first time a custom category is registered: later
// categories are pushed onto a list that gets overwritten from
// `Data.originalCategories`, which still holds the first one. That made the
// picker show the custom emojis of whichever server was selected when it was
// first opened. We swap the custom category in that list ourselves, before the
// picker mounts and initializes.
let previousCustom: any[] = [];

export function syncCustomCategories(custom: any[]) {
  if (custom === previousCustom) return;

  // Before the first init there is nothing to swap, but the emojis it registers
  // still have to be removed on the next server switch.
  if (Data?.originalCategories) {
    for (const category of previousCustom) {
      for (const emoji of category.emojis) delete Data.emojis[emoji.id];
    }
    Data.originalCategories = [
      ...Data.originalCategories.filter((category: any) => !category.name),
      ...custom,
    ];
    SearchIndex.reset();
  }
  previousCustom = custom;
}

export default function EmojiMartPicker(props: any) {
  syncCustomCategories(props.custom ?? []);
  return <Picker {...props} />;
}
