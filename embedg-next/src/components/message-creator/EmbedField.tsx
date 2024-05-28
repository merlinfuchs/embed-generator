import { useCurrentMessageStore } from "@/lib/state/message";
import { Card } from "../ui/card";
import CollapsibleSection from "./CollapsibleSection";
import MessageInput from "./MessageInput";
import { useShallow } from "zustand/react/shallow";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  TrashIcon,
} from "lucide-react";

export default function EmbedField({
  embedIndex,
  embedId,
  fieldIndex,
  fieldId,
}: {
  embedIndex: number;
  embedId: number;
  fieldIndex: number;
  fieldId: number;
}) {
  const [name, setName] = useCurrentMessageStore(
    useShallow((state) => [
      state.embeds[embedIndex]?.fields[fieldIndex]?.name,
      state.setEmbedFieldName,
    ])
  );
  const [value, setValue] = useCurrentMessageStore(
    useShallow((state) => [
      state.embeds[embedIndex]?.fields[fieldIndex]?.value,
      state.setEmbedFieldValue,
    ])
  );
  const [inline, setInline] = useCurrentMessageStore(
    useShallow((state) => [
      state.embeds[embedIndex]?.fields[fieldIndex]?.inline,
      state.setEmbedFieldInline,
    ])
  );

  const fieldCount = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].fields.length
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    useShallow((state) => [
      state.moveEmbedFieldUp,
      state.moveEmbedFieldDown,
      state.duplicateEmbedField,
      state.deleteEmbedField,
    ])
  );

  return (
    <Card className="p-3">
      <CollapsibleSection
        title={`Field ${fieldIndex + 1}`}
        size="md"
        valiationPathPrefix={`embeds.${embedIndex}.fields.${fieldIndex}`}
        className="space-y-3"
        actions={
          <>
            {fieldIndex > 0 && (
              <ChevronUpIcon
                className="h-5 w-5"
                onClick={() => moveUp(embedIndex, fieldIndex)}
                role="button"
              />
            )}
            {fieldIndex < fieldCount - 1 && (
              <ChevronDownIcon
                className="h-5 w-5"
                onClick={() => moveDown(embedIndex, fieldIndex)}
                role="button"
              />
            )}
            {fieldCount < 10 && (
              <CopyIcon
                className="h-4 w-4"
                onClick={() => duplicate(embedIndex, fieldIndex)}
                role="button"
              />
            )}
            <TrashIcon
              className="h-4 w-4"
              onClick={() => remove(embedIndex, fieldIndex)}
              role="button"
            />
          </>
        }
      >
        <div className="flex space-x-3">
          <MessageInput
            type="text"
            label="Name"
            maxLength={256}
            value={name}
            onChange={(v) => setName(embedIndex, fieldIndex, v)}
            validationPath={`embeds.${embedIndex}.fields.${fieldIndex}.name`}
          />
          <MessageInput
            type="toggle"
            label="Inline"
            value={inline || false}
            onChange={(v) => setInline(embedIndex, fieldIndex, v || undefined)}
            validationPath={`embeds.${embedIndex}.fields.${fieldIndex}.inline`}
          />
        </div>
        <MessageInput
          type="textarea"
          label="Value"
          maxLength={1024}
          value={value}
          onChange={(v) => setValue(embedIndex, fieldIndex, v)}
          validationPath={`embeds.${embedIndex}.fields.${fieldIndex}.value`}
        />
      </CollapsibleSection>
    </Card>
  );
}
