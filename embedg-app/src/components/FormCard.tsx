import {
  ClipboardIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useFormDeleteMutation, useFormUpdateMutation } from "../api/mutations";
import type { FormWire } from "../api/wire";
import { messageActionSetSchema } from "../discord/importSchema";
import { useSendSettingsStore } from "../state/sendSettings";
import { useFormActionsStore } from "../state/actions";
import { AutoAnimate } from "../util/autoAnimate";
import { useToasts } from "../util/toasts";
import ConfirmModal from "./ConfirmModal";
import FormEditor from "./FormEditor";
import Tooltip from "./Tooltip";

export default function FormCard({ form }: { form: FormWire }) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const [manage, setManage] = useState(false);

  const [name, setName] = useState(form.name);
  const [title, setTitle] = useState(form.title);
  const [fields, setFields] = useState(form.fields);

  const queryClient = useQueryClient();
  const updateMutation = useFormUpdateMutation();

  // Seed the action store from the server once per form, so a refetch doesn't throw away unsaved
  // action edits in every form that happens to be open.
  const seededActionsFor = useRef<string | null>(null);
  useEffect(() => {
    if (seededActionsFor.current === form.id) return;

    const res = messageActionSetSchema.safeParse(form.actions);
    if (res.success) {
      seededActionsFor.current = form.id;
      useFormActionsStore.getState().setActionSet(form.id, res.data);
    }
  }, [form.id, form.actions]);

  // Leaving manage mode without saving has to put the fields back, the edits live in local state.
  // The actions belong to the shared store, so they are re-seeded from the server instead.
  function cancel() {
    setName(form.name);
    setTitle(form.title);
    setFields(form.fields);

    const res = messageActionSetSchema.safeParse(form.actions);
    if (res.success) {
      useFormActionsStore.getState().setActionSet(form.id, res.data);
    }

    setManage(false);
  }

  function save() {
    const actions = useFormActionsStore.getState().actions[form.id];

    updateMutation.mutate(
      {
        guildId: guildId!,
        formId: form.id,
        req: { name, title, fields, actions: actions || null },
      },
      {
        onSuccess(res) {
          if (res.success) {
            setManage(false);
            queryClient.invalidateQueries({ queryKey: ["forms", guildId] });
          } else {
            createToast({
              title: "Failed to update form",
              message: res.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  const deleteMutation = useFormDeleteMutation();
  const [deleteModal, setDeleteModal] = useState(false);

  function deleteFormConfirm() {
    deleteMutation.mutate(
      { formId: form.id, guildId: guildId! },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries({ queryKey: ["forms", guildId] });
          } else {
            createToast({
              title: "Failed to delete form",
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
              <div className="text-white truncate text-lg mb-5">
                {form.name}
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
                  <Tooltip text="Save Form">
                    <ClipboardIcon className="h-5 w-5" />
                  </Tooltip>
                  <div className="ml-2">
                    Save <span className="hidden md:inline-block">Changes</span>
                  </div>
                </button>
              </div>
            </div>
            <FormEditor
              formId={form.id}
              name={name}
              setName={setName}
              title={title}
              setTitle={setTitle}
              fields={fields}
              setFields={setFields}
            />
          </div>
        ) : (
          <div className="flex justify-between items-start py-4 px-5" key="2">
            <div className="flex-auto truncate">
              <div className="text-white truncate text-lg mb-1">
                {form.name}
              </div>
              <div className="text-mist-400 text-sm font-light whitespace-normal">
                {form.title} · {form.fields.length}{" "}
                {form.fields.length === 1 ? "field" : "fields"}
              </div>
            </div>
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setDeleteModal(true)}
              >
                <Tooltip text="Delete Form">
                  <TrashIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Delete</div>
              </button>
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setManage(true)}
              >
                <Tooltip text="Manage Form">
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
          title="Are you sure that you want to delete the form?"
          subTitle="The form will be deleted permanently and can't be restored. Buttons and commands that open it stop working."
          onClose={() => setDeleteModal(false)}
          pending={deleteMutation.isPending}
          onConfirm={deleteFormConfirm}
        />
      )}
    </div>
  );
}
