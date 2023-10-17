import Picker from "@emoji-mart/react";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { useGuildEmojisQuery } from "../api/queries";

interface Props {
  guildId?: string | null;
  onEmojiSelect: (emoji: any) => void;
}

export default function EmojiPicker({ guildId, onEmojiSelect }: Props) {
  const [open, setOpen] = useState(false);

  const { data: emojis } = useGuildEmojisQuery(guildId ?? null);

  const customEmojis = useMemo(() => {
    if (!emojis?.success) return [];

    return [
      {
        id: "custom",
        name: "Custom",
        emojis: emojis.data.map((emoji) => ({
          id: emoji.id,
          name: emoji.name,
          keywords: ["discord", "custom"],
          skins: [
            {
              src: `https://cdn.discordapp.com/emojis/${emoji.id}.${
                emoji.animated ? "gif" : "webp"
              }`,
            },
          ],
        })),
      },
    ];
  }, [emojis]);

  return (
    <ClickOutsideHandler
      className="relative"
      onClickOutside={() => setOpen(false)}
    >
      <div
        onClick={() => setOpen(!open)}
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
      >
        <FaceSmileIcon className="h-5 w-5" />
      </div>
      {open && (
        <div className="absolute top-10 right-0 z-20">
          <Picker
            data={async () => {
              const response = await fetch(
                "https://cdn.jsdelivr.net/npm/@emoji-mart/data/sets/14/twitter.json"
              );
              return response.json();
            }}
            onEmojiSelect={(data: any) => {
              setOpen(false);
              onEmojiSelect(data);
            }}
            custom={customEmojis}
            categories={[
              "frequent",
              "custom",
              "people",
              "nature",
              "foods",
              "activity",
              "places",
              "objects",
              "symbols",
              "flags",
            ]}
            theme="dark"
            set="twitter"
          />
        </div>
      )}
    </ClickOutsideHandler>
  );
}
