import clsx from "clsx";
import { type NodeId, useNode } from "../state/document";
import EditorComponentBaseActionRow from "./EditorComponentBaseActionRow";
import EditorComponentBaseContainer from "./EditorComponentBaseContainer";
import EditorComponentBaseFile from "./EditorComponentBaseFile";
import EditorComponentBaseMediaGallery from "./EditorComponentBaseMediaGallery";
import EditorComponentBaseSection from "./EditorComponentBaseSection";
import EditorComponentBaseSeparator from "./EditorComponentBaseSeparator";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";

interface Props {
  id: NodeId;
  /** Top level components carry their own card styling. */
  root?: boolean;
}

const PADDED = "bg-dark-3 p-3 rounded-md";
const CARD = "bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow";

export default function EditorComponentEntry({ id, root }: Props) {
  const node = useNode(id);

  if (!node) return null;

  switch (node.type) {
    case "actionRow":
      return (
        <div className={clsx(root && PADDED)}>
          <EditorComponentBaseActionRow id={id} />
        </div>
      );
    case "section":
      return (
        <div className={clsx(root && PADDED)}>
          <EditorComponentBaseSection id={id} />
        </div>
      );
    case "mediaGallery":
      return (
        <div className={clsx(root && PADDED)}>
          <EditorComponentBaseMediaGallery id={id} />
        </div>
      );
    case "textDisplay":
      return (
        <div className={clsx(root && CARD)}>
          <EditorComponentBaseTextDisplay id={id} />
        </div>
      );
    case "separator":
      return (
        <div className={clsx(root && CARD)}>
          <EditorComponentBaseSeparator id={id} />
        </div>
      );
    case "file":
      return (
        <div className={clsx(root && CARD)}>
          <EditorComponentBaseFile id={id} />
        </div>
      );
    case "container":
      return <EditorComponentBaseContainer id={id} />;
    default:
      return <div>Unknown component type: {node.type}</div>;
  }
}
