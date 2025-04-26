import { useCurrentMessageStore } from "../state/message";
import EditorComponentMediaGallery from "./EditorComponentRootMediaGallery";
import EditorComponentActionRow from "./EditorComponentRootActionRow";
import EditorComponentTextDisplay from "./EditorComponentRootTextDisplay";
import EditorComponentSection from "./EditorComponentRootSection";
import EditorComponentChildButton from "./EditorComponentChildButton";
import EditorComponentChildSelectMenu from "./EditorComponentChildSelectMenu";
import EditorComponentChildTextDisplay from "./EditorComponentChildTextDisplay";

interface Props {
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

export default function EditorComponentChild({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const root = useCurrentMessageStore((state) => state.components[rootIndex]);

  if (!root || (root.type !== 9 && root.type !== 1)) {
    return null;
  }

  const child = root.components[childIndex];

  if (!child) {
    return null;
  }

  if (child.type === 2) {
    return (
      <EditorComponentChildButton
        rootIndex={rootIndex}
        rootId={rootId}
        childIndex={childIndex}
        childId={childId}
      />
    );
  } else if (child.type === 3) {
    return (
      <EditorComponentChildSelectMenu
        rootIndex={rootIndex}
        rootId={rootId}
        childIndex={childIndex}
        childId={childId}
      />
    );
  } else if (child.type === 10) {
    return (
      <EditorComponentChildTextDisplay
        rootIndex={rootIndex}
        rootId={rootId}
        childIndex={childIndex}
        childId={childId}
      />
    );
  } else {
    return <div>Unknown child component type</div>;
  }
}
