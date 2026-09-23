import { AtSymbolIcon, FaceSmileIcon } from "@heroicons/react/24/outline";
import { useSendSettingsStore } from "../state/sendSettings";
import EmojiPicker from "./EmojiPicker";
import { type RefObject, useEffect, useRef } from "react";
import EditorMentionPicker from "./EditorMentionPicker";

const CONTROL_CLASS =
  "h-7 w-7 flex items-center justify-center bg-ink-900 rounded-lg cursor-pointer text-mist-300 hover:text-white";

interface Props {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement & HTMLTextAreaElement>;
}

export default function InputControlBar({ onChange, inputRef }: Props) {
  const guildId = useSendSettingsStore((state) => state.guildId);

  function surroundSelection(
    prefix: string,
    suffix: string,
    placeholder: string,
  ) {
    if (!inputRef.current) return;

    const element = inputRef.current;

    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;

    if (startPos === endPos) {
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
        `<${emoji.src.endsWith(".gif") ? "a" : ""}:${emoji.name}:${emoji.id}>`,
      );
    }
  }

  function onMentionInsert(mention: string) {
    insertAtCursor(mention);
  }

  // Both the toolbar buttons and the keyboard shortcuts drive the same four marks.
  const marks: {
    key: string;
    label: string;
    className: string;
    args: [string, string, string];
  }[] = [
    {
      key: "b",
      label: "Bold",
      className: "font-bold",
      args: ["**", "**", "bold text"],
    },
    {
      key: "i",
      label: "Italic",
      className: "italic",
      args: ["*", "*", "cursive text"],
    },
    {
      key: "u",
      label: "Underline",
      className: "underline",
      args: ["__", "__", "underlined text"],
    },
    {
      key: "s",
      label: "Strikethrough",
      className: "line-through",
      args: ["~~", "~~", "strikethrough text"],
    },
  ];

  // The listener below is attached once, so it has to reach surroundSelection through a ref.
  // Closing over it froze the onChange of the first render, and for an action's text that one
  // writes to whichever index the action had back then, so the shortcut edited the wrong action
  // after a move.
  const surround = useRef(surroundSelection);
  surround.current = surroundSelection;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    function onKeyDown(e: KeyboardEvent) {
      // metaKey too, ctrl isn't the modifier for this on macOS.
      if (!e.ctrlKey && !e.metaKey) return;

      const mark = marks.find((m) => m.key === e.key);
      if (!mark) return;

      e.preventDefault();
      surround.current(...mark.args);
    }

    input.addEventListener("keydown", onKeyDown);

    return () => {
      input.removeEventListener("keydown", onKeyDown);
    };
    // marks never changes and surroundSelection is reached through the ref.
  }, [inputRef]);

  return (
    <div className="flex space-x-2">
      {marks.map((mark) => (
        <button
          key={mark.key}
          type="button"
          aria-label={mark.label}
          className={CONTROL_CLASS}
          onClick={() => surroundSelection(...mark.args)}
        >
          <div className={mark.className}>{mark.label[0]}</div>
        </button>
      ))}
      <EditorMentionPicker onMentionInsert={onMentionInsert} guildId={guildId}>
        <button
          type="button"
          aria-label="Insert mention"
          className={CONTROL_CLASS}
        >
          <AtSymbolIcon className="h-5 w-5" />
        </button>
      </EditorMentionPicker>
      <EmojiPicker
        guildId={guildId}
        onEmojiSelect={onEmojiSelect}
        align="right"
      >
        <button
          type="button"
          aria-label="Insert emoji"
          className={CONTROL_CLASS}
        >
          <FaceSmileIcon className="h-5 w-5" />
        </button>
      </EmojiPicker>
    </div>
  );
}
