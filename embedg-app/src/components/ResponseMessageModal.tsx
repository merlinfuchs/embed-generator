import { useEffect, useRef, useState } from "react";
import {
  type Message,
  type ResponseMessage,
  responseMessageSchema,
} from "../discord/schema";
import { useDocumentValidation } from "../state/currentMessage";
import {
  createDocumentStore,
  DocumentStoreContext,
  useComponentsV2Enabled,
} from "../state/document";
import { toMessage } from "../state/documentConvert";
import { RESPONSE_MESSAGE_CAPABILITIES } from "../state/editorCapabilities";
import {
  createValidationErrorStore,
  ValidationErrorStoreContext,
} from "../state/validationError";
import EditorComponents from "./EditorComponents";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";
import EditorEmbeds from "./EditorEmbeds";
import EditorMessageContentField from "./EditorMessageContentField";
import EditorMessagePreview from "./EditorMessagePreview";
import Modal from "./Modal";

interface Props {
  message: ResponseMessage;
  onChange: (message: ResponseMessage) => void;
  onClose: () => void;
}

/** The message editor, for the message an action responds with. */
export default function ResponseMessageModal({
  message,
  onChange,
  onClose,
}: Props) {
  // Seeded once, the editor owns the message from then on and reports it back.
  const [store] = useState(() =>
    createDocumentStore(null, { ...message, tts: false, actions: {} }),
  );
  const [validationStore] = useState(createValidationErrorStore);

  const document = useDocumentValidation(
    store,
    responseMessageSchema,
    validationStore,
  );

  const change = useRef(onChange);
  change.current = onChange;

  // Opening the message to look at it isn't a change.
  const edited = useRef(false);
  useEffect(
    () =>
      store.subscribe(() => {
        edited.current = true;
      }),
    [store],
  );

  // Reported as the message settles, rather than converting it per keystroke.
  useEffect(() => {
    if (document && edited.current) {
      change.current(toResponseMessage(document.message));
    }
  }, [document]);

  // The last edits can be younger than the debounce.
  useEffect(
    () => () => {
      if (edited.current) {
        change.current(toResponseMessage(toMessage(store.getState()).message));
      }
    },
    [store],
  );

  return (
    <Modal height="full" onClose={onClose}>
      <DocumentStoreContext.Provider value={store}>
        <ValidationErrorStoreContext.Provider value={validationStore}>
          <ResponseMessageEditor onClose={onClose} />
        </ValidationErrorStoreContext.Provider>
      </DocumentStoreContext.Provider>
    </Modal>
  );
}

function ResponseMessageEditor({ onClose }: { onClose: () => void }) {
  const componentsV2Enabled = useComponentsV2Enabled();

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-y-auto no-scrollbar p-5 space-y-5">
        <div className="flex flex-wrap items-center gap-3 pr-8">
          <div className="text-lg text-white flex-auto">Response Message</div>
          <EditorComponentsV2Toggle />
        </div>
        {!componentsV2Enabled && <EditorMessageContentField />}
        {!componentsV2Enabled && <EditorEmbeds />}
        <EditorComponents
          defaultCollapsed={!componentsV2Enabled}
          capabilities={RESPONSE_MESSAGE_CAPABILITIES}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-azure-500 hover:bg-azure-400 text-white transition-colors"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
      <div className="hidden lg:block flex-1 min-w-0 border-l border-white/5 px-5 py-2 overflow-y-auto no-scrollbar">
        <EditorMessagePreview />
      </div>
    </div>
  );
}

/** The parts of the message that a response sends. */
function toResponseMessage({
  username,
  avatar_url,
  tts,
  thread_name,
  actions,
  ...response
}: Message): ResponseMessage {
  return response;
}
