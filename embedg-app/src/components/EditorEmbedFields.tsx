import clsx from "clsx";
import { type NodeId, useChildIds, useDocumentStore } from "../state/document";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorEmbedField from "./EditorEmbedField";

interface Props {
  id: NodeId;
}

export default function EditorEmbedFields({ id }: Props) {
  const fieldIds = useChildIds(id, "fields");
  const { insert, removeChildren } = useDocumentStore.getState();

  return (
    <Collapsable
      id={`embeds.${id}.fields`}
      validationNodeId={id}
      validationFields={["fields"]}
      title="Fields"
      extra={
        <div className="text-sm italic font-light text-gray-400">
          {fieldIds.length} / 25
        </div>
      }
    >
      <div>
        <AutoAnimate className="space-y-2 mb-3">
          {fieldIds.map((fieldId) => (
            <EditorEmbedField id={fieldId} key={fieldId} />
          ))}
        </AutoAnimate>
        <div className="space-x-3">
          <button
            type="button"
            className={clsx(
              "px-3 py-2 rounded text-white",
              fieldIds.length < 25
                ? "bg-blurple hover:bg-blurple-dark"
                : "bg-dark-3 cursor-not-allowed",
            )}
            onClick={() =>
              fieldIds.length < 25 &&
              insert(id, "fields", "end", {
                type: "embedField",
                name: "",
                value: "",
              })
            }
          >
            Add Field
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
            onClick={() => removeChildren(id, "fields")}
          >
            Clear Fields
          </button>
        </div>
      </div>
    </Collapsable>
  );
}
