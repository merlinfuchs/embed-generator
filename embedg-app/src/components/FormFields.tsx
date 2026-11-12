import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import type { FormFieldOptionWire, FormFieldWire } from "../api/wire";
import { AutoAnimate } from "../util/autoAnimate";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

export const MAX_FORM_FIELDS = 5;
export const MAX_FORM_SELECT_VALUES = 25;
const MAX_KEY_LENGTH = 32;
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export const MAX_SELECT_OPTIONS = 25;
export const MAX_CHOICE_OPTIONS = 10;

export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "select", label: "Select Menu" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkboxes", label: "Checkboxes" },
  { value: "checkbox", label: "Single Checkbox" },
  { value: "user", label: "User Select" },
  { value: "role", label: "Role Select" },
  { value: "mentionable", label: "User & Role Select" },
  { value: "channel", label: "Channel Select" },
] as const;

/** What a new field of a type is labeled, so the label fits what the field asks for. */
export const DEFAULT_FIELD_LABELS: Record<string, string> = {
  text: "Message",
  user: "User",
  role: "Role",
  mentionable: "User or Role",
  channel: "Channel",
  select: "Choice",
  radio: "Choice",
  checkboxes: "Choices",
  checkbox: "I agree",
};

/** Whether a field is a select menu that picks users, roles or channels. */
export function isSelectField(field: FormFieldWire): boolean {
  return (
    field.type === "user" ||
    field.type === "role" ||
    field.type === "mentionable" ||
    field.type === "channel"
  );
}

/** Whether a field picks from options that are set up in the form. */
export function hasOptions(field: FormFieldWire): boolean {
  return (
    field.type === "select" ||
    field.type === "radio" ||
    field.type === "checkboxes"
  );
}

/** How many options a field can have at most. */
export function maxOptions(field: FormFieldWire): number {
  return field.type === "select" ? MAX_SELECT_OPTIONS : MAX_CHOICE_OPTIONS;
}

/** What is wrong with the options of a field that the server would refuse, if anything. */
function validateOptions(field: FormFieldWire, pos: number): string | null {
  const options = field.options ?? [];
  const min = field.type === "radio" ? 2 : 1;
  const max = maxOptions(field);
  if (options.length < min || options.length > max) {
    return `Field ${pos} needs between ${min} and ${max} options.`;
  }

  const values = new Set<string>();
  for (const [j, o] of options.entries()) {
    if (o.label.trim().length === 0) {
      return `Option ${j + 1} of field ${pos} needs a label.`;
    }
    if (o.value.trim().length === 0) {
      return `Option ${j + 1} of field ${pos} needs a value.`;
    }
    if (values.has(o.value)) {
      return `The value "${o.value}" is used by more than one option of field ${pos}.`;
    }
    values.add(o.value);
  }

  const defaults = options.filter((o) => o.default).length;
  if (field.type === "radio" && defaults > 1) {
    return `Only one option of field ${pos} can be picked by default.`;
  }
  if (field.type !== "radio") {
    const maxPick =
      field.max_values || (field.type === "select" ? 1 : options.length);
    if ((field.max_values ?? 0) > options.length) {
      return `Field ${pos} can't pick more values than it has options.`;
    }
    if (defaults > maxPick) {
      return `Field ${pos} has more options picked by default than it can pick.`;
    }
  }
  return null;
}

/** The name a field's value has in templates, made from its label. */
export function fieldKeyFromLabel(label: string): string {
  let key = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!/^[a-z]/.test(key)) key = key ? `field_${key}` : "";
  return key.slice(0, MAX_KEY_LENGTH).replace(/_+$/, "");
}

function uniqueKey(base: string, others: string[]): string {
  const root = base || "field";
  let key = root;
  let n = 2;
  while (others.includes(key)) {
    const suffix = `_${n++}`;
    key = root.slice(0, MAX_KEY_LENGTH - suffix.length) + suffix;
  }
  return key;
}

/** What is wrong with the fields of a form that the server would refuse, if anything. */
export function validateFormFields(fields: FormFieldWire[]): string | null {
  if (fields.length === 0) return "A form needs at least one field.";

  const keys = new Set<string>();
  for (const [i, f] of fields.entries()) {
    if (f.label.trim().length === 0) {
      return `Field ${i + 1} needs a label.`;
    }
    if (!KEY_PATTERN.test(f.key) || f.key.length > MAX_KEY_LENGTH) {
      return `The variable name of field ${i + 1} must start with a lowercase letter and only contain lowercase letters, digits and underscores.`;
    }
    if (keys.has(f.key)) {
      return `The variable name "${f.key}" is used by more than one field.`;
    }
    keys.add(f.key);

    if (hasOptions(f)) {
      const err = validateOptions(f, i + 1);
      if (err) return err;
      continue;
    }
    if (f.type === "checkbox") continue;

    if (isSelectField(f)) {
      if (
        (f.max_values ?? 0) < 0 ||
        (f.max_values ?? 0) > MAX_FORM_SELECT_VALUES
      ) {
        return `Field ${i + 1} can pick between 1 and ${MAX_FORM_SELECT_VALUES} values.`;
      }
      continue;
    }

    if (
      (f.max_length ?? 0) !== 0 &&
      (f.min_length ?? 0) > (f.max_length ?? 0)
    ) {
      return `The minimum length of field ${i + 1} can't be larger than its maximum length.`;
    }
  }
  return null;
}

interface Props {
  formId: string;
  fields: FormFieldWire[];
  setFields: (fields: FormFieldWire[]) => void;
}

export default function FormFields({ formId, fields, setFields }: Props) {
  function add() {
    setFields([
      ...fields,
      {
        key: uniqueKey(
          "field",
          fields.map((f) => f.key),
        ),
        label: "",
        required: true,
      },
    ]);
  }

  return (
    <Collapsable
      id={`form.${formId}.fields`}
      title="Fields"
      extra={
        <div className="text-sm italic font-light text-mist-400">
          {fields.length} / {MAX_FORM_FIELDS}
        </div>
      }
    >
      <AutoAnimate className="space-y-2">
        {fields.map((_, i) => (
          <FormFieldCard
            // The fields have no identity of their own, and the variable name changes while typing.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={i}
            formId={formId}
            index={i}
            fields={fields}
            setFields={setFields}
          />
        ))}
      </AutoAnimate>
      <div className="space-x-3 mt-3 text-sm">
        {fields.length < MAX_FORM_FIELDS ? (
          <button
            type="button"
            className="bg-azure-500 px-3 py-2 rounded-lg transition-colors hover:bg-azure-400 text-white"
            onClick={add}
          >
            Add Field
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="bg-ink-900 px-3 py-2 rounded-lg transition-colors cursor-not-allowed text-mist-300"
          >
            Add Field
          </button>
        )}
      </div>
    </Collapsable>
  );
}

function variableDescription(field: FormFieldWire): string {
  const name = field.key || "name";
  if (isSelectField(field)) {
    return `Use {{.Form.${name}}} in the form's actions to insert the mentions of what was picked, or {{.FormIDs.${name}}} for their IDs.`;
  }
  if (hasOptions(field)) {
    return `Use {{.Form.${name}}} in the form's actions to insert the labels of what was picked, or {{.FormIDs.${name}}} for their values.`;
  }
  if (field.type === "checkbox") {
    return `Use {{.Form.${name}}} for Yes or No, or {{.FormIDs.${name}}} for true or false.`;
  }
  return `Use {{.Form.${name}}} in the form's actions to insert what was typed.`;
}

function FieldOptions({
  field,
  update,
}: {
  field: FormFieldWire;
  update: (values: Partial<FormFieldWire>) => void;
}) {
  const options = field.options ?? [];
  const multi = field.type !== "radio";

  function set(i: number, values: Partial<FormFieldOptionWire>) {
    const next = [...options];
    next[i] = { ...next[i], ...values };
    // A radio group has a single default.
    if (field.type === "radio" && values.default) {
      for (const [j, o] of next.entries()) {
        if (j !== i && o.default) next[j] = { ...o, default: undefined };
      }
    }
    update({ options: next });
  }

  function setLabel(i: number, label: string) {
    const o = options[i];
    // The value follows the label until it's been changed by hand.
    const follows = o.value === "" || o.value === optionValueFromLabel(o.label);
    set(i, {
      label,
      ...(follows ? { value: optionValueFromLabel(label) } : {}),
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center space-x-2">
        <div className="uppercase text-mist-300 text-sm font-medium">
          Options
        </div>
        <div className="text-sm italic font-light text-mist-400">
          {options.length} / {maxOptions(field)}
        </div>
      </div>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: options have no identity of their own
            key={i}
            className="p-2 border-2 border-white/10 rounded-xl space-y-2"
          >
            <div className="flex gap-2 items-end">
              <EditorInput
                className="flex-1"
                label="Label"
                type="text"
                maxLength={100}
                value={o.label}
                onChange={(v) => setLabel(i, v)}
              />
              <EditorInput
                className="flex-1"
                label="Value"
                type="text"
                maxLength={100}
                value={o.value}
                onChange={(v) => set(i, { value: v })}
              />
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Default
                  </div>
                </div>
                <CheckBox
                  label="Picked by default"
                  checked={o.default ?? false}
                  onChange={(v) => set(i, { default: v || undefined })}
                />
              </div>
              <button
                type="button"
                aria-label="Remove option"
                className="flex-none text-mist-300 pb-2"
                onClick={() =>
                  update({ options: options.filter((_, j) => j !== i) })
                }
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <EditorInput
              label="Description"
              type="text"
              maxLength={100}
              value={o.description ?? ""}
              onChange={(v) => set(i, { description: v || undefined })}
            />
          </div>
        ))}
      </div>
      {options.length < maxOptions(field) && (
        <button
          type="button"
          className="mt-2 bg-azure-500 px-3 py-2 rounded-lg transition-colors hover:bg-azure-400 text-white text-sm"
          onClick={() => {
            const n = options.length + 1;
            update({
              options: [
                ...options,
                { label: `Option ${n}`, value: `option_${n}` },
              ],
            });
          }}
        >
          Add Option
        </button>
      )}
      {multi && (
        <div className="mt-1 text-xs text-mist-400">
          {field.type === "select"
            ? "Members can pick up to Max Values of these."
            : "Leave Max Values empty to allow picking all of them."}
        </div>
      )}
    </div>
  );
}

/** The value an option has by default, made from its label. */
export function optionValueFromLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}

function FormFieldCard({
  formId,
  index,
  fields,
  setFields,
}: {
  formId: string;
  index: number;
  fields: FormFieldWire[];
  setFields: (fields: FormFieldWire[]) => void;
}) {
  const field = fields[index];
  const select = isSelectField(field);
  const options = hasOptions(field);
  const checkbox = field.type === "checkbox";
  const text = !select && !options && !checkbox;

  function move(offset: number) {
    const next = [...fields];
    next.splice(index + offset, 0, next.splice(index, 1)[0]);
    setFields(next);
  }

  function duplicate() {
    const next = [...fields];
    next.splice(index + 1, 0, {
      ...field,
      key: uniqueKey(
        field.key,
        fields.map((f) => f.key),
      ),
    });
    setFields(next);
  }

  function remove() {
    const next = [...fields];
    next.splice(index, 1);
    setFields(next);
  }

  // Replace the field rather than assigning into it: the objects in this array come from the
  // query cache, so writing through them would edit the cached form before anything is saved.
  function update(values: Partial<FormFieldWire>) {
    const next = [...fields];
    next[index] = { ...field, ...values };
    setFields(next);
  }

  // The variable name follows the label until it's been changed by hand.
  function setLabel(label: string) {
    const others = fields.filter((_, i) => i !== index).map((f) => f.key);
    const followsLabel =
      field.key === "" ||
      field.key === fieldKeyFromLabel(field.label) ||
      /^field(_\d+)?$/.test(field.key);

    update({
      label,
      ...(followsLabel
        ? { key: uniqueKey(fieldKeyFromLabel(label), others) }
        : {}),
    });
  }

  // The settings of the other kind of field are dropped, so they don't linger in the saved form.
  function setType(type: string) {
    const next: FormFieldWire = {
      key: field.key,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
    };

    // A label that is still the standard one of the old type, or empty, becomes the standard one
    // of the new type, and the variable name follows it unless it was changed by hand.
    const oldDefault = DEFAULT_FIELD_LABELS[field.type || "text"];
    if (field.label.trim() === "" || field.label === oldDefault) {
      const keyFollowed =
        field.key === "" ||
        field.key === fieldKeyFromLabel(field.label) ||
        /^field(_\d+)?$/.test(field.key);
      next.label = DEFAULT_FIELD_LABELS[type] ?? field.label;
      if (keyFollowed) {
        next.key = uniqueKey(
          fieldKeyFromLabel(next.label),
          fields.filter((_, i) => i !== index).map((f) => f.key),
        );
      }
    }
    if (type !== "text") next.type = type;
    if (type === "select" || type === "radio" || type === "checkboxes") {
      next.options = field.options?.length
        ? field.options
        : [
            { label: "Option 1", value: "option_1" },
            { label: "Option 2", value: "option_2" },
          ];
    }
    if (type === "radio" || type === "checkboxes" || type === "checkbox") {
      next.placeholder = undefined;
    }
    const copy = [...fields];
    copy[index] = next;
    setFields(copy);
  }

  function setMaxValues(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 2);
    update({
      max_values: digits
        ? Math.min(parseInt(digits, 10), MAX_FORM_SELECT_VALUES)
        : undefined,
    });
  }

  function setNumber(name: "min_length" | "max_length", value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    update({ [name]: digits ? Math.min(parseInt(digits, 10), 4000) : 0 });
  }

  return (
    <div className="p-3 border-2 border-white/10 rounded-xl">
      <Collapsable
        id={`form.${formId}.fields.${index}`}
        title={`Field ${index + 1}`}
        buttons={
          <div className="flex-none text-mist-300 flex items-center space-x-2">
            {index > 0 && (
              <button
                type="button"
                aria-label="Move up"
                onClick={() => move(-1)}
              >
                <ChevronUpIcon className="h-6 w-6 flex-none" />
              </button>
            )}
            {index < fields.length - 1 && (
              <button
                type="button"
                aria-label="Move down"
                onClick={() => move(1)}
              >
                <ChevronDownIcon className="h-6 w-6 flex-none" />
              </button>
            )}
            {fields.length < MAX_FORM_FIELDS && (
              <button type="button" aria-label="Duplicate" onClick={duplicate}>
                <DocumentDuplicateIcon className="h-5 w-5 flex-none" />
              </button>
            )}
            <button type="button" aria-label="Remove" onClick={remove}>
              <TrashIcon className="h-5 w-5 flex-none" />
            </button>
          </div>
        }
        extra={
          field.label ? (
            <div className="text-mist-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{field.label}</div>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          <EditorInput
            label="Label"
            type="text"
            maxLength={45}
            value={field.label}
            onChange={setLabel}
          />
          <EditorInput
            label="Variable Name"
            type="text"
            maxLength={MAX_KEY_LENGTH}
            description={variableDescription(field)}
            value={field.key}
            onChange={(key) => update({ key: key.toLowerCase() })}
          />
          {(text || select || field.type === "select") && (
            <EditorInput
              label="Placeholder"
              type="text"
              maxLength={100}
              value={field.placeholder ?? ""}
              onChange={(placeholder) => update({ placeholder })}
            />
          )}
          {text && (
            <EditorInput
              label="Preset Value"
              type={field.paragraph ? "textarea" : "text"}
              maxLength={field.max_length || 4000}
              description="What the field contains when the form opens."
              value={field.value ?? ""}
              onChange={(value) => update({ value })}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <div className="flex-none">
              <div className="mb-1.5 flex">
                <div className="uppercase text-mist-300 text-sm font-medium">
                  Type
                </div>
              </div>
              <select
                aria-label="Type"
                className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
                value={field.type || "text"}
                onChange={(v) => setType(v.target.value)}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {text && (
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Style
                  </div>
                </div>
                <select
                  aria-label="Style"
                  className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
                  value={field.paragraph ? "paragraph" : "short"}
                  onChange={(v) =>
                    update({ paragraph: v.target.value === "paragraph" })
                  }
                >
                  <option value="short">Single Line</option>
                  <option value="paragraph">Multiple Lines</option>
                </select>
              </div>
            )}
            {checkbox ? (
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Checked by Default
                  </div>
                </div>
                <CheckBox
                  label="Checked by Default"
                  checked={field.default ?? false}
                  onChange={(value) => update({ default: value || undefined })}
                />
              </div>
            ) : (
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Required
                  </div>
                </div>
                <CheckBox
                  label="Required"
                  checked={field.required}
                  onChange={(required) => update({ required })}
                />
              </div>
            )}
            {select ||
            field.type === "select" ||
            field.type === "checkboxes" ? (
              <EditorInput
                className="w-32"
                label="Max Values"
                type="text"
                props={{ inputMode: "numeric" }}
                description="How many can be picked."
                value={field.max_values ? String(field.max_values) : ""}
                onChange={setMaxValues}
              />
            ) : text ? (
              <>
                <EditorInput
                  className="w-32"
                  label="Min Length"
                  type="text"
                  props={{ inputMode: "numeric" }}
                  value={field.min_length ? String(field.min_length) : ""}
                  onChange={(v) => setNumber("min_length", v)}
                />
                <EditorInput
                  className="w-32"
                  label="Max Length"
                  type="text"
                  props={{ inputMode: "numeric" }}
                  value={field.max_length ? String(field.max_length) : ""}
                  onChange={(v) => setNumber("max_length", v)}
                />
              </>
            ) : null}
          </div>
          {options && (
            <FieldOptions
              field={field}
              update={update}
              /* the options belong to this field's card */
            />
          )}
        </div>
      </Collapsable>
    </div>
  );
}
