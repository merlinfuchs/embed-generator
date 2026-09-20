import { lazy, type ReactNode, Suspense, useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { useGuildEmojisQuery } from "../api/queries";
import clsx from "clsx";

// The picker and its dataset are only needed once someone opens it, and they
// are a sizeable part of the main chunk otherwise.
const Picker = lazy(() => import("@emoji-mart/react"));

let emojiData: Promise<unknown> | undefined;

function loadEmojiData() {
  emojiData ??= fetch(
    "https://cdn.jsdelivr.net/npm/@emoji-mart/data/sets/15/twitter.json",
  ).then((response) => response.json());

  return emojiData;
}

interface Props {
  guildId?: string | null;
  onEmojiSelect: (emoji: any) => void;
  children: ReactNode;
  align: "left" | "right" | "center";
}

export default function EmojiPicker({
  guildId,
  onEmojiSelect,
  children,
  align,
}: Props) {
  const [open, setOpen] = useState(false);

  const { data: emojis } = useGuildEmojisQuery(guildId ?? null);

  const customEmojis = useMemo(() => {
    if (!emojis?.success) return [];

    return [
      {
        id: "custom",
        name: "Custom Emojis",
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
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div
          className={clsx(
            "absolute top-10 z-20",
            align === "left" ? "left-0" : align === "right" ? "right-0" : "",
          )}
        >
          <Suspense fallback={null}>
            <Picker
              data={loadEmojiData}
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
              getSpritesheetURL={() => {
                return "https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@15.0.0/img/twitter/sheets-256/64.png";
              }}
            />
          </Suspense>
        </div>
      )}
    </ClickOutsideHandler>
  );
}
