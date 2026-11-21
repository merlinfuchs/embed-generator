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

const MAX_FORM_FIELDS = 5;
const MAX_SELECT_VALUES = 25;
const MAX_KEY_LENGTH = 32;

type FieldKind = "text" | "entity" | "options" | "checkbox";

interface FieldType {
  value: string;
  label: string;
  kind: FieldKind;
  /** What a new field of this type is labeled, so the label fits what the field asks for. */
  defaultLabel: string;
  /** What the select menu shows in the preview while nothing is picked. */
  pickerPlaceholder?: string;
  /** Whether Discord shows a placeholder for the field. */
  placeholder: boolean;
  /** Whether more than one value can be picked. */
  maxValues: boolean;
  /** How many options the field can have. */
  maxOptions?: number;
}

export const FIELD_TYPES: FieldType[] = [
  {
    value: "text",
    label: "Text",
    kind: "text",
    defaultLabel: "Message",
    placeholder: true,
    maxValues: false,
  },
  {
    value: "select",
    label: "Select Menu",
    kind: "options",
    defaultLabel: "Choice",
    pickerPlaceholder: "Make a selection",
    placeholder: true,
    maxValues: true,
    maxOptions: 25,
  },
  {
    value: "radio",
    label: "Radio Buttons",
    kind: "options",
    defaultLabel: "Choice",
    placeholder: false,
    maxValues: false,
    maxOptions: 10,
  },
  {
    value: "checkboxes",
    label: "Checkboxes",
    kind: "options",
    defaultLabel: "Choices",
    placeholder: false,
    maxValues: true,
    maxOptions: 10,
  },
  {
    value: "checkbox",
    label: "Single Checkbox",
    kind: "checkbox",
    defaultLabel: "I agree",
    placeholder: false,
    maxValues: false,
  },
  {
    value: "user",
    label: "User Select",
    kind: "entity",
    defaultLabel: "User",
    pickerPlaceholder: "Select a user",
    placeholder: true,
    maxValues: true,
  },
  {
    value: "role",
    label: "Role Select",
    kind: "entity",
    defaultLabel: "Role",
    pickerPlaceholder: "Select a role",
    placeholder: true,
    maxValues: true,
  },
  {
    value: "mentionable",
    label: "User & Role Select",
    kind: "entity",
    defaultLabel: "User or Role",
    pickerPlaceholder: "Select a user or role",
    placeholder: true,
    maxValues: true,
  },
  {
    value: "channel",
    label: "Channel Select",
    kind: "entity",
    defaultLabel: "Channel",
    pickerPlaceholder: "Select a channel",
    placeholder: true,
    maxValues: true,
  },
];

/** The type of a field. A field without one is a text input. */
export function fieldType(field: FormFieldWire): FieldType {
  return (
    FIELD_TYPES.find((t) => t.value === (field.type || "text")) ??
    FIELD_TYPES[0]
  );
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** The name a field's value has in templates, made from its label. */
export function fieldKeyFromLabel(label: string): string {
  let key = slug(label);
  if (!/^[a-z]/.test(key)) key = key ? `field_${key}` : "";
  return key.slice(0, MAX_KEY_LENGTH).replace(/_+$/, "");
}

/** The value an option has by default, made from its label. */
export function optionValueFromLabel(label: string): string {
  return slug(label).slice(0, 100);
}

/** Whether the variable name still follows the label, because it wasn't changed by hand. */
function keyFollowsLabel(field: FormFieldWire): boolean {
  return (
    field.key === "" ||
    field.key === fieldKeyFromLabel(field.label) ||
    /^field(_\d+)?$/.test(field.key)
  );
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
  switch (fieldType(field).kind) {
    case "entity":
      return `Use {{.Form.${name}}} in the form's actions to insert the mentions of what was picked, or {{.FormIDs.${name}}} for their IDs.`;
    case "options":
      return `Use {{.Form.${name}}} in the form's actions to insert the labels of what was picked, or {{.FormIDs.${name}}} for their values.`;
    case "checkbox":
      return `Use {{.Form.${name}}} for Yes or No, or {{.FormIDs.${name}}} for true or false.`;
    default:
      return `Use {{.Form.${name}}} in the form's actions to insert what was typed.`;
  }
}

function FieldOptions({
  field,
  update,
}: {
  field: FormFieldWire;
  update: (values: Partial<FormFieldWire>) => void;
}) {
  const options = field.options ?? [];
  const { maxValues: multi, maxOptions = 0 } = fieldType(field);

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
          {options.length} / {maxOptions}
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
      {options.length < maxOptions && (
        <button
          type="button"
          className="mt-2 bg-azure-500 px-3 py-2 rounded-lg transition-colors hover:bg-azure-400 text-white text-sm"
          onClick={() => {
            // Counted up past the values in use, which removing an option leaves gaps in.
            let n = options.length + 1;
            while (options.some((o) => o.value === `option_${n}`)) n++;
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
  const type = fieldType(field);
  const text = type.kind === "text";
  const otherKeys = fields.filter((_, i) => i !== index).map((f) => f.key);

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
    update({
      label,
      ...(keyFollowsLabel(field)
        ? { key: uniqueKey(fieldKeyFromLabel(label), otherKeys) }
        : {}),
    });
  }

  // The settings of the other kind of field are dropped, so they don't linger in the saved form.
  function setType(value: string) {
    const newType =
      FIELD_TYPES.find((t) => t.value === value) ?? FIELD_TYPES[0];
    const next: FormFieldWire = {
      key: field.key,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
    };

    // A label that is still the standard one of the old type, or empty, becomes the standard one
    // of the new type, and the variable name follows it unless it was changed by hand.
    if (field.label.trim() === "" || field.label === type.defaultLabel) {
      next.label = newType.defaultLabel;
      if (keyFollowsLabel(field)) {
        next.key = uniqueKey(fieldKeyFromLabel(next.label), otherKeys);
      }
    }
    if (newType.value !== "text") next.type = newType.value;
    if (newType.kind === "options") {
      // Kept options are cut down to what the new type allows. Max Values starts over, so only
      // checkboxes can keep more than one default.
      let defaults = 0;
      next.options = field.options?.length
        ? field.options.slice(0, newType.maxOptions).map((o) => {
            if (!o.default) return o;
            defaults++;
            return defaults > 1 && newType.value !== "checkboxes"
              ? { ...o, default: undefined }
              : o;
          })
        : [
            { label: "Option 1", value: "option_1" },
            { label: "Option 2", value: "option_2" },
          ];
    }
    if (!newType.placeholder) next.placeholder = undefined;
    const copy = [...fields];
    copy[index] = next;
    setFields(copy);
  }

  function setMaxValues(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 2);
    update({
      max_values: digits
        ? Math.min(parseInt(digits, 10), MAX_SELECT_VALUES)
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
          {type.placeholder && (
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
                value={type.value}
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
            {type.kind === "checkbox" ? (
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
            {type.maxValues ? (
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
          {type.kind === "options" && (
            <FieldOptions field={field} update={update} />
          )}
        </div>
      </Collapsable>
    </div>
  );
}
