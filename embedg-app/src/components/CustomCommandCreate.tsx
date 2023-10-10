import { useState } from "react";
import { useCustomCommandCreateMutation } from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "react-query";
import { useToasts } from "../util/toasts";

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

    createMutation.mutate(
      {
        guildId: guildId,
        req: {
          name,
          description,
          parameters: [],
          actions: [],
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
      <div className="text-lg text-gray-300 mb-5">New Command</div>
      <div className="space-y-5 mb-5">
        <div>
          <div className="mb-1.5 flex">
            <div className="uppercase text-gray-300 text-sm font-medium">
              Name
            </div>
            <div className="text-sm italic font-light text-gray-400 ml-2">
              {name.length} / 32
            </div>
          </div>
          <input
            type="text"
            className="bg-dark-2 px-3 py-2 rounded text-white ring-0 border-transparent focus:outline-none w-full max-w-sm"
            minLength={1}
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1.5 flex">
            <div className="uppercase text-gray-300 text-sm font-medium">
              Description
            </div>
            <div className="text-sm italic font-light text-gray-400 ml-2">
              {description.length} / 100
            </div>
          </div>
          <input
            type="text"
            className="bg-dark-2 px-3 py-2 rounded w-full text-white ring-0 border-transparent focus:outline-none"
            minLength={1}
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
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
