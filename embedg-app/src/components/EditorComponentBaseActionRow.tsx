import {
  type ActionRowNode,
  type NodeId,
  useChildIds,
  useDocumentStore,
  useNodeActions,
} from "../state/document";
import { nodeScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentBaseButton from "./EditorComponentBaseButton";
import EditorComponentBaseSelectMenu from "./EditorComponentBaseSelectMenu";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentBaseActionRow({
  id,
  title = "Action Row",
}: Props) {
  const childIds = useChildIds(id, "components");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStore.getState();
  // A row holds either buttons or a single select menu, never both.
  const isButtonRow = useDocumentStore(
    (state) => state.nodes[childIds[0]]?.type !== "selectMenu",
  );

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<ActionRowNode>(id)}
      title={title}
      size="large"
      {...actions}
      extra={
        <div className="text-gray-500 truncate flex space-x-2 pl-1">
          <div>-</div>
          <div className="truncate">
            {isButtonRow ? "Buttons" : "Select Menu"}
          </div>
        </div>
      }
    >
      <AutoAnimate>
        {childIds.map((childId) =>
          isButtonRow ? (
            <EditorComponentBaseButton key={childId} id={childId} />
          ) : (
            <EditorComponentBaseSelectMenu key={childId} id={childId} />
          ),
        )}
        {isButtonRow && (
          <div>
            <div className="space-x-3 mt-3">
              {childIds.length < 5 ? (
                <button
                  type="button"
                  className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                  onClick={() =>
                    insert(id, "components", "end", {
                      type: "button",
                      style: 2,
                      label: "",
                    })
                  }
                >
                  Add Button
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                >
                  Add Button
                </button>
              )}
              <button
                type="button"
                className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                onClick={() => removeChildren(id, "components")}
              >
                Clear Buttons
              </button>
            </div>
          </div>
        )}
      </AutoAnimate>
    </EditorComponentCollapsable>
  );
}
