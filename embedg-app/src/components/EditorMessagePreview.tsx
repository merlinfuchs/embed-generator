import { lazy, Suspense } from "react";
import { useDebouncedCurrentMessage } from "../state/currentMessage";

const LazyMessagePreview = lazy(() => import("./MessagePreview"));

export default function EditorMessagePreview() {
  // We debounce the message preview to prevent it from updating too often.
  const msg = useDebouncedCurrentMessage(250);

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
