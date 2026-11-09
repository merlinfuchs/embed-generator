import { Suspense } from "react";
import { useDebouncedDocument } from "../state/currentMessage";
import { useDocumentStoreApi } from "../state/document";
import { lazyView } from "../util/lazyView";
import {
  PreviewAttachmentsContext,
  useCurrentAttachmentsStore,
} from "../state/attachments";

const LazyMessagePreview = lazyView(() => import("./MessagePreview"));

interface Props {
  /** Whether the message is sent with the attachments of the editor, which a response is not. */
  attachments?: boolean;
}

export default function EditorMessagePreview({ attachments = true }: Props) {
  // We debounce the message preview to prevent it from updating too often.
  const msg = useDebouncedDocument(useDocumentStoreApi(), 250)?.message;
  const files = useCurrentAttachmentsStore((state) =>
    attachments ? state.attachments : undefined,
  );

  if (!msg) return null;

  const preview = <LazyMessagePreview msg={msg} />;

  return (
    <Suspense>
      {files ? (
        <PreviewAttachmentsContext.Provider value={files}>
          {preview}
        </PreviewAttachmentsContext.Provider>
      ) : (
        preview
      )}
    </Suspense>
  );
}
