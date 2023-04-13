import { useCurrentMessageStore } from "../state/message";
import EditorEmbed from "./EditorEmbed";
import { shallow } from "zustand/shallow";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useCollapsedState, useCollapsedStatesStore } from "../state/collapsed";
import clsx from "clsx";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";

export default function EditorEmbedsSection() {
  const embeds = useCurrentMessageStore(
    (state) => state.embeds.map((e) => e.id),
    shallow
  );
  const addEmbed = useCurrentMessageStore((state) => state.addEmbed);
  const clearEmbeds = useCurrentMessageStore((state) => state.clearEmbeds);

  const [collapsed, toggleCollapsed] = useCollapsedState("embeds");

  const clearCollapsedWithPrefix = useCollapsedStatesStore(
    (state) => state.clearCollapsedWithPrefix
  );

  function clear() {
    clearEmbeds();
    clearCollapsedWithPrefix("embeds");
  }

  return (
    <AutoAnimate>
      <div
        className="flex items-center text-gray-300 space-x-1 cursor-pointer"
        onClick={() => toggleCollapsed()}
      >
        <ChevronRightIcon
          className={clsx(
            "w-7 h-7 transition-transform duration-300",
            !collapsed && "rotate-90"
          )}
        />
        <div className="text-lg font-medium">Embeds</div>
      </div>
      {!collapsed && (
        <div className="mt-2">
          <AutoAnimate>
            {embeds.map((id, i) => (
              <div key={id}>
                <EditorEmbed embedIndex={i} />
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
        </div>
      )}
    </AutoAnimate>
  );
}
