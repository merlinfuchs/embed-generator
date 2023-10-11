import { useState } from "react";
import { useCustomCommandCreateMutation } from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "react-query";
import { useToasts } from "../util/toasts";
import EditorInput from "./EditorInput";
import CommandActionSet from "./CommandActionSet";
import { useCommandActionStore } from "../state/message";

export default function CustomCommandCreate({
  setCreate,
}: {
  setCreate: (b: boolean) => void;
}) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const queryClient = useQueryClient();
  const createMutation = useCustomCommandCreateMutation();

  function create() {
    if (name.length == 0 || description.length == 0 || !guildId) return;

    const actions = useCommandActionStore.getState().actions["new"];

    createMutation.mutate(
      {
        guildId: guildId,
        req: {
          name,
          description,
          parameters: [],
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
      <div className="flex items-center space-x-2 truncate text-lg mb-5 truncate">
        <div className="text-white truncate">
          <span className="font-bold text-gray-500 text-xl">/</span> {name}
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
        <CommandActionSet cmdId={"new"} />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          className="px-3 py-2 rounded border-2 border-dark-7 hover:bg-dark-6 cursor-pointer text-white"
          onClick={() => setCreate(false)}
        >
          Cancel
        </button>
        <button
          className="px-3 py-2 rounded bg-blurple hover:bg-blurple-dark text-white"
          onClick={create}
        >
          Create Command
        </button>
      </div>
    </div>
  );
}
