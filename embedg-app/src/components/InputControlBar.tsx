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

  function surroundSelection(
    prefix: string,
    suffix: string,
    placeholder: string
  ) {
    if (!inputRef.current) return;

    const element = inputRef.current;

    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;

    if (startPos == endPos) {
      insertAtCursor(prefix + placeholder + suffix);
      return;
    }

    const newValue =
      element.value.substring(0, startPos) +
      prefix +
      element.value.substring(startPos, endPos) +
      suffix +
      element.value.substring(endPos, element.value.length);

    onChange(newValue);
  }

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
  }

  function onEmojiSelect(emoji: any) {
    if (emoji.native) {
      insertAtCursor(emoji.native);
    } else {
      insertAtCursor(`<:${emoji.name}:${emoji.id}>`);
    }
  }

  return (
    <div className="flex space-x-2">
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={(e) => surroundSelection("**", "**", "bold text")}
      >
        <div className="font-bold">B</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={(e) => surroundSelection("*", "*", "cursive text")}
      >
        <div className="italic">I</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={(e) => surroundSelection("__", "__", "underlined text")}
      >
        <div className="underline">U</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={(e) => surroundSelection("~~", "~~", "strikethrough text")}
      >
        <div className="line-through">S</div>
      </div>
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
