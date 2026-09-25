import clsx from "clsx";
import {
  type EmbedFieldNode,
  slotLimit,
  useChildIds,
  useDocumentStoreApi,
  useDocument,
} from "../state/document";
import { EMBEDS_TEXT_LIMIT, embedTextLength } from "../discord/schema";
import { AutoAnimate } from "../util/autoAnimate";
import { slotScope } from "../state/validationError";
import Collapsable from "./Collapsable";
import EditorSlotButtons from "./EditorSlotButtons";
import EditorEmbed from "./EditorEmbed";

export default function EditorEmbeds() {
  const rootId = useDocument((state) => state.rootId);
  const embedIds = useChildIds(rootId, "embeds");
  const { insert, removeChildren } = useDocumentStoreApi().getState();

  const textLength = useDocument((state) =>
    embedIds.reduce((sum, id) => {
      const embed = state.nodes[id];
      if (embed?.type !== "embed") return sum;

      const fields = embed.fieldIds.map(
        (fieldId) => state.nodes[fieldId] as EmbedFieldNode,
      );
      return sum + embedTextLength(embed, fields);
    }, 0),
  );

  return (
    <Collapsable
      id="embeds"
      title="Embeds"
      size="large"
      validationPathPrefix={slotScope(rootId, "embeds")}
      extra={
        <div className="flex space-x-2">
          <div className="text-sm italic font-light text-mist-400">
            {embedIds.length} / {slotLimit("message", "embeds")}
          </div>
          <div
            className={clsx(
              "text-sm italic font-light",
              textLength <= EMBEDS_TEXT_LIMIT ? "text-mist-400" : "text-red",
            )}
          >
            {textLength} / {EMBEDS_TEXT_LIMIT} characters
          </div>
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
