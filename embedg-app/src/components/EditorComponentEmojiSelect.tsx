import { FaceSmileIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSendSettingsStore } from "../state/sendSettings";
import EmojiPicker from "./EmojiPicker";
import { Emoji } from "../discord/schema";
import Twemoji from "./Twemoji";

interface Props {
  emoji: Emoji | undefined;
  onChange: (emoji: Emoji | undefined) => void;
}

export default function EdiotrComponentEmojiSelect({ emoji, onChange }: Props) {
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
      <div className="mb-1.5 flex">
        <div className="uppercase text-gray-300 text-sm font-medium">Emoji</div>
      </div>
      <div className="flex">
        <div className="bg-dark-2 rounded flex">
          <EmojiPicker
            guildId={guildId}
            onEmojiSelect={onEmojiSelect}
            align="left"
          >
            <div
              className="h-9 w-9 flex items-center justify-center cursor-pointer text-gray-300 hover:text-white"
              role="button"
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
                  <Twemoji
                    options={{
                      className: "h-6 w-6",
                    }}
                  >
                    {emoji.name}
                  </Twemoji>
                )
              ) : (
                <FaceSmileIcon className="h-7 w-7" />
              )}
            </div>
          </EmojiPicker>
          {emoji && (
            <div
              className="flex items-center cursor-pointer pr-1 text-gray-400 hover:text-white"
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
