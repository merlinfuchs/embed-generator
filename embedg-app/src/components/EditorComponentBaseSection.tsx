import {
  type NodeId,
  type SectionNode,
  useChildIds,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeScope, slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentBaseButton from "./EditorComponentBaseButton";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";
import EditorComponentBaseThumbnail from "./EditorComponentBaseThumbnail";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentBaseSection({
  id,
  title = "Section",
  size = "medium",
}: Props) {
  const data = useNode<SectionNode>(id);
  const childIds = useChildIds(id, "components");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStore.getState();

  const accessoryType = useDocumentStore(
    (state) => state.nodes[data?.accessoryId ?? ""]?.type,
  );

  if (!data) return null;

  function setAccessoryType(type: number) {
    if (type === 11) {
      insert(id, "accessory", "end", {
        type: "thumbnail",
        media: { url: "" },
      });
    } else if (type === 2) {
      insert(id, "accessory", "end", {
        type: "button",
        label: "",
        style: 1,
      });
    }
  }

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<SectionNode>(id)}
      title={title}
      size={size}
      {...actions}
      extra={
        <div className="text-gray-500 truncate flex space-x-2 pl-1">
          <div>-</div>
          <div className="truncate">Text</div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex">
            <div className="uppercase text-gray-300 text-sm font-medium">
              Accessory Type
            </div>
          </div>
          <select
            className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
            value={accessoryType === "button" ? "2" : "11"}
            onChange={(v) => setAccessoryType(parseInt(v.target.value, 10))}
          >
            <option value="11">Thumbnail</option>
            <option value="2">Button</option>
          </select>
        </div>
        <div>
          {data.accessoryId &&
            (accessoryType === "button" ? (
              <EditorComponentBaseButton
                id={data.accessoryId}
                title="Accessory"
              />
            ) : (
              <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5">
                <EditorComponentBaseThumbnail
                  id={data.accessoryId}
                  title="Accessory"
                />
              </div>
            ))}
        </div>

        <Collapsable
          id={`${id}.components`}
          validationPathPrefix={slotScope(id, "components")}
          title="Components"
          extra={
            <div className="text-sm italic font-light text-gray-400">
              {childIds.length} / 3
            </div>
          }
        >
          <AutoAnimate>
            {childIds.map((childId) => (
              <div
                className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
                key={childId}
              >
                <EditorComponentBaseTextDisplay id={childId} />
              </div>
            ))}
            <div>
              <div className="space-x-3 mt-3">
                {childIds.length < 3 ? (
                  <button
                    type="button"
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                    onClick={() =>
                      insert(id, "components", "end", {
                        type: "textDisplay",
                        content: "",
                      })
                    }
                  >
                    Add Text
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                  >
                    Add Text
                  </button>
                )}
                <button
                  type="button"
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                  onClick={() => removeChildren(id, "components")}
                >
                  Clear Texts
                </button>
              </div>
            </div>
          </AutoAnimate>
        </Collapsable>
      </div>
    </EditorComponentCollapsable>
  );
}
