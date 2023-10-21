import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import Tooltip from "../components/Tooltip";
import { SavedMessageWire } from "../api/wire";
import { parseISO } from "date-fns";
import {
  useDeleteSavedMessageMutation,
  useUpdateSavedMessageMutation,
} from "../api/mutations";
import { useToasts } from "../util/toasts";
import { useNavigate } from "react-router-dom";
import { parseMessageWithAction } from "../discord/restoreSchema";
import { useCurrentMessageStore } from "../state/message";
import { useState } from "react";
import { useQueryClient } from "react-query";
import ConfirmModal from "./ConfirmModal";

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

  function updateMessageConfirm() {
    updateMessageMutation.mutate(
      {
        messageId: message.id,
        guildId: guildId,
        req: {
          name: message.name,
          description: message.description,
          data: useCurrentMessageStore.getState(),
        },
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries(["saved-messages", guildId]);
            setUpdateModal(false);
          } else {
            createToast({
              title: "Failed to update message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  const [restoreModal, setRestoreModal] = useState(false);

  function restoreMessageConfirm() {
    try {
      const data = parseMessageWithAction(message.data);
      useCurrentMessageStore.setState(data);
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
            queryClient.invalidateQueries(["saved-messages", guildId]);
          } else {
            createToast({
              title: "Failed to delete message",
              message: resp.error.message,
              type: "error",
            });
          }
          setDeleteModal(false);
        },
      }
    );
  }

  return (
    <div>
      <div
        key={message.id}
        className="bg-dark-3 p-3 rounded flex justify-between truncate space-x-3"
      >
        <div className="flex-auto truncate">
          <div className="flex items-center space-x-1 truncate">
            <div className="text-white truncate">{message.name}</div>
            <div className="text-gray-500 text-xs hidden md:block">
              {message.id}
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            {formatUpdatedAt(message.updated_at)}
          </div>
        </div>
        <div className="flex flex-none items-center space-x-4 md:space-x-3">
          <div
            className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
            role="button"
            onClick={() => setRestoreModal(true)}
          >
            <Tooltip text="Restore Message">
              <ArrowDownTrayIcon className="h-5 w-5" />
            </Tooltip>
            <div className="hidden md:block ml-2">Restore</div>
          </div>

          <div
            className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
            role="button"
            onClick={() => setUpdateModal(true)}
          >
            <Tooltip text="Overwrite Message">
              <ArrowUpTrayIcon className="h-5 w-5" />
            </Tooltip>
            <div className="hidden md:block ml-2">Overwrite</div>
          </div>

          <div
            className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
            role="button"
            onClick={() => setDeleteModal(true)}
          >
            <Tooltip text="Delete Message">
              <TrashIcon className="h-5 w-5" />
            </Tooltip>
            <div className="hidden md:block ml-2">Delete</div>
          </div>
        </div>
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
          onConfirm={updateMessageConfirm}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title="Are you sure that you want to delete the message?"
          subTitle="The message will be deleted permanently and can't be restored."
          onClose={() => setDeleteModal(false)}
          onConfirm={deleteMessageConfirm}
        />
      )}
    </div>
  );
}
