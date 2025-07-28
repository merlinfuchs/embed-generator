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
    if (msg.flags && (msg.flags & (1 << 15)) !== 0) {
      return (
        <div className="p-3 text-gray-300 font-light leading-6">
          Message preview is currently not available when using Components V2.
          Just send your message to a test channel to see how it looks.
        </div>
      );
    } else {
      return (
        <Suspense>
          <LazyMessagePreview msg={msg} />
        </Suspense>
      );
    }
  } else {
    return null;
  }
}
