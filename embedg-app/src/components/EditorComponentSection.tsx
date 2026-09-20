import { NESTED_CARD } from "./editorCard";
import {
  type NodeId,
  type SectionNode,
  useChildIds,
  useNode,
  useNodeActions,
  slotLimit,
  useDocumentStoreApi,
  useDocument,
} from "../state/document";
import { useEditorMode } from "../state/editorMode";
import { nodeScope, slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentTextDisplay from "./EditorComponentTextDisplay";
import clsx from "clsx";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEntry from "./EditorComponentEntry";
import EditorSlotButtons from "./EditorSlotButtons";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentSection({
  id,
  title = "Section",
  size = "medium",
}: Props) {
  const data = useNode<SectionNode>(id);
  const childIds = useChildIds(id, "components");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStoreApi().getState();

  const linkOnly = useEditorMode() === "componentEmbed";

  const accessoryType = useDocument(
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
        style: linkOnly ? 5 : 1,
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
      subtitle="Text"
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex">
            <div className="uppercase text-mist-300 text-sm font-medium">
              Accessory Type
            </div>
          </div>
          <select
            aria-label="Accessory Type"
            className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
            value={accessoryType === "button" ? "2" : "11"}
            onChange={(v) => setAccessoryType(parseInt(v.target.value, 10))}
          >
            <option value="11">Thumbnail</option>
            <option value="2">Button</option>
          </select>
        </div>
        <div>
          {data.accessoryId && (
            <div className={clsx(accessoryType === "thumbnail" && NESTED_CARD)}>
              <EditorComponentEntry id={data.accessoryId} title="Accessory" />
            </div>
          )}
        </div>

        <Collapsable
          id={`${id}.components`}
          validationPathPrefix={slotScope(id, "components")}
          title="Components"
          extra={
            <div className="text-sm italic font-light text-mist-400">
              {childIds.length} / {slotLimit("section", "components")}
            </div>
          }
        >
          <AutoAnimate>
            {childIds.map((childId) => (
              <div className={NESTED_CARD} key={childId}>
                <EditorComponentTextDisplay id={childId} />
              </div>
            ))}
            <EditorSlotButtons
              addLabel="Add Text"
              clearLabel="Clear Texts"
              canAdd={childIds.length < slotLimit("section", "components")}
              onAdd={() =>
                insert(id, "components", "end", {
                  type: "textDisplay",
                  content: "",
                })
              }
              onClear={() => removeChildren(id, "components")}
            />
          </AutoAnimate>
        </Collapsable>
      </div>
    </EditorComponentCollapsable>
  );
}
