import clsx from "clsx";
import { useChildIds, useDocumentStore } from "../state/document";
import { AutoAnimate } from "../util/autoAnimate";
import { slotScope } from "../state/validationError";
import Collapsable from "./Collapsable";
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
          {embedIds.length} / 10
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
      <div className="space-x-3">
        <button
          type="button"
          className={clsx(
            "px-3 py-2 rounded text-white",
            embedIds.length < 10
              ? "bg-blurple hover:bg-blurple-dark"
              : "bg-dark-3 cursor-not-allowed",
          )}
          onClick={() =>
            embedIds.length < 10 &&
            insert(rootId, "embeds", "end", {
              type: "embed",
              description: "",
            })
          }
        >
          Add Embed
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
          onClick={() => removeChildren(rootId, "embeds")}
        >
          Clear Embeds
        </button>
      </div>
    </Collapsable>
  );
}
