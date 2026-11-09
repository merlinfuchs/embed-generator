import { Suspense } from "react";
import { useDebouncedDocument } from "../state/currentMessage";
import { useDocumentStoreApi } from "../state/document";
import { lazyView } from "../util/lazyView";
import {
  type MessageAttachment,
  PreviewAttachmentsContext,
  useCurrentAttachmentsStore,
} from "../state/attachments";

const LazyMessagePreview = lazyView(() => import("./MessagePreview"));

const NO_ATTACHMENTS: MessageAttachment[] = [];

interface Props {
  /** Whether the message is sent with the attachments of the editor, which a response is not. */
  attachments?: boolean;
}

export default function EditorMessagePreview({ attachments = true }: Props) {
  // We debounce the message preview to prevent it from updating too often.
  const msg = useDebouncedDocument(useDocumentStoreApi(), 250)?.message;
  const files = useCurrentAttachmentsStore((state) => state.attachments);

  if (!msg) return null;

  return (
    <Suspense>
      <PreviewAttachmentsContext.Provider
        value={attachments ? files : NO_ATTACHMENTS}
      >
        <LazyMessagePreview msg={msg} />
      </PreviewAttachmentsContext.Provider>
    </Suspense>
  );
}
