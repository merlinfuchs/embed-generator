import { useCurrentMessageStore } from "../state/message";
import EditorComponentRootMediaGallery from "./EditorComponentRootMediaGallery";
import EditorComponentRootActionRow from "./EditorComponentRootActionRow";
import EditorComponentRootTextDisplay from "./EditorComponentRootTextDisplay";
import EditorComponentRootSection from "./EditorComponentRootSection";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentRoot({ rootIndex, rootId }: Props) {
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
    return (
      <EditorComponentRootTextDisplay rootIndex={rootIndex} rootId={rootId} />
    );
  } else if (root.type === 12) {
    return (
      <EditorComponentRootMediaGallery rootIndex={rootIndex} rootId={rootId} />
    );
  } else {
    return <div>Unknown root component type: {root.type}</div>;
  }
}
