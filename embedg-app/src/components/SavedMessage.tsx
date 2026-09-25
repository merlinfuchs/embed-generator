import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClipboardIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import Tooltip from "../components/Tooltip";
import type {
  SavedMessageUpdateRequestWire,
  SavedMessageWire,
} from "../api/wire";
import { parseISO } from "date-fns";
import {
  useDeleteSavedMessageMutation,
  useUpdateSavedMessageMutation,
} from "../api/mutations";
import { useToasts } from "../util/toasts";
import { MAX_SAVED_MESSAGE_NAME_LENGTH } from "../api/limits";
import { useNavigate } from "react-router-dom";
import { parseMessageWithAction } from "../discord/importSchema";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "./ConfirmModal";
import { getCurrentMessage, setCurrentMessage } from "../state/currentMessage";

function formatUpdatedAt(updatedAt: string): string {
  return parseISO(updatedAt).toLocaleString();
}

export default function SavedMessage({
  message,
  guildId,
}: {
  message: SavedMessageWire;
  guildId: string | null;
}) {
  const navigate = useNavigate();
  const createToast = useToasts((state) => state.create);
  const queryClient = useQueryClient();

  const updateMessageMutation = useUpdateSavedMessageMutation();
  const [updateModal, setUpdateModal] = useState(false);

  function updateMessage(
    req: Pick<SavedMessageUpdateRequestWire, "name" | "data">,
    errorTitle: string,
    onDone: () => void,
  ) {
    updateMessageMutation.mutate(
      {
        messageId: message.id,
        guildId: guildId,
        req: { ...req, description: message.description },
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries({
              queryKey: ["saved-messages", guildId],
            });
            onDone();
          } else {
            createToast({
              title: errorTitle,
              message: resp.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  function updateMessageConfirm() {
    updateMessage(
      { name: message.name, data: getCurrentMessage() },
      "Failed to update message",
      () => setUpdateModal(false),
    );
  }

  // null while not renaming
  const [newName, setNewName] = useState<string | null>(null);
  const renaming = newName !== null;
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) nameInputRef.current?.select();
  }, [renaming]);

  function renameMessage() {
    if (!newName || updateMessageMutation.isPending) return;
    if (newName === message.name) {
      setNewName(null);
      return;
    }

    updateMessage({ name: newName }, "Failed to rename message", () =>
      setNewName(null),
    );
  }

  const [restoreModal, setRestoreModal] = useState(false);

  function restoreMessageConfirm() {
    try {
      const data = parseMessageWithAction(message.data);
      setCurrentMessage(data);
      setRestoreModal(false);
      navigate("/editor");
    } catch (e) {
      createToast({
        title: "Failed to restore message",
        message: `${e}`,
        type: "error",
      });
    }
  }

  const deleteMessageMutation = useDeleteSavedMessageMutation();
  const [deleteModal, setDeleteModal] = useState(false);

  function deleteMessageConfirm() {
    deleteMessageMutation.mutate(
      { messageId: message.id, guildId },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries({
              queryKey: ["saved-messages", guildId],
            });
          } else {
            createToast({
              title: "Failed to delete message",
              message: resp.error.message,
              type: "error",
            });
          }
          setDeleteModal(false);
        },
      },
    );
  }

  return (
    <div>
      <div
        key={message.id}
        className="bg-ink-700 p-3 rounded-lg flex justify-between truncate space-x-3"
      >
        {renaming ? (
          <>
            <input
              ref={nameInputRef}
              aria-label="Message Name"
              className="flex-auto bg-ink-900 px-3 py-2 rounded-lg w-full text-white"
              value={newName}
              maxLength={MAX_SAVED_MESSAGE_NAME_LENGTH}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") renameMessage();
                else if (e.key === "Escape") setNewName(null);
              }}
            />
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <RowButton
                icon={XMarkIcon}
                tooltip="Discard Changes"
                label="Cancel"
                onClick={() => setNewName(null)}
              />
              <button
                type="button"
                className="flex items-center text-white cursor-pointer bg-azure-500 hover:bg-azure-400 rounded-lg px-2 py-1 disabled:bg-ink-900 disabled:cursor-not-allowed"
                disabled={!newName || updateMessageMutation.isPending}
                onClick={renameMessage}
              >
                <Tooltip text="Save Name">
                  <ClipboardIcon className="h-5 w-5" />
                </Tooltip>
                <div className="ml-2">Save</div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-auto truncate">
              <div className="flex items-center space-x-1 truncate">
                <div className="text-white truncate">{message.name}</div>
                <div className="text-mist-500 text-xs hidden md:block">
                  {message.id}
                </div>
              </div>
              <div className="text-mist-400 text-sm">
                {formatUpdatedAt(message.updated_at)}
              </div>
            </div>
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <RowButton
                icon={ArrowDownTrayIcon}
                tooltip="Restore Message"
                label="Restore"
                onClick={() => setRestoreModal(true)}
              />

              <RowButton
                icon={ArrowUpTrayIcon}
                tooltip="Overwrite Message"
                label="Overwrite"
                onClick={() => setUpdateModal(true)}
              />

              <RowButton
                icon={PencilSquareIcon}
                tooltip="Rename Message"
                label="Rename"
                onClick={() => setNewName(message.name)}
              />

              <RowButton
                icon={TrashIcon}
                tooltip="Delete Message"
                label="Delete"
                onClick={() => setDeleteModal(true)}
              />
            </div>
          </>
        )}
      </div>

      {restoreModal && (
        <ConfirmModal
          title="Are you sure that you want to restore the message?"
          subTitle="The message data that you are currently working on in the editor will be replaced."
          onClose={() => setRestoreModal(false)}
          onConfirm={restoreMessageConfirm}
        />
      )}
      {updateModal && (
        <ConfirmModal
          title="Are you sure that you want to update the message?"
          subTitle="The message will be overwritten and the previous data will be lost."
          onClose={() => setUpdateModal(false)}
          pending={updateMessageMutation.isPending}
          onConfirm={updateMessageConfirm}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title="Are you sure that you want to delete the message?"
          subTitle="The message will be deleted permanently and can't be restored."
          onClose={() => setDeleteModal(false)}
          pending={deleteMessageMutation.isPending}
          onConfirm={deleteMessageConfirm}
        />
      )}
    </div>
  );
}

function RowButton({
  icon: Icon,
  tooltip,
  label,
  onClick,
}: {
  icon: typeof TrashIcon;
  tooltip: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
      onClick={onClick}
    >
      <Tooltip text={tooltip}>
        <Icon className="h-5 w-5" />
      </Tooltip>
      <div className="hidden md:block ml-2">{label}</div>
    </button>
  );
}
