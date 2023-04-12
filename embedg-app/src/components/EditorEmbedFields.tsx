import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorEmbedField from "./EditorEmbedField";

interface Props {
  embedIndex: number;
}

export default function EditorEmbedFields({ embedIndex }: Props) {
  const fields = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].fields.map((e) => e.id),
    shallow
  );

  const [addField, clearFields] = useCurrentMessageStore((state) => [
    state.addEmbedField,
    state.clearEmbedFields,
  ]);

  return (
    <Collapsable id={`embeds.${embedIndex}.fields`} title="Fields">
      <div>
        <AutoAnimate className="space-y-2 mb-3">
          {fields.map((fieldId, fieldIndex) => (
            <EditorEmbedField
              embedIndex={embedIndex}
              fieldIndex={fieldIndex}
              key={fieldId}
            />
          ))}
        </AutoAnimate>
        <div className="space-x-3">
          <button
            className="bg-blurple px-3 py-2 rounded text-white hover:bg-blurple-dark"
            onClick={() =>
              addField(embedIndex, {
                id: getUniqueId(),
                name: "",
                value: "",
              })
            }
          >
            Add Embed
          </button>
          <button
            className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
            onClick={() => clearFields(embedIndex)}
          >
            Clear Embeds
          </button>
        </div>
      </div>
    </Collapsable>
  );
}
