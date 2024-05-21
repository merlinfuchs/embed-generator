import { useState } from "react";
import { useCustomCommandCreateMutation } from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "react-query";
import { useToasts } from "../util/toasts";
import EditorInput from "./EditorInput";
import CommandActionSet from "./CommandActionSet";
import { useCommandActionsStore } from "../state/actions";
import Tooltip from "./Tooltip";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import CustomCommandParameters from "./CustomCommandParameters";
import { CustomCommandParameterWire } from "../api/wire";

export default function CustomCommandCreate({
  setCreate,
  cancelable,
}: {
  setCreate: (b: boolean) => void;
  cancelable: boolean;
}) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<CustomCommandParameterWire[]>(
    []
  );

  const queryClient = useQueryClient();
  const createMutation = useCustomCommandCreateMutation();

  function create() {
    if (name.length == 0 || description.length == 0 || !guildId) return;

    const actions = useCommandActionsStore.getState().actions["new"];

    createMutation.mutate(
      {
        guildId: guildId,
        req: {
          name,
          description,
          parameters: parameters,
          actions: actions || null,
        },
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setName("");
            setDescription("");
            setCreate(false);
            queryClient.invalidateQueries(["custom-bot", guildId, "commands"]);
          } else {
            createToast({
              title: "Failed to create command",
              message: res.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  return (
    <div className="bg-dark-3 p-5 rounded-lg">
      <div className="flex items-center space-x-2 truncate text-lg mb-5 justify-between">
        <div className="text-white truncate">
          <span className="font-bold text-gray-500 text-xl">/</span> {name}
        </div>
        <div className="flex flex-none items-center space-x-4 md:space-x-3">
          {cancelable && (
            <div
              className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
              role="button"
              onClick={() => setCreate(false)}
            >
              <Tooltip text="Cancel">
                <XMarkIcon className="h-5 w-5" />
              </Tooltip>
              <div className="hidden md:block ml-2">Cancel</div>
            </div>
          )}
          <div
            className="flex items-center text-white cursor-pointer bg-blurple hover:bg-blurple-dark rounded px-2 py-1"
            role="button"
            onClick={create}
          >
            <Tooltip text="Create Custom Command">
              <ArrowUpTrayIcon className="h-5 w-5" />
            </Tooltip>
            <div className="ml-2">
              Create <span className="hidden md:inline-block">Command</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-5 mb-5">
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
          cmdId="new"
        />
        <CommandActionSet cmdId="new" />
      </div>
    </div>
  );
}
