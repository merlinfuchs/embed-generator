import { ENTITY_SELECT_NAMES } from "../discord/entitySelect";
import {
  type EntitySelectNode,
  type NodeId,
  useNode,
  useDocumentStoreApi,
} from "../state/document";
import { nodeField } from "../state/validationError";
import CheckBox from "./CheckBox";
import EditorActionSet from "./EditorActionSet";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

/** An empty or unusable number input leaves the value to Discord's default. */
function toCount(value: string): number | undefined {
  const count = parseInt(value, 10);
  return Number.isNaN(count) ? undefined : count;
}

export default function EditorComponentEntitySelect({ id }: Props) {
  const data = useNode<EntitySelectNode>(id);
  const { update } = useDocumentStoreApi().getState();

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="text-sm text-mist-300">
        {ENTITY_SELECT_NAMES[data.selectType]}: members pick from your server,
        so there are no options to set up. Actions can use{" "}
        <code>{"{{.Selected}}"}</code> to mention what was picked.
      </div>
      <div className="flex flex-wrap gap-3">
        <EditorInput
          label="Placeholder"
          maxLength={150}
          value={data.placeholder || ""}
          onChange={(v) =>
            update<EntitySelectNode>(id, { placeholder: v || undefined })
          }
          className="flex-auto basis-56"
          validationPath={nodeField<EntitySelectNode>(id, "placeholder")}
        />
        <div className="flex-none">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Disabled
          </div>
          <CheckBox
            label="Disabled"
            checked={data.disabled ?? false}
            onChange={(v) => update<EntitySelectNode>(id, { disabled: v })}
          />
        </div>
        <div className="flex-none">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5 whitespace-nowrap">
            Clear after use
          </div>
          <CheckBox
            label="Show the placeholder again after each pick"
            checked={data.reset_selection ?? false}
            onChange={(v) =>
              update<EntitySelectNode>(id, { reset_selection: v || undefined })
            }
          />
        </div>
      </div>
      <div className="flex gap-3">
        <EditorInput
          label="Min Choices"
          type="text"
          props={{ inputMode: "numeric", placeholder: "1" }}
          value={data.min_values?.toString() ?? ""}
          onChange={(v) =>
            update<EntitySelectNode>(id, { min_values: toCount(v) })
          }
          className="flex-1"
          validationPath={nodeField<EntitySelectNode>(id, "min_values")}
        />
        <EditorInput
          label="Max Choices"
          type="text"
          props={{ inputMode: "numeric", placeholder: "1" }}
          value={data.max_values?.toString() ?? ""}
          onChange={(v) =>
            update<EntitySelectNode>(id, { max_values: toCount(v) })
          }
          className="flex-1"
          validationPath={nodeField<EntitySelectNode>(id, "max_values")}
        />
      </div>
      <EditorActionSet setId={data.action_set_id} />
    </div>
  );
}
