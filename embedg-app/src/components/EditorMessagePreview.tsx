import { debounce } from "debounce";
import { lazy, Suspense, useState } from "react";
import { Message } from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";

const LazyMessagePreview = lazy(() => import("./MessagePreview"));

export default function EditorMessagePreview() {
  const [msg, setMsg] = useState<Message>();

  const debouncedSetMessage = debounce(setMsg, 250);

  // We debounce the message preview to prevent it from updating too often.
  useCurrentMessageStore((state) => debouncedSetMessage(state));

  if (msg) {
    return (
      <Suspense>
        <LazyMessagePreview msg={msg} />
      </Suspense>
    );
  } else {
    return null;
  }
}
