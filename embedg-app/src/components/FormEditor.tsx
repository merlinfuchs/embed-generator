import type { FormFieldWire } from "../api/wire";
import { useFormActionsStore } from "../state/actions";
import CommandActionSet from "./CommandActionSet";
import EditorInput from "./EditorInput";
import FormFields, { answersText } from "./FormFields";
import FormPreview from "./FormPreview";
import FormSigningSecret from "./FormSigningSecret";

interface Props {
  formId: string;
  name: string;
  setName: (name: string) => void;
  title: string;
  setTitle: (title: string) => void;
  fields: FormFieldWire[];
  setFields: (fields: FormFieldWire[]) => void;
  /** Null until the form is saved. */
  signingSecret: string | null;
}

/** The inputs of a form next to its preview, for creating and editing it. */
export default function FormEditor({
  formId,
  name,
  setName,
  title,
  setTitle,
  fields,
  setFields,
  signingSecret,
}: Props) {
  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <div className="min-w-0 flex-1 space-y-5">
        <EditorInput
          label="Name"
          description="How the form is called in the dashboard and when you pick it for a button, select menu or command."
          type="text"
          maxLength={100}
          value={name}
          onChange={setName}
        />
        <EditorInput
          label="Title"
          description="Shown at the top of the form in Discord."
          type="text"
          maxLength={45}
          value={title}
          onChange={setTitle}
        />
        <FormFields formId={formId} fields={fields} setFields={setFields} />
        <CommandActionSet
          cmdId={formId}
          store={useFormActionsStore}
          inForm
          answersText={answersText(fields)}
        />
        <FormSigningSecret formId={formId} secret={signingSecret} />
      </div>
      <div className="mt-8 lg:mt-0 lg:sticky lg:top-4 lg:w-[26rem] lg:flex-none">
        <FormPreview title={title} fields={fields} />
      </div>
    </div>
  );
}
