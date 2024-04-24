import { AtSymbolIcon, FaceSmileIcon } from "@heroicons/react/24/outline";
import { useSendSettingsStore } from "../state/sendSettings";
import EmojiPicker from "./EmojiPicker";
import { RefObject, useEffect } from "react";
import EditorMentionPicker from "./EditorMentionPicker";

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
      insertAtCursor(
        `<${emoji.src.endsWith(".gif") ? "a" : ""}:${emoji.name}:${emoji.id}>`
      );
    }
  }

  function onMentionInsert(mention: string) {
    insertAtCursor(mention);
  }

  function onBold() {
    surroundSelection("**", "**", "bold text");
  }

  function onItalic() {
    surroundSelection("*", "*", "cursive text");
  }

  function onUnderline() {
    surroundSelection("__", "__", "underlined text");
  }

  function onStrikethrough() {
    surroundSelection("~~", "~~", "strikethrough text");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;

      switch (e.key) {
        case "b":
          e.preventDefault();
          onBold();
          break;
        case "i":
          e.preventDefault();
          onItalic();
          break;
        case "u":
          e.preventDefault();
          onUnderline();
          break;
        case "s":
          e.preventDefault();
          onStrikethrough();
          break;
      }
    }

    inputRef.current?.addEventListener("keydown", onKeyDown);

    return () => {
      inputRef.current?.removeEventListener("keydown", onKeyDown);
    };
  }, [inputRef.current]);

  return (
    <div className="flex space-x-2">
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={onBold}
      >
        <div className="font-bold">B</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={onItalic}
      >
        <div className="italic">I</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={onUnderline}
      >
        <div className="underline">U</div>
      </div>
      <div
        className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
        role="button"
        onClick={onStrikethrough}
      >
        <div className="line-through">S</div>
      </div>
      <EditorMentionPicker onMentionInsert={onMentionInsert} guildId={guildId}>
        <div
          className="h-7 w-7 flex items-center justify-center bg-dark-2 rounded cursor-pointer text-gray-300 hover:text-white"
          role="button"
        >
          <AtSymbolIcon className="h-5 w-5" />
        </div>
      </EditorMentionPicker>
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
