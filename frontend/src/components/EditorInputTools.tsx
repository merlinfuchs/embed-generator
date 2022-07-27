import { LinkIcon } from "@heroicons/react/outline";
import { RefObject, useEffect, useState } from "react";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useToken from "../hooks/useToken";
import EditorEmojiPicker from "./EditorEmojiPicker";

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  input: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

export default function EditorInputTools({ value, onChange, input }: Props) {
  const [[selectionStart, selectionEnd], setSelection] = useState<
    [number, number | undefined]
  >([0, undefined]);

  const [token] = useToken();
  const [guild] = useSelectedGuild();

  useEffect(() => {
    const current = input.current;
    if (!current) return;

    function handleSelection(e: any) {
      if (!e) return;
      setSelection([
        e.target.selectionStart || 0,
        e.target.selectionEnd ?? undefined,
      ]);
    }

    current.addEventListener("select", handleSelection);
    current.addEventListener("mouseup", handleSelection);
    return () => {
      current?.removeEventListener("select", handleSelection);
      current?.removeEventListener("mouseup", handleSelection);
    };
  }, [input]);

  function suroundWith(left: string, right?: string) {
    onChange(
      value.slice(0, selectionStart) +
        left +
        (value.slice(selectionStart, selectionEnd) || "some text") +
        (right || left) +
        (selectionEnd !== undefined ? value.slice(selectionEnd) : "")
    );
  }

  function insert(toInsert: string) {
    onChange(
      value.slice(0, selectionStart) + toInsert + value.slice(selectionStart)
    );
  }

  return (
    <div className="space-x-2 flex">
      {!!token && !!guild && <EditorEmojiPicker onSelect={insert} />}
      <button
        onClick={() => suroundWith("**")}
        className="bold bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center"
      >
        B
      </button>
      <button
        onClick={() => suroundWith("*")}
        className="italic bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center"
      >
        i
      </button>
      <button
        onClick={() => suroundWith("__")}
        className="underline bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center"
      >
        U
      </button>
      <button
        onClick={() => suroundWith("~~")}
        className="line-through bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center"
      >
        T
      </button>
      <button
        onClick={() => suroundWith("[", "](https://message.style)")}
        className="line-through bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
