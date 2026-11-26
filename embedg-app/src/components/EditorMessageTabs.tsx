import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { currentMessageIsBlank } from "../state/currentMessage";
import {
  MAX_MESSAGE_TABS,
  activateTab,
  addTab,
  duplicateActiveTab,
  moveTab,
  removeTab,
  useMessageTabsStore,
} from "../state/messageTabs";
import { useToasts } from "../util/toasts";
import ConfirmModal from "./ConfirmModal";
import EditorIconButton from "./EditorIconButton";

/** Adds a message and opens the templates for it, like clearing the message does. */
export function useAddMessageTab() {
  const navigate = useNavigate();

  return () => {
    if (addTab() !== null) navigate("/editor/new");
  };
}

/**
 * Switches between the messages that are sent together. Only one is in the
 * editor at a time, so the rest of the editor stays as it is. Hidden while
 * there is only one message; the menu bar adds the second.
 */
export default function EditorMessageTabs() {
  const [tabs, activeId, sendIds] = useMessageTabsStore(
    useShallow((state) => [state.tabs, state.activeId, state.sendIds]),
  );
  const tabIds = tabs.map((tab) => tab.id);
  const addMessage = useAddMessageTab();
  const createToast = useToasts((state) => state.create);
  const [deleteModal, setDeleteModal] = useState(false);

  if (tabIds.length <= 1) return null;

  const activeIndex = tabIds.indexOf(activeId);
  const canAdd = tabIds.length < MAX_MESSAGE_TABS;

  function open(id: number) {
    try {
      activateTab(id);
    } catch (e) {
      createToast({
        type: "error",
        title: "Failed to open message",
        message: `${e}`,
      });
    }
  }

  function remove() {
    if (currentMessageIsBlank()) {
      removeTab(activeId);
    } else {
      setDeleteModal(true);
    }
  }

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3 justify-between items-center">
      <div
        role="tablist"
        aria-label="Messages"
        className="flex flex-wrap gap-1 bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400"
      >
        {tabIds.map((id, i) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === activeId}
            className={clsx(
              "py-1 px-3 rounded-md transition-colors flex items-center gap-1.5",
              id === activeId
                ? "bg-ink-700 text-mist-100"
                : "hover:text-mist-100",
            )}
            onClick={() => open(id)}
          >
            <span>Message {i + 1}</span>
            {!sendIds.includes(id) && (
              <span className="text-xs text-mist-500 font-normal">
                (not sent)
              </span>
            )}
          </button>
        ))}
        {canAdd && (
          <button
            type="button"
            aria-label="Add Message"
            className="py-1 px-2 rounded-md hover:text-mist-100 hover:bg-white/5 transition-colors"
            onClick={addMessage}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2.5 items-center">
        <EditorIconButton
          label="Move Message Left"
          disabled={activeIndex <= 0}
          onClick={() => moveTab(activeId, -1)}
        >
          <ChevronLeftIcon />
        </EditorIconButton>
        <EditorIconButton
          label="Move Message Right"
          disabled={activeIndex >= tabIds.length - 1}
          onClick={() => moveTab(activeId, 1)}
        >
          <ChevronRightIcon />
        </EditorIconButton>
        <EditorIconButton
          label="Duplicate Message"
          disabled={!canAdd}
          onClick={() => duplicateActiveTab()}
        >
          <DocumentDuplicateIcon />
        </EditorIconButton>
        <EditorIconButton label="Delete Message" onClick={remove}>
          <TrashIcon />
        </EditorIconButton>
      </div>

      {deleteModal && (
        <ConfirmModal
          title={`Delete Message ${activeIndex + 1}?`}
          subTitle="The message and its attachments are removed from the editor. Messages that were already sent stay in Discord."
          onClose={() => setDeleteModal(false)}
          onConfirm={() => {
            removeTab(activeId);
            setDeleteModal(false);
          }}
        />
      )}
    </div>
  );
}
