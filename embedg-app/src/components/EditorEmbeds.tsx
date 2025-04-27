import { useCurrentMessageStore } from "../state/message";
import EditorEmbed from "./EditorEmbed";
import { shallow } from "zustand/shallow";
import { useCollapsedStatesStore } from "../state/collapsed";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import clsx from "clsx";

export default function EditorEmbeds() {
  const embeds = useCurrentMessageStore(
    (state) => state.embeds.map((e) => e.id),
    shallow
  );
  const addEmbed = useCurrentMessageStore((state) => state.addEmbed);
  const clearEmbeds = useCurrentMessageStore((state) => state.clearEmbeds);

  return (
    <Collapsable
      id="embeds"
      title="Embeds"
      size="large"
      validationPathPrefix="embeds"
      extra={
        <div className="text-sm italic font-light text-gray-400">
          {embeds.length} / 10
        </div>
      }
    >
      <AutoAnimate className="space-y-3 mb-3">
        {embeds.map((id, i) => (
          <div key={id}>
            <EditorEmbed embedIndex={i} embedId={id} />
          </div>
        ))}
      </AutoAnimate>
      <div className="space-x-3">
        <button
          className={clsx(
            "px-3 py-2 rounded text-white",
            embeds.length < 10
              ? "bg-blurple hover:bg-blurple-dark"
              : "bg-dark-3 cursor-not-allowed"
          )}
          onClick={() =>
            embeds.length < 10 &&
            addEmbed({
              id: getUniqueId(),
              description: "",
              fields: [],
            })
          }
        >
          Add Embed
        </button>
        <button
          className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
          onClick={clearEmbeds}
        >
          Clear Embeds
        </button>
      </div>
    </Collapsable>
  );
}
