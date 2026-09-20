import { lazy, Suspense } from "react";
import { useDebouncedCurrentDocument } from "../state/currentMessage";

const LazyMessagePreview = lazy(() => import("./MessagePreview"));

export default function EditorMessagePreview() {
  // We debounce the message preview to prevent it from updating too often.
  const msg = useDebouncedCurrentDocument(250)?.message;

  if (!msg) return null;

  return (
    <Suspense>
      <LazyMessagePreview msg={msg} />
    </Suspense>
  );
}
