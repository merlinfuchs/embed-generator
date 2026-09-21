import {
  type NodeId,
  type SelectMenuNode,
  useChildIds,
  useNode,
  slotLimit,
  useDocumentStoreApi,
} from "../state/document";
import { nodeField, slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorSlotButtons from "./EditorSlotButtons";
import EditorComponentSelectMenuOption from "./EditorComponentSelectMenuOption";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorComponentSelectMenu({ id }: Props) {
  const data = useNode<SelectMenuNode>(id);
  const optionIds = useChildIds(id, "options");
  const { update, insert, removeChildren } = useDocumentStoreApi().getState();

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
        <EditorInput
          label="Placeholder"
          maxLength={150}
          value={data.placeholder || ""}
          onChange={(v) =>
            update<SelectMenuNode>(id, { placeholder: v || undefined })
          }
          className="flex-auto"
          validationPath={nodeField<SelectMenuNode>(id, "placeholder")}
        />
        <div className="flex-none">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Disabled
          </div>
          <CheckBox
            label="Disabled"
            checked={data.disabled ?? false}
            onChange={(v) => update<SelectMenuNode>(id, { disabled: v })}
          />
        </div>
      </div>
      <Collapsable
        id={`${id}.options`}
        validationPathPrefix={slotScope(id, "options")}
        title="Options"
      >
        <AutoAnimate className="space-y-2">
          {optionIds.map((optionId, i) => (
            <div key={optionId}>
              <EditorComponentSelectMenuOption
                id={optionId}
                title={`Option ${i + 1}`}
              />
            </div>
          ))}
        </AutoAnimate>
        <EditorSlotButtons
          addLabel="Add Option"
          clearLabel="Clear Options"
          canAdd={optionIds.length < slotLimit("selectMenu", "options")}
          onAdd={() =>
            insert(id, "options", "end", { type: "selectOption", label: "" })
          }
          onClear={() => removeChildren(id, "options")}
        />
      </Collapsable>
    </div>
  );
}
