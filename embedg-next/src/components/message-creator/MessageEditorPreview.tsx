import debounce from "just-debounce-it";
import MessagePreview from "./MessagePreview";
import { useState } from "react";
import { Message } from "@/lib/schema/message";
import { useCurrentMessageStore } from "@/lib/state/message";

export default function MessageEditorPreview() {
  const [msg, setMsg] = useState<Message>();

  const debouncedSetMessage = debounce(setMsg, 250);

  // We debounce the message preview to prevent it from updating too often.
  useCurrentMessageStore((state) => debouncedSetMessage(state));

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#313338] h-full rounded-lg overflow-x-hidden no-scrollbar px-3 scrollbar-none border">
      {msg && <MessagePreview msg={msg} />}
    </div>
  );
}
