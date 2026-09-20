import {
  type ActionRowNode,
  type NodeId,
  useChildIds,
  useNodeActions,
  slotLimit,
  useDocumentStoreApi,
  useDocument,
} from "../state/document";
import { useEditorCapabilities } from "../state/editorCapabilities";
import { nodeScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEntry from "./EditorComponentEntry";
import EditorSlotButtons from "./EditorSlotButtons";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentActionRow({
  id,
  title = "Action Row",
}: Props) {
  const childIds = useChildIds(id, "components");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStoreApi().getState();
  const { linkButtonsOnly } = useEditorCapabilities();
  // A row holds either buttons or a single select menu, never both.
  const isButtonRow = useDocument(
    (state) => state.nodes[childIds[0]]?.type !== "selectMenu",
  );

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<ActionRowNode>(id)}
      title={title}
      size="large"
      {...actions}
      subtitle={isButtonRow ? "Buttons" : "Select Menu"}
    >
      <AutoAnimate>
        {childIds.map((childId) => (
          <EditorComponentEntry key={childId} id={childId} />
        ))}
        {isButtonRow && (
          <EditorSlotButtons
            addLabel="Add Button"
            clearLabel="Clear Buttons"
            canAdd={childIds.length < slotLimit("actionRow", "components")}
            onAdd={() =>
              insert(id, "components", "end", {
                type: "button",
                style: linkButtonsOnly ? 5 : 2,
                label: "",
              })
            }
            onClear={() => removeChildren(id, "components")}
          />
        )}
      </AutoAnimate>
    </EditorComponentCollapsable>
  );
}
