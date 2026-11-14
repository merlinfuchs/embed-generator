import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFormCreateMutation } from "../api/mutations";
import type { FormFieldWire } from "../api/wire";
import { useFormActionsStore } from "../state/actions";
import { useSendSettingsStore } from "../state/sendSettings";
import { useToasts } from "../util/toasts";
import FormEditor from "./FormEditor";
import Tooltip from "./Tooltip";

const newFields = (): FormFieldWire[] => [
  { key: "message", label: "Message", paragraph: true, required: true },
];

export default function FormCreate({
  setCreate,
  cancelable,
}: {
  setCreate: (b: boolean) => void;
  cancelable: boolean;
}) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<FormFieldWire[]>(newFields);

  const queryClient = useQueryClient();
  const createMutation = useFormCreateMutation();

  function create() {
    if (!guildId) return;

    const actions = useFormActionsStore.getState().actions.new;

    createMutation.mutate(
      { guildId, req: { name, title, fields, actions: actions || null } },
      {
        onSuccess: (res) => {
          if (res.success) {
            setName("");
            setTitle("");
            setFields(newFields());
            // The store is persisted under a fixed key, so without this the next new form
            // starts with the actions of the one just created.
            useFormActionsStore.getState().setActionSet("new", {
              actions: [],
            });
            setCreate(false);
            queryClient.invalidateQueries({ queryKey: ["forms", guildId] });
          } else {
            createToast({
              title: "Failed to create form",
              message: res.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  return (
    <div className="bg-ink-700 p-5 rounded-lg">
      <div className="flex items-center space-x-2 truncate text-lg mb-5 justify-between">
        <div className="text-white truncate">{name || "New Form"}</div>
        <div className="flex flex-none items-center space-x-4 md:space-x-3">
          {cancelable && (
            <button
              type="button"
              className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
              onClick={() => setCreate(false)}
            >
              <Tooltip text="Cancel">
                <XMarkIcon className="h-5 w-5" />
              </Tooltip>
              <div className="hidden md:block ml-2">Cancel</div>
            </button>
          )}
          <button
            type="button"
            className="flex items-center text-white cursor-pointer bg-azure-500 hover:bg-azure-400 rounded-lg px-2 py-1"
            onClick={create}
          >
            <Tooltip text="Create Form">
              <ArrowUpTrayIcon className="h-5 w-5" />
            </Tooltip>
            <div className="ml-2">
              Create <span className="hidden md:inline-block">Form</span>
            </div>
          </button>
        </div>
      </div>
      <FormEditor
        formId="new"
        name={name}
        setName={setName}
        title={title}
        setTitle={setTitle}
        fields={fields}
        setFields={setFields}
      />
    </div>
  );
}
