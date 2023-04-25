import { useCurrentMessageStore } from "../state/message";
import EditorEmbed from "./EditorEmbed";
import { shallow } from "zustand/shallow";
import { useCollapsedStatesStore } from "../state/collapsed";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";

export default function EditorEmbeds() {
  const embeds = useCurrentMessageStore(
    (state) => state.embeds.map((e) => e.id),
    shallow
  );
  const addEmbed = useCurrentMessageStore((state) => state.addEmbed);
  const clearEmbeds = useCurrentMessageStore((state) => state.clearEmbeds);

  const clearCollapsedWithPrefix = useCollapsedStatesStore(
    (state) => state.clearCollapsedWithPrefix
  );

  function clear() {
    clearEmbeds();
    clearCollapsedWithPrefix("embeds");
  }

  return (
    <Collapsable
      id="embeds"
      title="Embeds"
      size="large"
      valiationPathPrefix="embeds"
    >
      <AutoAnimate>
        {embeds.map((id, i) => (
          <div key={id}>
            <EditorEmbed embedIndex={i} embedId={id} />
          </div>
        ))}
      </AutoAnimate>
      <div className="space-x-3">
        <button
          className="bg-blurple px-3 py-2 rounded text-white hover:bg-blurple-dark"
          onClick={() =>
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
          onClick={clear}
        >
          Clear Embeds
        </button>
      </div>
    </Collapsable>
  );
}
