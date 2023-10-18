import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { useSendSettingsStore } from "../state/sendSettings";
import EmojiPicker from "./EmojiPicker";
import { RefObject } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement & HTMLTextAreaElement>;
}

export default function InputControlBar({ value, onChange, inputRef }: Props) {
  const guildId = useSendSettingsStore((state) => state.guildId);

  function insertAtCursor(value: string) {
    if (!inputRef.current) return;

    const element = inputRef.current;

    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;

    const newValue =
      element.value.substring(0, startPos) +
      value +
      element.value.substring(endPos, element.value.length);

    onChange(newValue);
    element.selectionStart = startPos + 1;
    element.selectionEnd = endPos + 1;
  }

  function onEmojiSelect(emoji: any) {
    if (emoji.native) {
      insertAtCursor(emoji.native);
    } else {
      insertAtCursor(`<:${emoji.name}:${emoji.id}>`);
    }
  }

  return (
    <div className="flex">
      <EmojiPicker
        guildId={guildId}
        onEmojiSelect={onEmojiSelect}
        align="right"
      >
        <div
          className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
          role="button"
        >
          <FaceSmileIcon className="h-5 w-5" />
        </div>
      </EmojiPicker>
    </div>
  );
}
