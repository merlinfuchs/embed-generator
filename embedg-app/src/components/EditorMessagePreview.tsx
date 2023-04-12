import { useRef, useState } from "react";
import { Message } from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import MessagePreview from "./MessagePreview";

export default function EditorMessagePreview() {
  const [msg, setMsg] = useState<Message>();
  const timeout = useRef(0);

  // We debounce the message preview to prevent it from updating too often.
  useCurrentMessageStore((state) => {
    clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      setMsg(state);
    }, 250);
  });

  if (msg) {
    return <MessagePreview msg={msg} />;
  } else {
    return null;
  }
}
