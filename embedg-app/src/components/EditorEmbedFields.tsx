import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorEmbedField from "./EditorEmbedField";
import clsx from "clsx";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbedFields({ embedIndex, embedId }: Props) {
  const fields = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].fields.map((e) => e.id),
    shallow
  );

  const [addField, clearFields] = useCurrentMessageStore((state) => [
    state.addEmbedField,
    state.clearEmbedFields,
  ]);

  return (
    <Collapsable
      id={`embeds.${embedId}.fields`}
      validationPathPrefix={`embeds.${embedIndex}.fields`}
      title="Fields"
      extra={
        <div className="text-sm italic font-light text-gray-400">
          {fields.length} / 25
        </div>
      }
    >
      <div>
        <AutoAnimate className="space-y-2 mb-3">
          {fields.map((fieldId, fieldIndex) => (
            <EditorEmbedField
              embedIndex={embedIndex}
              embedId={embedId}
              fieldIndex={fieldIndex}
              fieldId={fieldId}
              key={fieldId}
            />
          ))}
        </AutoAnimate>
        <div className="space-x-3">
          <button
            className={clsx(
              "px-3 py-2 rounded text-white",
              fields.length < 25
                ? "bg-blurple hover:bg-blurple-dark"
                : "bg-dark-3 cursor-not-allowed"
            )}
            onClick={() =>
              fields.length < 25 &&
              addField(embedIndex, {
                id: getUniqueId(),
                name: "",
                value: "",
              })
            }
          >
            Add Field
          </button>
          <button
            className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
            onClick={() => clearFields(embedIndex)}
          >
            Clear Fields
          </button>
        </div>
      </div>
    </Collapsable>
  );
}
