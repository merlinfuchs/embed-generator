import { Suspense } from "react";
import { useDebouncedDocument } from "../state/currentMessage";
import { useDocumentStoreApi } from "../state/document";
import { lazyView } from "../util/lazyView";

const LazyMessagePreview = lazyView(() => import("./MessagePreview"));

interface Props {
  /** Whether the message is sent with the attachments of the editor, which a response is not. */
  attachments?: boolean;
}

export default function EditorMessagePreview({ attachments = true }: Props) {
  // We debounce the message preview to prevent it from updating too often.
  const msg = useDebouncedDocument(useDocumentStoreApi(), 250)?.message;

  if (!msg) return null;

  return (
    <Suspense>
      <LazyMessagePreview msg={msg} showAttachments={attachments} />
    </Suspense>
  );
}
