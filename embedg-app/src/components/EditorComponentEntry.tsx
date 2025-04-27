import { useCurrentMessageStore } from "../state/message";
import EditorComponentRootMediaGallery from "./EditorComponentRootMediaGallery";
import EditorComponentRootActionRow from "./EditorComponentActionRow";
import EditorComponentRootSection from "./EditorComponentRootSection";
import EditorComponentTextDisplay from "./EditorComponentTextDisplay";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentEntry({ rootIndex, rootId }: Props) {
  const root = useCurrentMessageStore((state) => state.components[rootIndex]);

  if (!root) {
    return null;
  }

  if (root.type === 1) {
    return (
      <EditorComponentRootActionRow rootIndex={rootIndex} rootId={rootId} />
    );
  } else if (root.type === 9) {
    return <EditorComponentRootSection rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 10) {
    return <EditorComponentTextDisplay rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 12) {
    return (
      <EditorComponentRootMediaGallery rootIndex={rootIndex} rootId={rootId} />
    );
  } else {
    return <div>Unknown root component type: {root.type}</div>;
  }
}
