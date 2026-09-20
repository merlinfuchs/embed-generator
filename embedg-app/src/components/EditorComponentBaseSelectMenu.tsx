import {
  type NodeId,
  type SelectMenuNode,
  useChildIds,
  useDocumentStore,
  useNode,
} from "../state/document";
import { nodeField, slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorComponentBaseSelectMenuOption from "./EditorComponentBaseSelectMenuOption";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorComponentBaseSelectMenu({ id }: Props) {
  const data = useNode<SelectMenuNode>(id);
  const optionIds = useChildIds(id, "options");
  const { update, insert, removeChildren } = useDocumentStore.getState();

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
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Disabled
          </div>
          <CheckBox
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
              <EditorComponentBaseSelectMenuOption
                id={optionId}
                title={`Option ${i + 1}`}
              />
            </div>
          ))}
        </AutoAnimate>
        <div className="space-x-3 mt-3">
          {optionIds.length < 25 ? (
            <button
              type="button"
              className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
              onClick={() =>
                insert(id, "options", "end", {
                  type: "selectOption",
                  label: "",
                })
              }
            >
              Add Option
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
            >
              Add Option
            </button>
          )}
          <button
            type="button"
            className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
            onClick={() => removeChildren(id, "options")}
          >
            Clear Options
          </button>
        </div>
      </Collapsable>
    </div>
  );
}
