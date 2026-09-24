import type { CustomCommandWire } from "../api/wire";
import Tooltip from "./Tooltip";
import {
  ClipboardIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import {
  useCustomCommandDeleteMutation,
  useCustomCommandUpdateMutation,
} from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "@tanstack/react-query";
import { useToasts } from "../util/toasts";
import EditorInput from "./EditorInput";
import CommandActionSet from "./CommandActionSet";
import CustomCommandParameters from "./CustomCommandParameters";
import { useCommandActionsStore } from "../state/actions";
import { messageActionSetSchema } from "../discord/importSchema";
import ConfirmModal from "./ConfirmModal";

export default function CustomCommand({ cmd }: { cmd: CustomCommandWire }) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const [manage, setManage] = useState(false);

  const [name, setName] = useState(cmd.name);
  const [description, setDescription] = useState(cmd.description);
  const [parameters, setParameters] = useState(cmd.parameters);

  const queryClient = useQueryClient();
  const updateMutation = useCustomCommandUpdateMutation();

  // Seed the action store from the server once per command. Re-running whenever cmd.actions
  // changes identity meant any refetch, including the one after saving another command, threw away
  // unsaved action edits in every command that happened to be open.
  const seededActionsFor = useRef<string | null>(null);
  useEffect(() => {
    if (seededActionsFor.current === cmd.id) return;

    const res = messageActionSetSchema.safeParse(cmd.actions);
    if (res.success) {
      seededActionsFor.current = cmd.id;
      useCommandActionsStore.getState().setActionSet(cmd.id, res.data);
    }
  }, [cmd.id, cmd.actions]);

  // Leaving manage mode without saving has to put the fields back, the edits live in local state.
  // The actions belong to the shared store, so they are re-seeded from the server instead.
  function cancel() {
    setName(cmd.name);
    setDescription(cmd.description);
    setParameters(cmd.parameters);

    const res = messageActionSetSchema.safeParse(cmd.actions);
    if (res.success) {
      useCommandActionsStore.getState().setActionSet(cmd.id, res.data);
    }

    setManage(false);
  }

  function save() {
    if (name.length === 0 || description.length === 0) {
      createToast({
        title: "Missing fields",
        message: "A command needs both a name and a description.",
        type: "error",
      });
      return;
    }

    const actions = useCommandActionsStore.getState().actions[cmd.id];

    updateMutation.mutate(
      {
        guildId: guildId!,
        commandId: cmd.id,
        req: {
          name,
          description,
          enabled: true,
          parameters: parameters,
          actions: actions || null,
        },
      },
      {
        onSuccess(res) {
          if (res.success) {
            setManage(false);
            queryClient.invalidateQueries({
              queryKey: ["custom-bot", guildId, "commands"],
            });
          } else {
            createToast({
              title: "Failed to update command",
              message: res.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  const deleteMutation = useCustomCommandDeleteMutation();
  const [deleteModal, setDeleteModal] = useState(false);

  function deleteCommandConfirm() {
    deleteMutation.mutate(
      {
        commandId: cmd.id,
        guildId: guildId!,
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries({
              queryKey: ["custom-bot", guildId, "commands"],
            });
          } else {
            createToast({
              title: "Failed to delete command",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  return (
    <div>
      <AutoAnimate className="bg-ink-700 rounded-lg">
        {manage ? (
          <div className="px-5 py-4" key="1">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 truncate text-lg mb-5">
                <div className="text-white truncate">
                  <span className="font-bold text-mist-500 text-xl">/</span>{" "}
                  {cmd.name}
                </div>
              </div>
              <div className="flex flex-none items-center space-x-4 md:space-x-3">
                <button
                  type="button"
                  className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                  onClick={cancel}
                >
                  <Tooltip text="Discard Changes">
                    <XMarkIcon className="h-5 w-5" />
                  </Tooltip>
                  <div className="hidden md:block ml-2">Cancel</div>
                </button>
                <button
                  type="button"
                  className="flex items-center text-white cursor-pointer bg-azure-500 hover:bg-azure-400 rounded-lg px-2 py-1"
                  onClick={save}
                >
                  <Tooltip text="Save Command">
                    <ClipboardIcon className="h-5 w-5" />
                  </Tooltip>
                  <div className="ml-2">
                    Save <span className="hidden md:inline-block">Changes</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="space-y-5">
              <EditorInput
                label="Name"
                type="text"
                maxLength={32}
                value={name}
                onChange={setName}
              />
              <EditorInput
                label="Description"
                type="text"
                maxLength={100}
                value={description}
                onChange={setDescription}
              />
              <CustomCommandParameters
                parameters={parameters || []}
                setParameters={setParameters}
                cmdId={cmd.id}
              />
              <CommandActionSet cmdId={cmd.id} />
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start py-4 px-5" key="2">
            <div className="flex-auto truncate">
              <div className="flex items-center space-x-2 truncate text-lg mb-1">
                <div className="text-white truncate">
                  <span className="font-bold text-mist-500 text-xl">/</span>{" "}
                  {cmd.name}
                </div>
              </div>
              <div className="text-mist-400 text-sm font-light whitespace-normal">
                {cmd.description}
              </div>
            </div>
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setDeleteModal(true)}
              >
                <Tooltip text="Delete Command">
                  <TrashIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Delete</div>
              </button>
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setManage(true)}
              >
                <Tooltip text="Manage Command">
                  <PencilSquareIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Manage</div>
              </button>
            </div>
          </div>
        )}
      </AutoAnimate>
      {deleteModal && (
        <ConfirmModal
          title="Are you sure that you want to delete the command?"
          subTitle="The command will be deleted permanently and can't be restored."
          onClose={() => setDeleteModal(false)}
          pending={deleteMutation.isPending}
          onConfirm={deleteCommandConfirm}
        />
      )}
    </div>
  );
}
