import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import CheckBox from "./CheckBox";

interface Props {
  embedIndex: number;
  embedId: number;
  fieldIndex: number;
  fieldId: number;
}

export default function EditorEmbedField({
  embedIndex,
  embedId,
  fieldIndex,
  fieldId,
}: Props) {
  const fieldCount = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].fields.length
  );
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
  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveEmbedFieldUp,
      state.moveEmbedFieldDown,
      state.duplicateEmbedField,
      state.deleteEmbedField,
    ],
    shallow
  );

  return (
    <div className="border-2 border-dark-6 rounded-md p-3">
      <Collapsable
        id={`embeds.${embedId}.fields.${fieldId}`}
        validationPathPrefix={`embeds.${embedIndex}.fields.${fieldIndex}`}
        title={`Field ${fieldIndex + 1}`}
        extra={
          name && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{name}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {fieldIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(embedIndex, fieldIndex)}
              />
            )}
            {fieldIndex < fieldCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(embedIndex, fieldIndex)}
              />
            )}
            {fieldCount < 25 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(embedIndex, fieldIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(embedIndex, fieldIndex)}
            />
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex space-x-3">
            <EditorInput
              label="Name"
              value={name}
              onChange={(v) => setName(embedIndex, fieldIndex, v)}
              maxLength={256}
              className="w-full"
              validationPath={`embeds.${embedIndex}.fields.${fieldIndex}.name`}
            />
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Inline
              </div>
              <CheckBox
                checked={inline ?? false}
                height={10}
                onChange={(v) => setInline(embedIndex, fieldIndex, v)}
              />
            </div>
          </div>
          <EditorInput
            type="textarea"
            label="Value"
            value={value}
            onChange={(v) => setValue(embedIndex, fieldIndex, v)}
            maxLength={1024}
            validationPath={`embeds.${embedIndex}.fields.${fieldIndex}.value`}
            controls={true}
          />
        </div>
      </Collapsable>
    </div>
  );
}
