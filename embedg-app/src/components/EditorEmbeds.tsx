import { slotLimit, useChildIds, useDocumentStore } from "../state/document";
import { AutoAnimate } from "../util/autoAnimate";
import { slotScope } from "../state/validationError";
import Collapsable from "./Collapsable";
import EditorSlotButtons from "./EditorSlotButtons";
import EditorEmbed from "./EditorEmbed";

export default function EditorEmbeds() {
  const rootId = useDocumentStore((state) => state.rootId);
  const embedIds = useChildIds(rootId, "embeds");
  const { insert, removeChildren } = useDocumentStore.getState();

  return (
    <Collapsable
      id="embeds"
      title="Embeds"
      size="large"
      validationPathPrefix={slotScope(rootId, "embeds")}
      extra={
        <div className="text-sm italic font-light text-gray-400">
          {embedIds.length} / {slotLimit("message", "embeds")}
        </div>
      }
    >
      <AutoAnimate className="space-y-3 mb-3">
        {embedIds.map((id) => (
          <div key={id}>
            <EditorEmbed id={id} />
          </div>
        ))}
      </AutoAnimate>
      <EditorSlotButtons
        addLabel="Add Embed"
        clearLabel="Clear Embeds"
        canAdd={embedIds.length < slotLimit("message", "embeds")}
        onAdd={() =>
          insert(rootId, "embeds", "end", { type: "embed", description: "" })
        }
        onClear={() => removeChildren(rootId, "embeds")}
      />
    </Collapsable>
  );
}
