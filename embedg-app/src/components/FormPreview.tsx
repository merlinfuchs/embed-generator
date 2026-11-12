import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import type { FormFieldWire } from "../api/wire";
import { hasOptions, isSelectField } from "./FormFields";

const PICKER_PLACEHOLDERS: Record<string, string> = {
  user: "Select a user",
  role: "Select a role",
  mentionable: "Select a user or role",
  channel: "Select a channel",
  select: "Make a selection",
};

/** What a select menu shows while nothing is picked, or what is picked by default. */
function selectText(field: FormFieldWire): { text: string; muted: boolean } {
  const defaults = (field.options ?? []).filter((o) => o.default);
  if (defaults.length > 0) {
    return { text: defaults.map((o) => o.label).join(", "), muted: false };
  }
  return {
    text:
      field.placeholder || PICKER_PLACEHOLDERS[field.type ?? ""] || "Select",
    muted: true,
  };
}

function Label({ field }: { field: FormFieldWire }) {
  return (
    <div className="mb-2 text-sm font-semibold text-[#dbdee1] break-words">
      {field.label || <span className="italic opacity-60">Untitled field</span>}
      {field.required && field.type !== "checkbox" && (
        <span className="ml-1 text-[#f23f42]">*</span>
      )}
    </div>
  );
}

function Box({ checked, round }: { checked: boolean; round?: boolean }) {
  return (
    <div
      className={`flex-none h-5 w-5 mt-0.5 border-2 flex items-center justify-center ${
        round ? "rounded-full" : "rounded"
      } ${checked ? "border-[#5865f2]" : "border-[#80848e]"}`}
    >
      {checked && (
        <div
          className={`bg-[#5865f2] ${round ? "h-2.5 w-2.5 rounded-full" : "h-3 w-3 rounded-sm"}`}
        />
      )}
    </div>
  );
}

function FieldInput({ field }: { field: FormFieldWire }) {
  if (field.type === "checkbox") {
    return (
      <div className="flex items-start gap-3">
        <Box checked={!!field.default} />
        <div className="text-[#dbdee1] break-words">
          {field.label || (
            <span className="italic opacity-60">Untitled field</span>
          )}
        </div>
      </div>
    );
  }

  if (field.type === "radio" || field.type === "checkboxes") {
    return (
      <div className="space-y-2">
        {(field.options ?? []).map((o, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: options have no identity of their own
          <div key={i} className="flex items-start gap-3">
            <Box checked={!!o.default} round={field.type === "radio"} />
            <div className="min-w-0">
              <div className="text-[#dbdee1] break-words">{o.label}</div>
              {o.description && (
                <div className="text-xs text-[#949ba4] break-words">
                  {o.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isSelectField(field) || hasOptions(field)) {
    const { text, muted } = selectText(field);
    return (
      <div className="flex items-center justify-between rounded bg-[#1e1f22] border border-black/30 px-3 py-2.5">
        <div
          className={`truncate ${muted ? "text-[#949ba4]" : "text-[#dbdee1]"}`}
        >
          {text}
        </div>
        <ChevronDownIcon className="h-5 w-5 flex-none text-[#b5bac1]" />
      </div>
    );
  }

  const shown = field.value || field.placeholder || "";
  return (
    <div
      className={`rounded bg-[#1e1f22] border border-black/30 px-3 py-2.5 break-words whitespace-pre-wrap ${
        field.paragraph ? "min-h-[6.5rem]" : ""
      } ${field.value ? "text-[#dbdee1]" : "text-[#949ba4]"}`}
    >
      {shown || " "}
    </div>
  );
}

/** A look at the pop-up members get in Discord, updated while the form is edited. */
export default function FormPreview({
  title,
  fields,
}: {
  title: string;
  fields: FormFieldWire[];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium uppercase text-mist-300">
        Preview
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#313338] text-base shadow-lg">
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="text-xl font-semibold text-white break-words min-w-0">
            {title || <span className="italic opacity-60">Untitled form</span>}
          </div>
          <XMarkIcon className="h-6 w-6 flex-none text-[#b5bac1]" />
        </div>
        <div className="space-y-5 px-4 py-4">
          {fields.map((field, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fields have no identity of their own
            <div key={i}>
              {field.type !== "checkbox" && <Label field={field} />}
              <FieldInput field={field} />
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-sm italic text-[#949ba4]">
              Add a field to see it here.
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-4 bg-[#2b2d31] px-4 py-3.5">
          <div className="text-sm font-medium text-white">Cancel</div>
          <div className="rounded bg-[#5865f2] px-4 py-2 text-sm font-medium text-white">
            Submit
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-mist-400">
        Roughly how the form looks in Discord. Discord's own look is the final
        word.
      </div>
    </div>
  );
}
