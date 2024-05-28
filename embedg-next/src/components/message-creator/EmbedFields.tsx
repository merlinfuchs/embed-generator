import { useCurrentMessageStore } from "@/lib/state/message";
import CollapsibleSection from "./CollapsibleSection";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../ui/button";
import { getUniqueId } from "@/lib/utils";
import EmbedField from "./EmbedField";

export default function EmbedFields({
  embedId,
  embedIndex,
}: {
  embedId: number;
  embedIndex: number;
}) {
  const fields = useCurrentMessageStore(
    useShallow((state) => state.embeds[embedIndex].fields.map((e) => e.id))
  );

  const [addField, clearFields] = useCurrentMessageStore(
    useShallow((state) => [state.addEmbedField, state.clearEmbedFields])
  );

  return (
    <CollapsibleSection
      title="Fields"
      size="md"
      valiationPathPrefix={`embeds.${embedIndex}.fields`}
      className="space-y-3"
    >
      {fields.map((id, i) => (
        <EmbedField
          key={id}
          embedIndex={embedIndex}
          embedId={embedId}
          fieldIndex={i}
          fieldId={id}
        />
      ))}
      <div className="space-x-3">
        <Button
          onClick={() =>
            addField(embedIndex, {
              id: getUniqueId(),
              name: "",
              value: "",
            })
          }
          size="sm"
        >
          Add Field
        </Button>
        <Button
          onClick={() => clearFields(embedIndex)}
          variant="destructive"
          size="sm"
        >
          Clear Fields
        </Button>
      </div>
    </CollapsibleSection>
  );
}
