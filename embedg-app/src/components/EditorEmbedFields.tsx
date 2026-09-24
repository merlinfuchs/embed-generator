import {
  type NodeId,
  slotLimit,
  useChildIds,
  useDocumentStoreApi,
} from "../state/document";
import { AutoAnimate } from "../util/autoAnimate";
import { slotScope } from "../state/validationError";
import Collapsable from "./Collapsable";
import EditorSlotButtons from "./EditorSlotButtons";
import EditorEmbedField from "./EditorEmbedField";

interface Props {
  id: NodeId;
}

export default function EditorEmbedFields({ id }: Props) {
  const fieldIds = useChildIds(id, "fields");
  const { insert, removeChildren } = useDocumentStoreApi().getState();

  return (
    <Collapsable
      id={`embeds.${id}.fields`}
      validationPathPrefix={slotScope(id, "fields")}
      title="Fields"
      extra={
        <div className="text-sm italic font-light text-mist-400">
          {fieldIds.length} / {slotLimit("embed", "fields")}
        </div>
      }
    >
      <div>
        <AutoAnimate className="space-y-2 mb-3">
          {fieldIds.map((fieldId) => (
            <EditorEmbedField id={fieldId} key={fieldId} />
          ))}
        </AutoAnimate>
        <EditorSlotButtons
          addLabel="Add Field"
          clearLabel="Clear Fields"
          canAdd={fieldIds.length < slotLimit("embed", "fields")}
          onAdd={() =>
            insert(id, "fields", "end", {
              type: "embedField",
              name: "",
              value: "",
            })
          }
          onClear={() => removeChildren(id, "fields")}
        />
      </div>
    </Collapsable>
  );
}
