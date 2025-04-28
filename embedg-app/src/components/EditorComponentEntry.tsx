import { useCurrentMessageStore } from "../state/message";
import EditorComponentRootActionRow from "./EditorComponentActionRow";
import EditorComponentSection from "./EditorComponentSection";
import EditorComponentSeparator from "./EditorComponentSeparator";
import EditorComponentTextDisplay from "./EditorComponentTextDisplay";
import EditorComponentFile from "./EditorComponentFile";
import EditorComponentGallery from "./EditorComponentGallery";
import EditorComponentContainer from "./EditorComponentContainer";

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
    return <EditorComponentSection rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 10) {
    return <EditorComponentTextDisplay rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 12) {
    return <EditorComponentGallery rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 13) {
    return <EditorComponentFile rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 14) {
    return <EditorComponentSeparator rootIndex={rootIndex} rootId={rootId} />;
  } else if (root.type === 17) {
    return <EditorComponentContainer rootIndex={rootIndex} rootId={rootId} />;
  } else {
    return <div>Unknown root component type: {root.type}</div>;
  }
}
