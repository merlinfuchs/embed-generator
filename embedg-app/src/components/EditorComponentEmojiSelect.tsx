import { FaceSmileIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useSendSettingsStore } from "../state/sendSettings";
import EmojiPicker from "./EmojiPicker";
import type { Emoji } from "../discord/schema";
import Twemoji from "./Twemoji";

interface Props {
  emoji: Emoji | undefined;
  onChange: (emoji: Emoji | undefined) => void;
  /** Leaves out the heading and lines up with a text input beside it, for rows of several. */
  compact?: boolean;
}

export default function EditorComponentEmojiSelect({
  emoji,
  onChange,
  compact,
}: Props) {
  const guildId = useSendSettingsStore((state) => state.guildId);

  function onEmojiSelect(emoji: any) {
    if (emoji.native) {
      onChange({ name: emoji.native, animated: false });
    } else {
      onChange({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.src.endsWith(".gif"),
      });
    }
  }

  return (
    <div className="flex-none">
      {!compact && (
        <div className="mb-1.5 flex">
          <div className="uppercase text-mist-300 text-sm font-medium">
            Emoji
          </div>
        </div>
      )}
      <div className="flex">
        <div className="bg-ink-900 rounded-lg flex">
          <EmojiPicker
            guildId={guildId}
            onEmojiSelect={onEmojiSelect}
            align="left"
          >
            <button
              type="button"
              aria-label="Select emoji"
              className={clsx(
                "flex items-center justify-center cursor-pointer text-mist-300 hover:text-white",
                compact ? "h-10 w-10" : "h-9 w-9",
              )}
            >
              {emoji ? (
                emoji.id ? (
                  <img
                    src={`https://cdn.discordapp.com/emojis/${emoji.id}.${
                      emoji.animated ? "gif" : "webp"
                    }`}
                    alt=""
                    className="h-6 w-6"
                  />
                ) : (
                  <Twemoji className="h-6 w-6">{emoji.name}</Twemoji>
                )
              ) : (
                <FaceSmileIcon className="h-7 w-7" />
              )}
            </button>
          </EmojiPicker>
          {emoji && (
            <div
              className="flex items-center cursor-pointer pr-1 text-mist-400 hover:text-white"
              onClick={() => onChange(undefined)}
            >
              <XMarkIcon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
