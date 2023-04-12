import { shallow } from "zustand/shallow";
import { embedFieldNameSchema, embedFieldValueSchema } from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
  fieldIndex: number;
}

export default function EditorEmbedField({ embedIndex, fieldIndex }: Props) {
  const [name, setName] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex].fields[fieldIndex].name,
      state.setEmbedFieldName,
    ],
    shallow
  );
  const [value, setValue] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex].fields[fieldIndex].value,
      state.setEmbedFieldValue,
    ],
    shallow
  );
  const [inline, setInline] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex].fields[fieldIndex].inline,
      state.setEmbedFieldInline,
    ],
    shallow
  );

  return (
    <div className="border-2 border-dark-6 rounded-md p-3">
      <Collapsable
        id={`embeds.${embedIndex}.fields.${fieldIndex}`}
        title={`Field ${fieldIndex + 1}`}
      >
        <div className="space-y-3">
          <EditorInput
            label="Name"
            value={name}
            onChange={(v) => setName(embedIndex, fieldIndex, v)}
            maxLength={80}
            className="mb-3"
          >
            <ValidationError schema={embedFieldNameSchema} value={name} />
          </EditorInput>
          <EditorInput
            type="textarea"
            label="Value"
            value={value}
            onChange={(v) => setValue(embedIndex, fieldIndex, v)}
            maxLength={80}
            className="mb-3"
          >
            <ValidationError schema={embedFieldValueSchema} value={value} />
          </EditorInput>
        </div>
      </Collapsable>
    </div>
  );
}
